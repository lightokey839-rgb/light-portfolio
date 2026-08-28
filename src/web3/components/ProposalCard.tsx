import { formatEther, keccak256, toBytes } from "viem";
import { useAccount } from "wagmi";
import type { ProposalSummary } from "../hooks/useGovernor";
import {
  PROPOSAL_STATE_LABELS,
  useProposalState,
  useProposalVotes,
  useHasVoted,
  useQuorum,
  useCastVote,
  useQueueProposal,
  useExecuteProposal,
} from "../hooks/useGovernor";
import { useVotingPower } from "../hooks/useGovernanceToken";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./ProposalCard.css";

/** keccak256(description) — matches Governor.hashProposal's descriptionHash argument. */
function descriptionHashOf(description: string): `0x${string}` {
  return keccak256(toBytes(description));
}

export default function ProposalCard({ proposal }: { proposal: ProposalSummary }) {
  const { isConnected } = useAccount();
  const stateQuery = useProposalState(proposal.proposalId);
  const votesQuery = useProposalVotes(proposal.proposalId);
  const hasVotedQuery = useHasVoted(proposal.proposalId);
  const votingPower = useVotingPower();
  const quorumQuery = useQuorum(proposal.voteStart);

  const castVote = useCastVote();
  const queueTx = useQueueProposal();
  const executeTx = useExecuteProposal();
  useConfirmation(castVote.state.hash, (s) => castVote.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(queueTx.state.hash, (s) => queueTx.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(executeTx.state.hash, (s) => executeTx.setState((prev) => ({ ...prev, status: s })));

  const stateIndex = stateQuery.data !== undefined ? Number(stateQuery.data) : undefined;
  const stateLabel = stateIndex !== undefined ? PROPOSAL_STATE_LABELS[stateIndex] : "Loading…";
  const votes = votesQuery.data as { againstVotes: bigint; forVotes: bigint; abstainVotes: bigint } | undefined;
  const descHash = descriptionHashOf(proposal.description);

  const targetSummary = proposal.targets[0]
    ? `Send ${formatEther(proposal.values[0] ?? 0n)} ETH to ${proposal.targets[0].slice(0, 6)}…${proposal.targets[0].slice(-4)}`
    : "";

  return (
    <div className="proposal-card">
      <div className="proposal-card__head">
        <span className={`proposal-card__state proposal-card__state--${stateLabel.toLowerCase()}`}>{stateLabel}</span>
        <span className="proposal-card__id">#{proposal.proposalId.toString().slice(0, 8)}</span>
      </div>
      <p className="proposal-card__description">{proposal.description}</p>
      {targetSummary && <p className="proposal-card__target">{targetSummary}</p>}

      {votes && (
        <div className="proposal-card__votes">
          <VoteBar label="For" value={votes.forVotes} total={votes.forVotes + votes.againstVotes + votes.abstainVotes} tone="for" />
          <VoteBar label="Against" value={votes.againstVotes} total={votes.forVotes + votes.againstVotes + votes.abstainVotes} tone="against" />
          <VoteBar label="Abstain" value={votes.abstainVotes} total={votes.forVotes + votes.againstVotes + votes.abstainVotes} tone="abstain" />
          {quorumQuery.data !== undefined && (
            <p className="proposal-card__quorum">
              Quorum: {formatEther(votes.forVotes + votes.abstainVotes)} / {formatEther(quorumQuery.data as bigint)} LGOV
            </p>
          )}
        </div>
      )}

      <p className="proposal-card__meta">
        Voting window: block {proposal.voteStart.toString()} → {proposal.voteEnd.toString()}
      </p>

      {stateLabel === "Active" && (
        <div className="proposal-card__actions">
          {hasVotedQuery.data ? (
            <p className="proposal-card__voted">You've already voted on this proposal.</p>
          ) : !isConnected ? (
            <p className="proposal-card__voted">Connect your wallet to vote.</p>
          ) : votingPower.data === 0n ? (
            <p className="proposal-card__voted">You have no voting power — delegate your tokens above first.</p>
          ) : (
            <div className="proposal-card__vote-buttons">
              <button onClick={() => castVote.vote(proposal.proposalId, 1)}>Vote For</button>
              <button onClick={() => castVote.vote(proposal.proposalId, 0)}>Vote Against</button>
              <button onClick={() => castVote.vote(proposal.proposalId, 2)}>Abstain</button>
            </div>
          )}
          <TransactionStatus state={castVote.state} />
        </div>
      )}

      {stateLabel === "Succeeded" && (
        <div className="proposal-card__actions">
          <button
            className="proposal-card__primary-btn"
            onClick={() => queueTx.queue(proposal.targets, proposal.values, proposal.calldatas, descHash)}
          >
            Queue for execution
          </button>
          <TransactionStatus state={queueTx.state} />
        </div>
      )}

      {stateLabel === "Queued" && (
        <div className="proposal-card__actions">
          <button
            className="proposal-card__primary-btn"
            onClick={() => executeTx.execute(proposal.targets, proposal.values, proposal.calldatas, descHash)}
          >
            Execute
          </button>
          <p className="proposal-card__note">Reverts if the timelock delay hasn't elapsed yet — that's expected, not a bug; try again shortly.</p>
          <TransactionStatus state={executeTx.state} />
        </div>
      )}
    </div>
  );
}

function VoteBar({ label, value, total, tone }: { label: string; value: bigint; total: bigint; tone: "for" | "against" | "abstain" }) {
  const pct = total > 0n ? Number((value * 10000n) / total) / 100 : 0;
  return (
    <div className="proposal-card__vote-row">
      <span className="proposal-card__vote-label">{label}</span>
      <div className="proposal-card__vote-track">
        <div className={`proposal-card__vote-fill proposal-card__vote-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="proposal-card__vote-amount">{formatEther(value)}</span>
    </div>
  );
}
