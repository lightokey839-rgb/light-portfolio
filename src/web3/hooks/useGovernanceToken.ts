import { useAccount, useReadContract } from "wagmi";
import { daoContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

export function useGovTokenBalance() {
  const { address } = useAccount();
  const token = daoContracts.token;
  return useReadContract({
    address: token.address ?? undefined,
    abi: token.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token.address && address) },
  });
}

export function useVotingPower() {
  const { address } = useAccount();
  const token = daoContracts.token;
  return useReadContract({
    address: token.address ?? undefined,
    abi: token.abi,
    functionName: "getVotes",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token.address && address) },
  });
}

/** Whether the connected wallet has delegated (to itself or anyone) — required before its balance counts as voting power. */
export function useDelegationStatus() {
  const { address } = useAccount();
  const token = daoContracts.token;
  const delegate = useReadContract({
    address: token.address ?? undefined,
    abi: token.abi,
    functionName: "delegates",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(token.address && address) },
  });
  const hasDelegated = Boolean(delegate.data && delegate.data !== "0x0000000000000000000000000000000000000000");
  return { ...delegate, hasDelegated, delegatedTo: delegate.data as string | undefined };
}

export function useDelegate() {
  const { address } = useAccount();
  const token = daoContracts.token;
  const tx = useTransactionState();

  const delegateToSelf = () => {
    if (!token.address || !address) return;
    return tx.send({ address: token.address, abi: token.abi, functionName: "delegate", args: [address] });
  };

  return { ...tx, delegateToSelf };
}

export function useGovFaucet() {
  const token = daoContracts.token;
  const tx = useTransactionState();

  const claim = () => {
    if (!token.address) return;
    return tx.send({ address: token.address, abi: token.abi, functionName: "faucet", args: [] });
  };

  return { ...tx, claim };
}
