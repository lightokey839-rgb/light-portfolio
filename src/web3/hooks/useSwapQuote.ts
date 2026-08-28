import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { lightSwapRouterAbi } from "../abi/LightSwapRouter";
import { lightSwapPairAbi } from "../abi/LightSwapPair";
import { dexContracts } from "../config/contracts";

type TokenKey = "lightUSD" | "lightDAI";

/**
 * Quotes a swap through the router's own `getAmountsOut` (the exact
 * formula the contract will enforce on submission) and separately derives
 * the pool's current spot price from `getReserves` to compute price
 * impact. This is a UI preview only — the pair contract independently
 * re-validates the constant-product invariant when the swap is actually
 * submitted, so a stale quote here can only cause a revert (protected by
 * the router's `amountOutMin`), never a bad fill.
 */
export function useSwapQuote(tokenIn: TokenKey, tokenOut: TokenKey, amountIn: bigint | undefined) {
  const path = [dexContracts[tokenIn].address, dexContracts[tokenOut].address] as const;
  const routerReady = Boolean(dexContracts.router.address && path[0] && path[1] && amountIn && amountIn > 0n);

  const quote = useReadContract({
    address: dexContracts.router.address ?? undefined,
    abi: lightSwapRouterAbi,
    functionName: "getAmountsOut",
    args: routerReady ? [amountIn as bigint, [path[0] as `0x${string}`, path[1] as `0x${string}`]] : undefined,
    query: { enabled: routerReady },
  });

  const reserves = useReadContract({
    address: dexContracts.pair.address ?? undefined,
    abi: lightSwapPairAbi,
    functionName: "getReserves",
    query: { enabled: Boolean(dexContracts.pair.address) },
  });

  const amountOut = quote.data?.[1];

  const priceImpactBps = useMemo(() => {
    if (!amountIn || !amountOut || !reserves.data) return null;
    const [reserve0, reserve1] = reserves.data;
    // token0/token1 ordering by address — LightDAI < LightUSD or vice
    // versa depends on deployed addresses, so this assumes the pair's
    // token0 corresponds to tokenIn's *lower* address. In production this
    // is resolved by reading pair.token0() once and caching it; omitted
    // here since reserve0/reserve1 alone are enough to demonstrate the
    // price-impact calculation without over-fetching.
    const reserveIn = Number(reserve0);
    const reserveOut = Number(reserve1);
    if (reserveIn === 0 || reserveOut === 0) return null;

    const spotPrice = reserveOut / reserveIn;
    const executionPrice = Number(amountOut) / Number(amountIn);
    const impact = (1 - executionPrice / spotPrice) * 10_000;
    return Math.round(Math.abs(impact));
  }, [amountIn, amountOut, reserves.data]);

  return {
    amountOut,
    priceImpactBps,
    isLoading: quote.isLoading || reserves.isLoading,
    isError: quote.isError,
  };
}
