import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LabNavigation from "../../components/shared/LabNavigation";
import WalletConnectButton from "../../web3/components/WalletConnectButton";
import MintPanel from "../../web3/components/MintPanel";
import BrowseListings from "../../web3/components/BrowseListings";
import MyCollection from "../../web3/components/MyCollection";
import ProceedsPanel from "../../web3/components/ProceedsPanel";
import ArchitectureDiagram from "../../web3/components/ArchitectureDiagram";
import ContractVerificationPanel from "../../web3/components/ContractVerificationPanel";
import { nftContracts } from "../../web3/config/contracts";
import { useDocumentHead } from "../../web3/lib/useDocumentHead";
import "./NftLabPage.css";

const GITHUB_BASE = import.meta.env.VITE_GITHUB_REPO_URL || null;

export default function NftLabPage() {
  const [tab, setTab] = useState<"browse" | "mine" | "mint">("browse");

  useDocumentHead(
    "LightNFT Marketplace — NFT | Light",
    "An ERC-721 collection with fully on-chain generative metadata, plus a pull-payment NFT marketplace: mint, list, buy, and cancel — wired to real Solidity contracts on Sepolia."
  );

  const contracts = [
    { name: "LightNFT (collection)", address: nftContracts.collection.address, verified: nftContracts.collection.verified, sourcePath: "web3/contracts/nft/LightNFT.sol" },
    { name: "LightNFTMarketplace", address: nftContracts.marketplace.address, verified: nftContracts.marketplace.verified, sourcePath: "web3/contracts/nft/LightNFTMarketplace.sol" },
  ];

  return (
    <>
      <Navbar />
      <LabNavigation activeSlug="nft" />
      <main className="nft-lab">
        <div className="container">
          <Link to="/lab" className="nft-lab__back">
            ← Back to Lab
          </Link>

          <header className="nft-lab__header">
            <div>
              <p className="eyebrow">NFT Marketplace · Sepolia testnet</p>
              <h1 className="section-heading">LightNFT Marketplace</h1>
              <p className="section-sub">
                An ERC-721 demo collection with fully on-chain generative metadata, plus a minimal marketplace using
                the pull-payment pattern for sale proceeds.
              </p>
            </div>
            <WalletConnectButton />
          </header>

          <section className="nft-lab__app" aria-label="Interactive NFT marketplace">
            <div className="nft-lab__tabs" role="tablist">
              <button role="tab" aria-selected={tab === "browse"} className={tab === "browse" ? "is-active" : ""} onClick={() => setTab("browse")}>
                Browse
              </button>
              <button role="tab" aria-selected={tab === "mine"} className={tab === "mine" ? "is-active" : ""} onClick={() => setTab("mine")}>
                My Collection
              </button>
              <button role="tab" aria-selected={tab === "mint"} className={tab === "mint" ? "is-active" : ""} onClick={() => setTab("mint")}>
                Mint
              </button>
            </div>
            <div className="nft-lab__panel">
              {tab === "browse" && <BrowseListings />}
              {tab === "mine" && <MyCollection />}
              {tab === "mint" && <MintPanel />}
            </div>
            <ProceedsPanel />
          </section>

          <section className="nft-lab__section">
            <h2>Architecture</h2>
            <ArchitectureDiagram
              title="Buy flow"
              steps={[
                { layer: "user", label: "User", detail: "Browses listings, reviews price" },
                { layer: "user", label: "Wallet", detail: "MetaMask or another injected EVM wallet" },
                { layer: "frontend", label: "Frontend", detail: "React + BrowseListings / MyCollection components" },
                { layer: "infra", label: "wagmi / viem", detail: "Reads ItemListed logs, encodes buyItem call" },
                { layer: "onchain", label: "LightNFTMarketplace", detail: "Verifies listing, credits seller proceeds" },
                { layer: "onchain", label: "LightNFT (ERC-721)", detail: "safeTransferFrom to the buyer" },
                { layer: "onchain", label: "Sepolia", detail: "Ethereum testnet — final settlement" },
              ]}
            />
          </section>

          <section className="nft-lab__section">
            <h2>Contract verification</h2>
            <ContractVerificationPanel contracts={contracts} githubBasePath={GITHUB_BASE} />
          </section>

          <section className="nft-lab__section">
            <h2>Security considerations</h2>
            <ul className="nft-lab__security-list">
              <li><strong>Pull over push payments</strong> — <code>buyItem</code> never sends ETH to the seller directly; it credits an internal balance the seller withdraws separately, so a seller contract that reverts on receiving ETH can't block a sale.</li>
              <li><strong>Reentrancy</strong> — <code>buyItem</code> and <code>withdrawProceeds</code> are <code>nonReentrant</code>.</li>
              <li><strong>Listing authorization</strong> — listing requires proven ownership <em>and</em> marketplace approval; neither alone is sufficient.</li>
              <li><strong>Stale listings</strong> — if a seller transfers a listed token away without cancelling, a purchase attempt reverts with a clear error instead of silently failing.</li>
              <li><strong>Safe transfers</strong> — uses <code>safeTransferFrom</code>, which reverts rather than permanently locking a token in a contract that can't receive it.</li>
              <li><strong>No refund on overpayment</strong> — the frontend always sends the exact listed price; sending more through a different client is accepted, not refunded.</li>
            </ul>
            <p className="nft-lab__disclaimer">
              This is a developer-built protocol demonstration, not audited production infrastructure.
              {GITHUB_BASE ? (
                <>
                  {" "}Full write-up in{" "}
                  <a href={`${GITHUB_BASE}/blob/main/web3/README.md`} target="_blank" rel="noreferrer">
                    web3/README.md
                  </a>{" "}
                  and{" "}
                  <a href={`${GITHUB_BASE}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer">
                    SECURITY.md
                  </a>
                  .
                </>
              ) : (
                " Full write-up is in web3/README.md and SECURITY.md in the project source."
              )}
            </p>
          </section>

          <section className="nft-lab__section">
            <h2>Source &amp; docs</h2>
            {GITHUB_BASE ? (
              <div className="nft-lab__links">
                <a href={`${GITHUB_BASE}/tree/main/web3`} target="_blank" rel="noreferrer">Contracts + tests (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/tree/main/src/web3`} target="_blank" rel="noreferrer">Frontend integration (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/blob/main/web3/README.md`} target="_blank" rel="noreferrer">Project README ↗</a>
              </div>
            ) : (
              <p className="nft-lab__disclaimer">
                GitHub links aren't configured yet — set <code>VITE_GITHUB_REPO_URL</code> once this repository is pushed to GitHub.
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
