import { usePublicClient, useReadContract, useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { nftContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

export type ActiveListing = { tokenId: bigint; seller: `0x${string}`; price: bigint };

/**
 * Finds currently-active listings by replaying `ItemListed` logs from the
 * marketplace's deployment block to get candidate token IDs, then reading
 * `getListing` for each — which naturally reflects cancellations and
 * completed sales, since both clear the listing on-chain (price becomes
 * 0). No separate "delisted" bookkeeping needed on the frontend.
 */
export function useActiveListings() {
  const publicClient = usePublicClient();
  const marketplace = nftContracts.marketplace;
  const collection = nftContracts.collection;

  return useQuery({
    queryKey: ["light-nft-listings", marketplace.address, collection.address],
    enabled: Boolean(marketplace.address && collection.address && publicClient),
    queryFn: async () => {
      if (!marketplace.address || !collection.address || !publicClient) return [] as ActiveListing[];

      const logs = await publicClient.getLogs({
        address: marketplace.address,
        event: {
          type: "event",
          name: "ItemListed",
          inputs: [
            { name: "seller", type: "address", indexed: true },
            { name: "nftContract", type: "address", indexed: true },
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "price", type: "uint256", indexed: false },
          ],
        },
        args: { nftContract: collection.address },
        fromBlock: collection.deployedAtBlock ? BigInt(collection.deployedAtBlock) : 0n,
        toBlock: "latest",
      });

      const candidateIds = Array.from(new Set(logs.map((log) => log.args.tokenId as bigint)));
      const active: ActiveListing[] = [];
      for (const tokenId of candidateIds) {
        const listing = (await publicClient.readContract({
          address: marketplace.address,
          abi: marketplace.abi,
          functionName: "getListing",
          args: [collection.address, tokenId],
        })) as { seller: `0x${string}`; price: bigint };
        if (listing.price > 0n) active.push({ tokenId, seller: listing.seller, price: listing.price });
      }
      return active;
    },
  });
}

export function useListingFor(tokenId: bigint | undefined) {
  const marketplace = nftContracts.marketplace;
  const collection = nftContracts.collection;
  return useReadContract({
    address: marketplace.address ?? undefined,
    abi: marketplace.abi,
    functionName: "getListing",
    args: collection.address && tokenId !== undefined ? [collection.address, tokenId] : undefined,
    query: { enabled: Boolean(marketplace.address && collection.address && tokenId !== undefined) },
  });
}

export function useIsApprovedForMarketplace(tokenId: bigint | undefined) {
  const collection = nftContracts.collection;
  const marketplace = nftContracts.marketplace;
  return useReadContract({
    address: collection.address ?? undefined,
    abi: collection.abi,
    functionName: "getApproved",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: Boolean(collection.address && tokenId !== undefined),
      select: (approved) => (approved as string).toLowerCase() === marketplace.address?.toLowerCase(),
    },
  });
}

export function useApproveNft() {
  const collection = nftContracts.collection;
  const marketplace = nftContracts.marketplace;
  const tx = useTransactionState();

  const approve = (tokenId: bigint) => {
    if (!collection.address || !marketplace.address) return;
    return tx.send({
      address: collection.address,
      abi: collection.abi,
      functionName: "approve",
      args: [marketplace.address, tokenId],
    });
  };

  return { ...tx, approve };
}

export function useListNft() {
  const marketplace = nftContracts.marketplace;
  const collection = nftContracts.collection;
  const tx = useTransactionState();

  const list = (tokenId: bigint, priceWei: bigint) => {
    if (!marketplace.address || !collection.address) return;
    return tx.send({
      address: marketplace.address,
      abi: marketplace.abi,
      functionName: "listItem",
      args: [collection.address, tokenId, priceWei],
    });
  };

  return { ...tx, list };
}

export function useCancelListing() {
  const marketplace = nftContracts.marketplace;
  const collection = nftContracts.collection;
  const tx = useTransactionState();

  const cancel = (tokenId: bigint) => {
    if (!marketplace.address || !collection.address) return;
    return tx.send({
      address: marketplace.address,
      abi: marketplace.abi,
      functionName: "cancelListing",
      args: [collection.address, tokenId],
    });
  };

  return { ...tx, cancel };
}

export function useBuyNft() {
  const marketplace = nftContracts.marketplace;
  const collection = nftContracts.collection;
  const tx = useTransactionState();

  const buy = (tokenId: bigint, priceWei: bigint) => {
    if (!marketplace.address || !collection.address) return;
    return tx.send({
      address: marketplace.address,
      abi: marketplace.abi,
      functionName: "buyItem",
      args: [collection.address, tokenId],
      value: priceWei,
    } as unknown as Parameters<typeof tx.send>[0]);
  };

  return { ...tx, buy };
}

export function useProceeds() {
  const { address } = useAccount();
  const marketplace = nftContracts.marketplace;
  return useReadContract({
    address: marketplace.address ?? undefined,
    abi: marketplace.abi,
    functionName: "getProceeds",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(marketplace.address && address) },
  });
}

export function useWithdrawProceeds() {
  const marketplace = nftContracts.marketplace;
  const tx = useTransactionState();

  const withdraw = () => {
    if (!marketplace.address) return;
    return tx.send({ address: marketplace.address, abi: marketplace.abi, functionName: "withdrawProceeds", args: [] });
  };

  return { ...tx, withdraw };
}
