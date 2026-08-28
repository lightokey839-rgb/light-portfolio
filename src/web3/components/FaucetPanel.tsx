import { useFaucet } from "../hooks/useFaucet";
import { useConfirmation } from "../hooks/useTransactionState";
import { dexContracts, isDexDeployed } from "../config/contracts";
import TransactionStatus from "./TransactionStatus";
import "./FaucetPanel.css";

function FaucetButton({ token }: { token: "lightUSD" | "lightDAI" }) {
  const faucet = useFaucet(token);
  useConfirmation(faucet.state.hash, (status) => faucet.setState((s) => ({ ...s, status })));
  const busy = faucet.state.status === "awaiting-signature" || faucet.state.status === "pending";

  return (
    <div className="faucet-panel__item">
      <button type="button" className="faucet-panel__btn" onClick={() => faucet.claim()} disabled={busy}>
        {busy ? "Minting…" : `Get ${dexContracts[token].symbol}`}
      </button>
      <TransactionStatus state={faucet.state} />
    </div>
  );
}

export default function FaucetPanel() {
  if (!isDexDeployed()) return null;
  return (
    <div className="faucet-panel">
      <p className="faucet-panel__title">Faucet — demonstration tokens only, no real value</p>
      <div className="faucet-panel__grid">
        <FaucetButton token="lightUSD" />
        <FaucetButton token="lightDAI" />
      </div>
      <p className="faucet-panel__note">Limited to one claim per wallet per hour, enforced on-chain by the token contract.</p>
    </div>
  );
}
