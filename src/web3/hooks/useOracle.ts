import { usePublicClient, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { oracleContracts } from "../config/contracts";

export type ValidatedPrice = { price: bigint; decimals: number; updatedAt: bigint; roundId: bigint };
export type Snapshot = { price: bigint; timestamp: bigint };

/** Reads the current validated price through LightPriceConsumer — reverts (surfaced as an error state) if the feed data fails staleness/validity checks. */
export function useLatestPrice() {
  const consumer = oracleContracts.consumer;
  return useReadContract({
    address: consumer.address ?? undefined,
    abi: consumer.abi,
    functionName: "getValidatedPrice",
    query: { enabled: Boolean(consumer.address), refetchInterval: 30_000 },
  });
}

export function useFeedDescription() {
  const consumer = oracleContracts.consumer;
  return useReadContract({
    address: consumer.address ?? undefined,
    abi: consumer.abi,
    functionName: "description",
    query: { enabled: Boolean(consumer.address) },
  });
}

const SNAPSHOT_TAKEN_EVENT = {
  type: "event",
  name: "SnapshotTaken",
  inputs: [
    { name: "price", type: "int256", indexed: false },
    { name: "timestamp", type: "uint256", indexed: false },
  ],
} as const;

/** Discovers recorded price snapshots via real SnapshotTaken event logs, bounded to the snapshotter's deployment block. */
export function useSnapshotHistory() {
  const publicClient = usePublicClient();
  const snapshotter = oracleContracts.snapshotter;

  return useQuery({
    queryKey: ["light-oracle-snapshots", snapshotter.address],
    enabled: Boolean(snapshotter.address && publicClient),
    queryFn: async () => {
      if (!snapshotter.address || !publicClient) return [] as Snapshot[];
      const logs = await publicClient.getLogs({
        address: snapshotter.address,
        event: SNAPSHOT_TAKEN_EVENT,
        fromBlock: snapshotter.deployedAtBlock ? BigInt(snapshotter.deployedAtBlock) : 0n,
        toBlock: "latest",
      });
      return logs
        .map((log) => log.args as unknown as Snapshot)
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // newest first
    },
  });
}

export function useNextUpkeepEligible() {
  const snapshotter = oracleContracts.snapshotter;
  return useReadContract({
    address: snapshotter.address ?? undefined,
    abi: snapshotter.abi,
    functionName: "checkUpkeep",
    args: ["0x"],
    query: { enabled: Boolean(snapshotter.address), refetchInterval: 15_000 },
  });
}
