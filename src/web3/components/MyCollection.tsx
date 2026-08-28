import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { isNftDeployed } from "../config/contracts";
import { useOwnedNfts } from "../hooks/useNftCollection";
import { useIsApprovedForMarketplace, useApproveNft, useListNft, useListingFor, useCancelListing } from "../hooks/useMarketplace";
import { useConfirmation } from "../hooks/useTransactionState";
import NftCard from "./NftCard";
import TransactionStatus from "./TransactionStatus";
import "./MyCollection.css";

function ListOrManage({ tokenId }: { tokenId: bigint }) {
  const [priceText, setPriceText] = useState("");
  const listing = useListingFor(tokenId);
  const isApproved = useIsApprovedForMarketplace(tokenId);
  const approve = useApproveNft();
  const list = useListNft();
  const cancel = useCancelListing();

  useConfirmation(approve.state.hash, (status) => approve.setState((s) => ({ ...s, status })));
  useConfirmation(list.state.hash, (status) => list.setState((s) => ({ ...s, status })));
  useConfirmation(cancel.state.hash, (status) => cancel.setState((s) => ({ ...s, status })));

  const activeListing = listing.data as { seller: string; price: bigint } | undefined;
  const isListed = Boolean(activeListing && activeListing.price > 0n);

  if (isListed) {
    return (
      <div className="my-collection__manage">
        <p className="my-collection__listed-price">Listed for {(Number(activeListing!.price) / 1e18).toFixed(4)} ETH</p>
        <button type="button" className="my-collection__btn" onClick={() => cancel.cancel(tokenId)}>
          Cancel listing
        </button>
        <TransactionStatus state={cancel.state} />
      </div>
    );
  }

  return (
    <div className="my-collection__manage">
      <input
        className="my-collection__price-input"
        inputMode="decimal"
        placeholder="Price in ETH"
        value={priceText}
        onChange={(e) => setPriceText(e.target.value.replace(/[^0-9.]/g, ""))}
        aria-label={`List price for token ${tokenId}`}
      />
      {isApproved.data ? (
        <button
          type="button"
          className="my-collection__btn"
          disabled={!priceText}
          onClick={() => {
            try {
              list.list(tokenId, parseEther(priceText));
            } catch {
              /* invalid number — button stays disabled via priceText check in normal cases */
            }
          }}
        >
          List for sale
        </button>
      ) : (
        <button type="button" className="my-collection__btn" onClick={() => approve.approve(tokenId)}>
          Approve marketplace
        </button>
      )}
      <TransactionStatus state={approve.state} />
      <TransactionStatus state={list.state} />
    </div>
  );
}

export default function MyCollection() {
  const { isConnected } = useAccount();
  const owned = useOwnedNfts();

  if (!isNftDeployed()) {
    return (
      <div className="my-collection my-collection--pending">
        <p>Deployment pending — this panel discovers owned tokens via real on-chain Transfer logs once the collection is deployed.</p>
      </div>
    );
  }

  if (!isConnected) {
    return <p className="my-collection__status">Connect your wallet to see NFTs you own.</p>;
  }

  if (owned.isLoading) {
    return <p className="my-collection__status">Scanning your wallet for owned tokens…</p>;
  }

  if (!owned.data || owned.data.length === 0) {
    return <p className="my-collection__status">You don't own any Light Demo NFTs yet — mint one from the Mint tab.</p>;
  }

  return (
    <div className="my-collection__grid">
      {owned.data.map((tokenId) => (
        <NftCard key={tokenId.toString()} tokenId={tokenId} footer={<ListOrManage tokenId={tokenId} />} />
      ))}
    </div>
  );
}
