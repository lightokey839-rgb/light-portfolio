import { usePublicClient, useReadContract, useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { daoContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

export const PROPOSAL_STATE_LABELS = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
] as const;

export type ProposalSummary = {
  proposalId: bigint;
  proposer: `0x${string}`;
  targets: `0x${string}`[];
  values: bigint[];
  calldatas: `0x${string}`[];
  voteStart: bigint;
  voteEnd: bigint;
  description: string;
};

const PROPOSAL_CREATED_EVENT = {
  type: "event",
  name: "ProposalCreated",
  inputs: [
    { name: "proposalId", type: "uint256", indexed: false },
    { name: "proposer", type: "address", indexed: false },
    { name: "targets", type: "address[]", indexed: false },
    { name: "values", type: "uint256[]", indexed: false },
    { name: "signatures", type: "string[]", indexed: false },
    { name: "calldatas", type: "bytes[]", indexed: false },
    { name: "voteStart", type: "uint256", indexed: false },
    { name: "voteEnd", type: "uint256", indexed: false },
    { name: "description", type: "string", indexed: false },
  ],
} as const;

/** Discovers every proposal ever created by replaying ProposalCreated logs from the governor's deployment block. */
export function useProposals() {
  const publicClient = usePublicClient();
  const governor = daoContracts.governor;

  return useQuery({
    queryKey: ["light-dao-proposals", governor.address],
    enabled: Boolean(governor.address && publicClient),
    queryFn: async () => {
      if (!governor.address || !publicClient) return [] as ProposalSummary[];
      const logs = await publicClient.getLogs({
        address: governor.address,
        event: PROPOSAL_CREATED_EVENT,
        fromBlock: governor.deployedAtBlock ? BigInt(governor.deployedAtBlock) : 0n,
        toBlock: "latest",
      });
      return logs
        .map((log) => log.args as unknown as ProposalSummary)
        .sort((a, b) => (a.voteStart < b.voteStart ? 1 : -1)); // newest first
    },
  });
}

export function useProposalState(proposalId: bigint) {
  const governor = daoContracts.governor;
  return useReadContract({
    address: governor.address ?? undefined,
    abi: governor.abi,
    functionName: "state",
    args: [proposalId],
    query: { enabled: Boolean(governor.address), refetchInterval: 15_000 },
  });
}

export function useProposalVotes(proposalId: bigint) {
  const governor = daoContracts.governor;
  return useReadContract({
    address: governor.address ?? undefined,
    abi: governor.abi,
    functionName: "proposalVotes",
    args: [proposalId],
    query: { enabled: Boolean(governor.address), refetchInterval: 15_000 },
  });
}

export function useHasVoted(proposalId: bigint) {
  const { address } = useAccount();
  const governor = daoContracts.governor;
  return useReadContract({
    address: governor.address ?? undefined,
    abi: governor.abi,
    functionName: "hasVoted",
    args: address ? [proposalId, address] : undefined,
    query: { enabled: Boolean(governor.address && address) },
  });
}

export function useQuorum(atBlock: bigint | undefined) {
  const governor = daoContracts.governor;
  return useReadContract({
    address: governor.address ?? undefined,
    abi: governor.abi,
    functionName: "quorum",
    args: atBlock !== undefined ? [atBlock] : undefined,
    query: { enabled: Boolean(governor.address && atBlock !== undefined) },
  });
}

/**
 * Creates a treasury-transfer proposal: "send `amountWei` ETH from the
 * DAO treasury (the timelock) to `recipient`". This is the one concrete
 * proposal shape the UI exposes — arbitrary-calldata proposals are
 * possible with this same Governor but deliberately not exposed in the
 * UI, since accepting free-form calldata from a form invites mistakes
 * this demo doesn't need to risk.
 */
export function useCreateTreasuryProposal() {
  const governor = daoContracts.governor;
  const tx = useTransactionState();

  const propose = (recipient: `0x${string}`, amountWei: bigint, description: string) => {
    if (!governor.address) return;
    return tx.send({
      address: governor.address,
      abi: governor.abi,
      functionName: "propose",
      args: [[recipient], [amountWei], ["0x"], description],
    });
  };

  return { ...tx, propose };
}

export function useCastVote() {
  const governor = daoContracts.governor;
  const tx = useTransactionState();

  // support: 0 = Against, 1 = For, 2 = Abstain (OpenZeppelin Governor convention)
  const vote = (proposalId: bigint, support: 0 | 1 | 2) => {
    if (!governor.address) return;
    return tx.send({ address: governor.address, abi: governor.abi, functionName: "castVote", args: [proposalId, support] });
  };

  return { ...tx, vote };
}

export function useQueueProposal() {
  const governor = daoContracts.governor;
  const tx = useTransactionState();

  const queue = (targets: `0x${string}`[], values: bigint[], calldatas: `0x${string}`[], descriptionHash: `0x${string}`) => {
    if (!governor.address) return;
    return tx.send({ address: governor.address, abi: governor.abi, functionName: "queue", args: [targets, values, calldatas, descriptionHash] });
  };

  return { ...tx, queue };
}

export function useExecuteProposal() {
  const governor = daoContracts.governor;
  const tx = useTransactionState();

  const execute = (targets: `0x${string}`[], values: bigint[], calldatas: `0x${string}`[], descriptionHash: `0x${string}`) => {
    if (!governor.address) return;
    return tx.send({ address: governor.address, abi: governor.abi, functionName: "execute", args: [targets, values, calldatas, descriptionHash] });
  };

  return { ...tx, execute };
}
