import { useState } from "react";
import { parseEther, isAddress } from "viem";
import { useAccount } from "wagmi";
import { useCreateTreasuryProposal } from "../hooks/useGovernor";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./CreateProposalForm.css";

export default function CreateProposalForm() {
  const { isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const propose = useCreateTreasuryProposal();
  useConfirmation(propose.state.hash, (s) => propose.setState((prev) => ({ ...prev, status: s })));

  const validRecipient = isAddress(recipient);
  const validAmount = Boolean(amount) && !Number.isNaN(Number(amount)) && Number(amount) > 0;
  const canSubmit = isConnected && validRecipient && validAmount && Boolean(reason.trim());
  const busy = propose.state.status === "awaiting-signature" || propose.state.status === "pending";

  const description = reason.trim();

  return (
    <div className="create-proposal">
      <p className="create-proposal__intro">
        Propose sending ETH from the DAO treasury to an address. This is the one proposal shape this UI exposes —
        the same Governor supports arbitrary calldata, but a free-form calldata field in a demo form invites
        mistakes this project doesn't need to risk.
      </p>

      <label className="create-proposal__field">
        <span>Recipient address</span>
        <input value={recipient} onChange={(e) => setRecipient(e.target.value.trim())} placeholder="0x…" />
      </label>

      <label className="create-proposal__field">
        <span>Amount (ETH)</span>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.1" />
      </label>

      <label className="create-proposal__field">
        <span>Description (this becomes the proposal's on-chain identity)</span>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why should the DAO do this?" />
      </label>

      <button
        type="button"
        className="create-proposal__submit"
        disabled={!canSubmit || busy}
        onClick={() => validRecipient && propose.propose(recipient as `0x${string}`, parseEther(amount), description)}
      >
        {!isConnected ? "Connect wallet to propose" : busy ? "Submitting…" : "Submit proposal"}
      </button>
      <TransactionStatus state={propose.state} />
    </div>
  );
}
