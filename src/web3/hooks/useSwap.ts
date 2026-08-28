import { useAccount } from "wagmi";
import { lightSwapRouterAbi } from "../abi/LightSwapRouter";
import { dexContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

type TokenKey = "lightUSD" | "lightDAI";

const DEFAULT_DEADLINE_MINUTES = 20;

/** Applies a basis-point slippage tolerance to an expected output amount. */
export function applySlippage(amountOut: bigint, toleranceBps: number): bigint {
  return (amountOut * BigInt(10_000 - toleranceBps)) / 10_000n;
}

export function useSwap(tokenIn: TokenKey, tokenOut: TokenKey) {
  const { address } = useAccount();
  const tx = useTransactionState();

  const swap = (amountIn: bigint, minAmountOut: bigint) => {
    if (!address || !dexContracts.router.address) return;
    const tokenInAddr = dexContracts[tokenIn].address;
    const tokenOutAddr = dexContracts[tokenOut].address;
    if (!tokenInAddr || !tokenOutAddr) return;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60);

    return tx.send({
      address: dexContracts.router.address,
      abi: lightSwapRouterAbi,
      functionName: "swapExactTokensForTokens",
      args: [amountIn, minAmountOut, [tokenInAddr, tokenOutAddr], address, deadline],
    });
  };

  return { ...tx, swap };
}
