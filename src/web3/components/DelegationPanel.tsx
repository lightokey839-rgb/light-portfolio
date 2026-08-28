import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { isDaoDeployed } from "../config/contracts";
import { useGovTokenBalance, useVotingPower, useDelegationStatus, useDelegate, useGovFaucet } from "../hooks/useGovernanceToken";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./DelegationPanel.css";

export default function DelegationPanel() {
  const { isConnected } = useAccount();
  const balance = useGovTokenBalance();
  const votingPower = useVotingPower();
  const delegation = useDelegationStatus();
  const delegate = useDelegate();
  const faucet = useGovFaucet();

  useConfirmation(delegate.state.hash, (s) => delegate.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(faucet.state.hash, (s) => faucet.setState((prev) => ({ ...prev, status: s })));

  if (!isDaoDeployed()) {
    return (
      <div className="delegation-panel delegation-panel--pending">
        <p>Deployment pending — this panel is fully wired against the real LightGovernanceToken ABI and will work once it's deployed to Sepolia.</p>
      </div>
    );
  }

  if (!isConnected) {
    return <p className="delegation-panel__status">Connect your wallet to see your LGOV balance and voting power.</p>;
  }

  const busy = delegate.state.status === "awaiting-signature" || delegate.state.status === "pending";
  const faucetBusy = faucet.state.status === "awaiting-signature" || faucet.state.status === "pending";

  return (
    <div className="delegation-panel">
      <div className="delegation-panel__stats">
        <div>
          <p className="delegation-panel__label">LGOV balance</p>
          <p className="delegation-panel__value">{balance.data !== undefined ? formatEther(balance.data as bigint) : "—"}</p>
        </div>
        <div>
          <p className="delegation-panel__label">Voting power</p>
          <p className="delegation-panel__value">{votingPower.data !== undefined ? formatEther(votingPower.data as bigint) : "—"}</p>
        </div>
      </div>

      {!delegation.hasDelegated && (
        <div className="delegation-panel__prompt">
          <p>
            Your balance doesn't count as voting power yet — <code>ERC20Votes</code> requires an explicit delegation.
            Delegating to yourself activates it.
          </p>
          <button type="button" className="delegation-panel__btn" disabled={busy} onClick={() => delegate.delegateToSelf()}>
            {busy ? "Delegating…" : "Delegate to myself"}
          </button>
          <TransactionStatus state={delegate.state} />
        </div>
      )}

      <div className="delegation-panel__faucet">
        <button type="button" className="delegation-panel__btn delegation-panel__btn--ghost" disabled={faucetBusy} onClick={() => faucet.claim()}>
          {faucetBusy ? "Minting…" : "Get 100 LGOV from faucet"}
        </button>
        <TransactionStatus state={faucet.state} />
      </div>
    </div>
  );
}
