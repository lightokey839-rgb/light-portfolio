import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { isNftDeployed } from "../config/contracts";
import { useActiveListings, useBuyNft } from "../hooks/useMarketplace";
import { useConfirmation } from "../hooks/useTransactionState";
import NftCard from "./NftCard";
import TransactionStatus from "./TransactionStatus";
import "./BrowseListings.css";

function BuyButton({ tokenId, price, seller }: { tokenId: bigint; price: bigint; seller: string }) {
  const { address, isConnected } = useAccount();
  const buy = useBuyNft();
  useConfirmation(buy.state.hash, (status) => buy.setState((s) => ({ ...s, status })));
  const isOwnListing = address?.toLowerCase() === seller.toLowerCase();
  const busy = buy.state.status === "awaiting-signature" || buy.state.status === "pending";

  return (
    <div className="browse-listings__buy">
      <button
        type="button"
        className="browse-listings__buy-btn"
        disabled={!isConnected || isOwnListing || busy}
        onClick={() => buy.buy(tokenId, price)}
      >
        {isOwnListing ? "Your listing" : !isConnected ? "Connect to buy" : busy ? "Buying…" : `Buy for ${formatEther(price)} ETH`}
      </button>
      <TransactionStatus state={buy.state} />
    </div>
  );
}

export default function BrowseListings() {
  const listings = useActiveListings();

  if (!isNftDeployed()) {
    return (
      <div className="browse-listings browse-listings--pending">
        <p>Deployment pending — this grid reads real `ItemListed` events and `getListing` calls; it will populate once the marketplace is deployed to Sepolia.</p>
      </div>
    );
  }

  if (listings.isLoading) {
    return <p className="browse-listings__status">Loading listings…</p>;
  }

  if (!listings.data || listings.data.length === 0) {
    return (
      <p className="browse-listings__status">
        No active listings yet. Mint a demo NFT and list it — this is a live testnet marketplace, not seeded with fake data.
      </p>
    );
  }

  return (
    <div className="browse-listings__grid">
      {listings.data.map((listing) => (
        <NftCard
          key={listing.tokenId.toString()}
          tokenId={listing.tokenId}
          footer={<BuyButton tokenId={listing.tokenId} price={listing.price} seller={listing.seller} />}
        />
      ))}
    </div>
  );
}
