import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LabNavigation from "../../components/shared/LabNavigation";
import WalletConnectButton from "../../web3/components/WalletConnectButton";
import SwapCard from "../../web3/components/SwapCard";
import LiquidityCard from "../../web3/components/LiquidityCard";
import FaucetPanel from "../../web3/components/FaucetPanel";
import ArchitectureDiagram from "../../web3/components/ArchitectureDiagram";
import ContractVerificationPanel from "../../web3/components/ContractVerificationPanel";
import { dexContracts } from "../../web3/config/contracts";
import { useDocumentHead } from "../../web3/lib/useDocumentHead";
import "./DexLabPage.css";

/**
 * The real GitHub repository URL, if the site owner has set one. Left
 * unset, every "Source" / "GitHub" link below simply doesn't render —
 * never a guessed or placeholder URL. See .env.example.
 */
const GITHUB_BASE = import.meta.env.VITE_GITHUB_REPO_URL || null;

export default function DexLabPage() {
  const [tab, setTab] = useState<"swap" | "liquidity">("swap");

  useDocumentHead(
    "LightSwap — DeFi / DEX | Light",
    "A constant-product AMM (Uniswap V2 architecture, independently implemented): token swaps, liquidity pools, LP accounting, slippage and price-impact protection, wired to real Solidity contracts on Sepolia."
  );

  const contracts = [
    { name: "LightSwapFactory", address: dexContracts.factory.address, verified: dexContracts.factory.verified, sourcePath: "web3/contracts/dex/LightSwapFactory.sol" },
    { name: "LightSwapRouter", address: dexContracts.router.address, verified: dexContracts.router.verified, sourcePath: "web3/contracts/dex/LightSwapRouter.sol" },
    { name: "LightUSD (test token)", address: dexContracts.lightUSD.address, verified: dexContracts.lightUSD.verified, sourcePath: "web3/contracts/dex/LightTestToken.sol" },
    { name: "LightDAI (test token)", address: dexContracts.lightDAI.address, verified: dexContracts.lightDAI.verified, sourcePath: "web3/contracts/dex/LightTestToken.sol" },
    { name: "LightUSD/LightDAI Pair", address: dexContracts.pair.address, verified: dexContracts.pair.verified, sourcePath: "web3/contracts/dex/LightSwapPair.sol" },
  ];

  return (
    <>
      <Navbar />
      <LabNavigation activeSlug="dex" />
      <main className="dex-lab">
        <div className="container">
          <Link to="/lab" className="dex-lab__back">
            ← Back to Lab
          </Link>

          <header className="dex-lab__header">
            <div>
              <p className="eyebrow">DeFi / DEX · Sepolia testnet</p>
              <h1 className="section-heading">LightSwap</h1>
              <p className="section-sub">
                A constant-product AMM in the spirit of Uniswap V2 — independently written, not a fork — with real
                token swaps, liquidity provisioning, and LP accounting against live Solidity contracts.
              </p>
            </div>
            <WalletConnectButton />
          </header>

          <section className="dex-lab__app" aria-label="Interactive DEX">
            <div className="dex-lab__tabs" role="tablist">
              <button role="tab" aria-selected={tab === "swap"} className={tab === "swap" ? "is-active" : ""} onClick={() => setTab("swap")}>
                Swap
              </button>
              <button role="tab" aria-selected={tab === "liquidity"} className={tab === "liquidity" ? "is-active" : ""} onClick={() => setTab("liquidity")}>
                Liquidity
              </button>
            </div>
            {tab === "swap" ? <SwapCard /> : <LiquidityCard />}
            <FaucetPanel />
          </section>

          <section className="dex-lab__section">
            <h2>Architecture</h2>
            <ArchitectureDiagram
              title="Swap request flow"
              steps={[
                { layer: "user", label: "User", detail: "Sets amount, reviews price impact & slippage" },
                { layer: "user", label: "Wallet", detail: "MetaMask or another injected EVM wallet" },
                { layer: "frontend", label: "Frontend", detail: "React + this project's SwapCard component" },
                { layer: "infra", label: "wagmi / viem", detail: "Web3 client — encodes the call, watches the tx" },
                { layer: "onchain", label: "LightSwapRouter", detail: "Slippage + deadline checks, routes to the pair" },
                { layer: "onchain", label: "LightSwapPair", detail: "Re-validates the constant-product invariant" },
                { layer: "onchain", label: "Sepolia", detail: "Ethereum testnet — final settlement" },
              ]}
            />
          </section>

          <section className="dex-lab__section">
            <h2>Contract verification</h2>
            <ContractVerificationPanel contracts={contracts} githubBasePath={GITHUB_BASE} />
          </section>

          <section className="dex-lab__section">
            <h2>Security considerations</h2>
            <ul className="dex-lab__security-list">
              <li><strong>Reentrancy</strong> — every state-changing pair function is <code>nonReentrant</code>; the router never holds a balance between calls.</li>
              <li><strong>Slippage protection</strong> — enforced at the router via <code>amountOutMin</code> / <code>amountInMax</code>, applied here from the slippage tolerance you set above.</li>
              <li><strong>Token approval risk</strong> — this UI requests an exact-amount approval per trade, never an unlimited one.</li>
              <li><strong>Reserve accounting</strong> — reserves are only updated after transfers are verified against actual token balances, not assumed amounts.</li>
              <li><strong>Access control</strong> — no contract in this set has an owner who can pause trading or blacklist an address; the only privileged action is the (currently inert) protocol fee switch.</li>
              <li><strong>Rounding / precision</strong> — integer division favors the pool over the trader at every step, so rounding can only cost a trader dust, never create free value.</li>
            </ul>
            <p className="dex-lab__disclaimer">
              This is a developer-built protocol demonstration, not audited production financial infrastructure.
              {GITHUB_BASE ? (
                <>
                  {" "}Full writeup, including known limitations, in{" "}
                  <a href={`${GITHUB_BASE}/blob/main/web3/README.md`} target="_blank" rel="noreferrer">
                    web3/README.md
                  </a>{" "}
                  and the site-wide{" "}
                  <a href={`${GITHUB_BASE}/blob/main/SECURITY.md`} target="_blank" rel="noreferrer">
                    SECURITY.md
                  </a>
                  .
                </>
              ) : (
                " Full writeup with known limitations is in web3/README.md and SECURITY.md in the project source."
              )}
            </p>
          </section>

          <section className="dex-lab__section">
            <h2>Source &amp; docs</h2>
            {GITHUB_BASE ? (
              <div className="dex-lab__links">
                <a href={`${GITHUB_BASE}/tree/main/web3`} target="_blank" rel="noreferrer">Contracts + tests (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/tree/main/src/web3`} target="_blank" rel="noreferrer">Frontend integration (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/blob/main/web3/README.md`} target="_blank" rel="noreferrer">Project README ↗</a>
              </div>
            ) : (
              <p className="dex-lab__disclaimer">
                GitHub links aren't configured yet — set <code>VITE_GITHUB_REPO_URL</code> once this repository is
                pushed to GitHub to enable them.
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
