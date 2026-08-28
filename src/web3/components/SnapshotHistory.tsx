import { isOracleDeployed } from "../config/contracts";
import { useSnapshotHistory, useNextUpkeepEligible } from "../hooks/useOracle";
import { useTriggerSnapshot } from "../hooks/useTriggerSnapshot";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./SnapshotHistory.css";

function formatPrice(price: bigint): string {
  return (Number(price) / 1e8).toFixed(2); // ETH/USD feed uses 8 decimals
}

export default function SnapshotHistory() {
  const history = useSnapshotHistory();
  const eligible = useNextUpkeepEligible();
  const trigger = useTriggerSnapshot();
  useConfirmation(trigger.state.hash, (s) => trigger.setState((prev) => ({ ...prev, status: s })));

  if (!isOracleDeployed()) {
    return (
      <div className="snapshot-history snapshot-history--pending">
        <p>Deployment pending — this panel reads real SnapshotTaken events once LightPriceSnapshotter is deployed to Sepolia.</p>
      </div>
    );
  }

  const upkeepNeeded = eligible.data ? (eligible.data as [boolean, string])[0] : undefined;
  const busy = trigger.state.status === "awaiting-signature" || trigger.state.status === "pending";

  return (
    <div className="snapshot-history">
      <div className="snapshot-history__head">
        <div>
          <p className="snapshot-history__title">Automation-recorded history</p>
          <p className="snapshot-history__note">
            Not yet registered with Chainlink Automation (that registration, at automation.chain.link funded with
            LINK, is a separate external step) — so snapshots only happen when someone calls performUpkeep, like
            the button below.
          </p>
        </div>
        <button
          type="button"
          className="snapshot-history__trigger"
          disabled={busy || upkeepNeeded === false}
          onClick={() => trigger.trigger()}
        >
          {busy ? "Recording…" : upkeepNeeded === false ? "Not due yet" : "Take a snapshot now"}
        </button>
      </div>
      <TransactionStatus state={trigger.state} />

      {history.isLoading ? (
        <p className="snapshot-history__empty">Loading history…</p>
      ) : !history.data || history.data.length === 0 ? (
        <p className="snapshot-history__empty">No snapshots recorded yet — take the first one above.</p>
      ) : (
        <ul className="snapshot-history__list">
          {history.data.map((snapshot) => (
            <li key={snapshot.timestamp.toString()}>
              <span className="snapshot-history__price">${formatPrice(snapshot.price)}</span>
              <span className="snapshot-history__time">{new Date(Number(snapshot.timestamp) * 1000).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
