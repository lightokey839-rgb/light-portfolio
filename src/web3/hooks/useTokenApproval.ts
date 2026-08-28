import { useAccount, useReadContract } from "wagmi";
import { lightTestTokenAbi } from "../abi/LightTestToken";
import { dexContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

type TokenKey = "lightUSD" | "lightDAI";

/** Current on-chain balance of a demo token for the connected wallet. */
export function useTokenBalance(token: TokenKey) {
  const { address } = useAccount();
  const contract = dexContracts[token];
  return useReadContract({
    address: contract.address ?? undefined,
    abi: lightTestTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(contract.address && address) },
  });
}

/** How much of a demo token the router is currently allowed to spend on the user's behalf. */
export function useTokenAllowance(token: TokenKey) {
  const { address } = useAccount();
  const contract = dexContracts[token];
  return useReadContract({
    address: contract.address ?? undefined,
    abi: lightTestTokenAbi,
    functionName: "allowance",
    args: address && dexContracts.router.address ? [address, dexContracts.router.address] : undefined,
    query: { enabled: Boolean(contract.address && dexContracts.router.address && address) },
  });
}

/**
 * Drives an explicit, exact-amount `approve(router, amount)` call. Never
 * requests MaxUint256 automatically — the caller decides the approved
 * amount, keeping the approval risk visible and bounded to what the user
 * is actually about to trade (portfolio requirement: surface token
 * approval risk rather than hide it behind an "infinite approve").
 */
export function useApproveRouter(token: TokenKey) {
  const contract = dexContracts[token];
  const tx = useTransactionState();

  const approve = (amount: bigint) => {
    if (!contract.address || !dexContracts.router.address) return;
    return tx.send({
      address: contract.address,
      abi: lightTestTokenAbi,
      functionName: "approve",
      args: [dexContracts.router.address, amount],
    });
  };

  return { ...tx, approve };
}
