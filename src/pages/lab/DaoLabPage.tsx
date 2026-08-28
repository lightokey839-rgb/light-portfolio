import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LabNavigation from "../../components/shared/LabNavigation";
import WalletConnectButton from "../../web3/components/WalletConnectButton";
import DelegationPanel from "../../web3/components/DelegationPanel";
import ProposalList from "../../web3/components/ProposalList";
import CreateProposalForm from "../../web3/components/CreateProposalForm";
import ArchitectureDiagram from "../../web3/components/ArchitectureDiagram";
import ContractVerificationPanel from "../../web3/components/ContractVerificationPanel";
import { daoContracts } from "../../web3/config/contracts";
import { useDocumentHead } from "../../web3/lib/useDocumentHead";
import "./DaoLabPage.css";

const GITHUB_BASE = import.meta.env.VITE_GITHUB_REPO_URL || null;

export default function DaoLabPage() {
  const [tab, setTab] = useState<"proposals" | "create">("proposals");

  useDocumentHead(
    "LightDAO Governance — DAO | Light",
    "A token-weighted DAO built on OpenZeppelin's Governor + TimelockController: proposal creation, voting, quorum, and timelock-controlled treasury execution — wired to real Solidity contracts on Sepolia."
  );

  const contracts = [
    { name: "LightGovernanceToken", address: daoContracts.token.address, verified: daoContracts.token.verified, sourcePath: "web3/contracts/dao/LightGovernanceToken.sol" },
    { name: "TimelockController (treasury)", address: daoContracts.timelock.address, verified: daoContracts.timelock.verified ?? false, sourcePath: "@openzeppelin/contracts/governance/TimelockController.sol" },
    { name: "LightGovernor", address: daoContracts.governor.address, verified: daoContracts.governor.verified, sourcePath: "web3/contracts/dao/LightGovernor.sol" },
  ];

  return (
    <>
      <Navbar />
      <LabNavigation activeSlug="dao" />
      <main className="dao-lab">
        <div className="container">
          <Link to="/lab" className="dao-lab__back">
            ← Back to Lab
          </Link>

          <header className="dao-lab__header">
            <div>
              <p className="eyebrow">DAO / Governance · Sepolia testnet</p>
              <h1 className="section-heading">LightDAO</h1>
              <p className="section-sub">
                Token-weighted governance built on OpenZeppelin's audited Governor + TimelockController modules —
                not a bespoke voting contract. Proposals control real treasury ETH, gated by a timelock delay.
              </p>
            </div>
            <WalletConnectButton />
          </header>

          <section className="dao-lab__app" aria-label="Interactive DAO">
            <DelegationPanel />

            <div className="dao-lab__tabs" role="tablist">
              <button role="tab" aria-selected={tab === "proposals"} className={tab === "proposals" ? "is-active" : ""} onClick={() => setTab("proposals")}>
                Proposals
              </button>
              <button role="tab" aria-selected={tab === "create"} className={tab === "create" ? "is-active" : ""} onClick={() => setTab("create")}>
                Create proposal
              </button>
            </div>
            <div className="dao-lab__panel">
              {tab === "proposals" ? <ProposalList /> : <CreateProposalForm />}
            </div>
          </section>

          <section className="dao-lab__section">
            <h2>Architecture</h2>
            <ArchitectureDiagram
              title="Proposal lifecycle"
              steps={[
                { layer: "user", label: "Token holder", detail: "Delegates voting power, proposes, votes" },
                { layer: "user", label: "Wallet", detail: "MetaMask or another injected EVM wallet" },
                { layer: "frontend", label: "Frontend", detail: "React + wagmi/viem" },
                { layer: "onchain", label: "LightGovernor", detail: "Counts votes, checks quorum, decides proposal state" },
                { layer: "onchain", label: "TimelockController", detail: "Holds the treasury; enforces a delay before execution" },
                { layer: "onchain", label: "Target contract", detail: "Receives the executed action (here: an ETH transfer)" },
                { layer: "onchain", label: "Sepolia", detail: "Ethereum testnet — final settlement" },
              ]}
            />
          </section>

          <section className="dao-lab__section">
            <h2>Contract verification</h2>
            <ContractVerificationPanel contracts={contracts} githubBasePath={GITHUB_BASE} />
          </section>

          <section className="dao-lab__section">
            <h2>Security &amp; governance-risk considerations</h2>
            <ul className="dao-lab__security-list">
              <li><strong>Flash-loan voting</strong> — mitigated structurally, not by a special check: <code>ERC20Votes</code> snapshots voting power at the proposal's snapshot block via checkpoints, so tokens borrowed and returned within one transaction never had voting power at that snapshot to begin with.</li>
              <li><strong>Quorum</strong> — set to 4% of total supply (<code>GovernorVotesQuorumFraction</code>). Because this token has an open faucet, total supply — and so the quorum target — grows as people claim from it; a production governance token typically has a fixed or separately-governed supply instead.</li>
              <li><strong>Privileged roles</strong> — none, by design. The deployer's <code>TimelockController</code> admin role is renounced immediately after setup (see the deploy script); from that point on, only a passed governance vote can queue a treasury action.</li>
              <li><strong>Timelock</strong> — every passed proposal sits in the timelock for a minimum delay before it can execute, giving token holders a window to notice and react to a bad outcome before funds actually move. Set short (60s) here for demo interactivity — production DAOs typically use 1–2+ days.</li>
              <li><strong>Proposal execution risk</strong> — this UI only ever proposes a plain ETH transfer to an address; it never accepts free-form calldata from the form, which removes an entire class of "the proposal did something other than what it said" risk at the cost of only supporting one proposal shape.</li>
              <li><strong>Multisig</strong> — not used here; the timelock's proposer role is held solely by the Governor contract. A production deployment might additionally require a multisig-held canceller role as a circuit breaker — documented as a limitation, not implemented.</li>
            </ul>
            <p className="dao-lab__disclaimer">
              This DAO does not control any real treasury — the Sepolia ETH it holds is testnet ETH with no value.
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

          <section className="dao-lab__section">
            <h2>Source &amp; docs</h2>
            {GITHUB_BASE ? (
              <div className="dao-lab__links">
                <a href={`${GITHUB_BASE}/tree/main/web3`} target="_blank" rel="noreferrer">Contracts + tests (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/tree/main/src/web3`} target="_blank" rel="noreferrer">Frontend integration (GitHub) ↗</a>
                <a href={`${GITHUB_BASE}/blob/main/web3/README.md`} target="_blank" rel="noreferrer">Project README ↗</a>
              </div>
            ) : (
              <p className="dao-lab__disclaimer">
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
