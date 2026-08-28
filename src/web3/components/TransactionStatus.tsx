import type { TxState } from "../hooks/useTransactionState";
import { explorerTxUrl } from "../config/chains";
import "./TransactionStatus.css";

const STATUS_LABEL: Record<TxState["status"], string> = {
  idle: "",
  "connect-wallet": "Connect your wallet to continue.",
  "wrong-network": "Switch to Sepolia to continue.",
  "awaiting-signature": "Confirm this transaction in your wallet…",
  pending: "Transaction submitted — waiting for confirmation…",
  success: "Confirmed.",
  rejected: "Transaction cancelled.",
  error: "Transaction failed.",
};

/**
 * Renders the current step of any Web3 write flow (approve, swap, add/remove
 * liquidity, vote, mint — any of them). `aria-live="polite"` means a screen
 * reader announces state changes without the user needing to navigate to
 * this panel — see portfolio requirement 23 (screen-reader-friendly status
 * messages).
 */
export default function TransactionStatus({ state }: { state: TxState }) {
  if (state.status === "idle") return null;

  const isBusy = state.status === "awaiting-signature" || state.status === "pending";
  const isError = state.status === "error" || state.status === "rejected";

  return (
    <div
      className={`tx-status tx-status--${isError ? "error" : state.status === "success" ? "success" : "info"}`}
      role="status"
      aria-live="polite"
    >
      <span className={`tx-status__dot${isBusy ? " tx-status__dot--pulse" : ""}`} aria-hidden="true" />
      <span className="tx-status__label">
        {state.status === "error" && state.errorMessage ? state.errorMessage : STATUS_LABEL[state.status]}
      </span>
      {state.hash && (
        <a className="tx-status__link" href={explorerTxUrl(state.hash)} target="_blank" rel="noreferrer">
          View on Etherscan ↗
        </a>
      )}
    </div>
  );
}
