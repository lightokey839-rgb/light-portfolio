import { useMemo } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { nftContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

export type NftMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

export function useMintNft() {
  const contract = nftContracts.collection;
  const tx = useTransactionState();

  const mint = () => {
    if (!contract.address) return;
    return tx.send({ address: contract.address, abi: contract.abi, functionName: "mint", args: [] });
  };

  return { ...tx, mint };
}

/**
 * Finds every token the connected wallet currently owns. LightNFT is
 * intentionally not ERC721Enumerable (smaller, cheaper contract), so
 * "which tokens does this wallet own" isn't a single view call — instead
 * this replays `Transfer(to: wallet)` logs from the contract's deployment
 * block (bounding the query instead of scanning from genesis) and
 * re-verifies current ownership per candidate, since a token received in
 * the past may have since moved on.
 */
export function useOwnedNfts() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const contract = nftContracts.collection;

  return useQuery({
    queryKey: ["light-nft-owned", address, contract.address],
    enabled: Boolean(address && contract.address && publicClient),
    queryFn: async () => {
      if (!address || !contract.address || !publicClient) return [] as bigint[];

      const logs = await publicClient.getLogs({
        address: contract.address,
        event: {
          type: "event",
          name: "Transfer",
          inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
          ],
        },
        args: { to: address },
        fromBlock: contract.deployedAtBlock ? BigInt(contract.deployedAtBlock) : 0n,
        toBlock: "latest",
      });

      const candidateIds = Array.from(new Set(logs.map((log) => log.args.tokenId as bigint)));
      const owned: bigint[] = [];
      for (const tokenId of candidateIds) {
        try {
          const owner = await publicClient.readContract({
            address: contract.address,
            abi: contract.abi,
            functionName: "ownerOf",
            args: [tokenId],
          });
          if ((owner as string).toLowerCase() === address.toLowerCase()) owned.push(tokenId);
        } catch {
          // Token no longer exists (burned) or otherwise unreadable — skip it.
        }
      }
      return owned;
    },
  });
}

/** Reads and decodes a token's on-chain `tokenURI` into displayable metadata. */
export function useNftMetadata(tokenId: bigint | undefined) {
  const contract = nftContracts.collection;
  const uriQuery = useReadContract({
    address: contract.address ?? undefined,
    abi: contract.abi,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: Boolean(contract.address && tokenId !== undefined) },
  });

  const metadata = useMemo<NftMetadata | null>(() => {
    if (!uriQuery.data) return null;
    try {
      const base64 = (uriQuery.data as string).split(",")[1];
      return JSON.parse(atob(base64)) as NftMetadata;
    } catch {
      return null;
    }
  }, [uriQuery.data]);

  return { metadata, isLoading: uriQuery.isLoading, isError: uriQuery.isError };
}
