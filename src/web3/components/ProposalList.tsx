import { isDaoDeployed } from "../config/contracts";
import { useProposals } from "../hooks/useGovernor";
import ProposalCard from "./ProposalCard";
import "./ProposalList.css";

export default function ProposalList() {
  const proposals = useProposals();

  if (!isDaoDeployed()) {
    return (
      <div className="proposal-list proposal-list--pending">
        <p>Deployment pending — this list discovers proposals via real ProposalCreated events; it will populate once the DAO is deployed to Sepolia.</p>
      </div>
    );
  }

  if (proposals.isLoading) {
    return <p className="proposal-list__status">Loading proposals…</p>;
  }

  if (!proposals.data || proposals.data.length === 0) {
    return (
      <p className="proposal-list__status">
        No proposals yet. Delegate your LGOV tokens above, then submit the first one — this is a live testnet DAO,
        not seeded with fake data.
      </p>
    );
  }

  return (
    <div className="proposal-list">
      {proposals.data.map((proposal) => (
        <ProposalCard key={proposal.proposalId.toString()} proposal={proposal} />
      ))}
    </div>
  );
}
