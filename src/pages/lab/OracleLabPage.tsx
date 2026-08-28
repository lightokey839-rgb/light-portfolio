import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LabNavigation from "../../components/shared/LabNavigation";
import WalletConnectButton from "../../web3/components/WalletConnectButton";
import PriceCard from "../../web3/components/PriceCard";
import SnapshotHistory from "../../web3/components/SnapshotHistory";
import ArchitectureDiagram from "../../web3/components/ArchitectureDiagram";
import ContractVerificationPanel from "../../web3/components/ContractVerificationPanel";
import { oracleContracts } from "../../web3/config/contracts";
import { useDocumentHead } from "../../web3/lib/useDocumentHead";
import "./OracleLabPage.css";

const GITHUB_BASE = import.meta.env.VITE_GITHUB_REPO_URL || null;

export default function OracleLabPage() {
  useDocumentHead(
    "LightOracle — Chainlink Data Feeds & Automation | Light",
    "A Chainlink Data Feed consumer with staleness and validity checks, plus an Automation-compatible contract that records price snapshots on a schedule — reading Chainlink's real live Sepolia ETH/USD feed."
  );

  const contracts = [
    {
      name: "Chainlink ETH/USD Feed",
      address: oracleContracts.chainlinkFeed.address,
      verified: true,
      sourcePath: "",
    },
    { name: "LightPriceConsumer", address: oracleContracts.consumer.address, verified: oracleContracts.consumer.verified, sourcePath: "web3/contracts/oracle/LightPriceConsumer.sol" },
    { name: "LightPriceSnapshotter", address: oracleContracts.snapshotter.address, verified: oracleContracts.snapshotter.verified, sourcePath: "web3/contracts/oracle/LightPriceSnapshotter.sol" },
  ];

  return (
    <>
      <Navbar />
      <LabNavigation activeSlug="oracle" />
      <main className="oracle-lab">
        <div className="container">
          <Link to="/lab" className="oracle-lab__back">
            ← Back to Lab
          </Link>

          <header className="oracle-lab__header">
            <div>
              <p className="eyebrow">Oracle / Web3 Infrastructure · Sepolia testnet</p>
              <h1 className="section-heading">LightOracle</h1>
              <p className="section-sub">
                Secure external data consumption: a Chainlink Data Feed consumer with staleness and validity checks,
                plus a Chainlink Automation-compatible contract that snapshots the price on a schedule.
              </p>
            </div>
            <WalletConnectButton />
          </header>

          <section className="oracle-lab__app" aria-label="Interactive oracle demo">
            <PriceCard />
            <SnapshotHistory />
          </section>

          <section className="oracle-lab__section">
            <h2>Architecture</h2>
            <ArchitectureDiagram
              title="Price validation flow"
              steps={[
                { layer: "infra", label: "Chainlink DON", detail: "Decentralized oracle network aggregates real-world price data" },
                { layer: "onchain", label: "Chainlink Aggregator", detail: "Sepolia's live, already-deployed ETH/USD feed" },
                { layer: "onchain", label: "LightPriceConsumer", detail: "Validates: positive price, complete round, not stale" },
                { layer: "onchain", label: "LightPriceSnapshotter", detail: "Automation-compatible: records validated snapshots on a schedule" },
                { layer: "frontend", label: "Frontend", detail: "React + wagmi/viem reads the validated result" },
                { layer: "user", label: "User", detail: "Sees a price that already passed on-chain validation" },
              ]}
            />
          </section>

          <section className="oracle-lab__section">
            <h2>Contract verification</h2>
            <ContractVerificationPanel contracts={contracts} githubBasePath={GITHUB_BASE} />
            <p className="oracle-lab__feed-note">
              The Chainlink feed above is Chainlink's own already-deployed infrastructure — this project consumes
              it, and doesn't deploy or control it.
            </p>
          </section>

          <section className="oracle-lab__section">
            <h2>Validation &amp; security considerations</h2>
            <ul className="oracle-lab__security-list">
              <li><strong>Staleness validation</strong> — <code>LightPriceConsumer</code> reverts if the feed's last update is older than <code>MAX_STALENESS</code> (24h, a conservative demo value — production should use the specific feed's published heartbeat).</li>
              <li><strong>Invalid-data handling</strong> — a zero or negative price reverts with <code>InvalidPrice</code> rather than being silently propagated.</li>
              <li><strong>Round consistency</strong> — checks <code>answeredInRound &gt;= roundId</code> as a secondary sanity check; documented as not a complete staleness defense on its own, per Chainlink's own current guidance.</li>
              <li><strong>Safe value processing</strong> — staleness is checked via <code>block.timestamp &gt; updatedAt + MAX_STALENESS</code> rather than a subtraction, avoiding an underflow if <code>updatedAt</code> were ever unexpectedly in the future.</li>
              <li><strong>Automation re-validates independently</strong> — <code>performUpkeep</code> re-checks the interval and re-validates the price itself rather than trusting that <code>checkUpkeep</code> was actually called first, since anyone can call <code>performUpkeep</code> directly.</li>
              <li><strong>No fake price data</strong> — every value shown here comes from Chainlink's real Sepolia feed through on-chain calls; nothing is hardcoded or mocked outside the test suite.</li>
            </ul>
            <p className="oracle-lab__disclaimer">
              {GITHUB_BASE ? (
                <>
                  Full write-up in{" "}
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
                "Full write-up is in web3/README.md and SECURITY.md in the project source."
              )}
            </p>
          </section>

          <section className="oracle-lab__section">
            <h2>Source &amp; docs</h2>
            {GITHUB_BASE ? (
              <div className="oracle-lab__links">
                <a href={`${GITHUB_BASE}/tree/main/web3`} target="_blank" rel="noreferrer">Contracts + tests (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/tree/main/src/web3`} target="_blank" rel="noreferrer">Frontend integration (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/blob/main/web3/README.md`} target="_blank" rel="noreferrer">Project README ↗</a>
              </div>
            ) : (
              <p className="oracle-lab__disclaimer">
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
