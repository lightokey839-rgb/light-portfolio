import { useAccount, useReadContract } from "wagmi";
import { nftContracts, isNftDeployed } from "../config/contracts";
import { useMintNft } from "../hooks/useNftCollection";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./MintPanel.css";

export default function MintPanel() {
  const { address, isConnected } = useAccount();
  const collection = nftContracts.collection;
  const mint = useMintNft();
  useConfirmation(mint.state.hash, (status) => mint.setState((s) => ({ ...s, status })));

  const totalSupply = useReadContract({
    address: collection.address ?? undefined,
    abi: collection.abi,
    functionName: "totalSupply",
    query: { enabled: Boolean(collection.address) },
  });
  const mintedByWallet = useReadContract({
    address: collection.address ?? undefined,
    abi: collection.abi,
    functionName: "mintedByWallet",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(collection.address && address) },
  });

  if (!isNftDeployed()) {
    return (
      <div className="mint-panel mint-panel--pending">
        <p>Deployment pending — this panel is fully wired against the real LightNFT ABI and will work once the contract is deployed to Sepolia (see web3/README.md).</p>
      </div>
    );
  }

  const atWalletCap = mintedByWallet.data !== undefined && (mintedByWallet.data as bigint) >= 5n;
  const busy = mint.state.status === "awaiting-signature" || mint.state.status === "pending";

  return (
    <div className="mint-panel">
      <p className="mint-panel__stats">
        {totalSupply.data !== undefined ? totalSupply.data.toString() : "—"} / {collection.address ? "500" : "—"} minted
        {mintedByWallet.data !== undefined && ` · you've minted ${mintedByWallet.data.toString()}/5`}
      </p>
      <button type="button" className="mint-panel__btn" disabled={!isConnected || busy || atWalletCap} onClick={() => mint.mint()}>
        {!isConnected ? "Connect wallet to mint" : atWalletCap ? "Wallet mint limit reached" : busy ? "Minting…" : "Mint a demo NFT (free)"}
      </button>
      <TransactionStatus state={mint.state} />
      <p className="mint-panel__note">
        Free public mint, capped at 5 per wallet / 500 total. Metadata and artwork are generated fully on-chain — no IPFS dependency.
      </p>
    </div>
  );
}
