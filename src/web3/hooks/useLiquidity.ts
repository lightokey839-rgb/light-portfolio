import { useAccount, useReadContract } from "wagmi";
import { lightSwapRouterAbi } from "../abi/LightSwapRouter";
import { lightSwapPairAbi } from "../abi/LightSwapPair";
import { dexContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

const DEADLINE_MINUTES = 20;

function deadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60);
}

export function usePairReserves() {
  return useReadContract({
    address: dexContracts.pair.address ?? undefined,
    abi: lightSwapPairAbi,
    functionName: "getReserves",
    query: { enabled: Boolean(dexContracts.pair.address) },
  });
}

export function useLpBalance() {
  const { address } = useAccount();
  return useReadContract({
    address: dexContracts.pair.address ?? undefined,
    abi: lightSwapPairAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(dexContracts.pair.address && address) },
  });
}

export function useAddLiquidity() {
  const { address } = useAccount();
  const tx = useTransactionState();

  const add = (amountLusd: bigint, amountLdai: bigint, minLusd: bigint, minLdai: bigint) => {
    if (!address || !dexContracts.router.address || !dexContracts.lightUSD.address || !dexContracts.lightDAI.address) {
      return;
    }
    return tx.send({
      address: dexContracts.router.address,
      abi: lightSwapRouterAbi,
      functionName: "addLiquidity",
      args: [
        dexContracts.lightUSD.address,
        dexContracts.lightDAI.address,
        amountLusd,
        amountLdai,
        minLusd,
        minLdai,
        address,
        deadline(),
      ],
    });
  };

  return { ...tx, add };
}

export function useRemoveLiquidity() {
  const { address } = useAccount();
  const tx = useTransactionState();

  const remove = (liquidity: bigint, minLusd: bigint, minLdai: bigint) => {
    if (!address || !dexContracts.router.address || !dexContracts.lightUSD.address || !dexContracts.lightDAI.address) {
      return;
    }
    return tx.send({
      address: dexContracts.router.address,
      abi: lightSwapRouterAbi,
      functionName: "removeLiquidity",
      args: [dexContracts.lightUSD.address, dexContracts.lightDAI.address, liquidity, minLusd, minLdai, address, deadline()],
    });
  };

  return { ...tx, remove };
}
