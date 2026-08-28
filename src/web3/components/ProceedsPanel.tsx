import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { isNftDeployed } from "../config/contracts";
import { useProceeds, useWithdrawProceeds } from "../hooks/useMarketplace";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./ProceedsPanel.css";

export default function ProceedsPanel() {
  const { isConnected } = useAccount();
  const proceeds = useProceeds();
  const withdraw = useWithdrawProceeds();
  useConfirmation(withdraw.state.hash, (status) => withdraw.setState((s) => ({ ...s, status })));

  if (!isNftDeployed() || !isConnected) return null;

  const amount = (proceeds.data as bigint | undefined) ?? 0n;
  if (amount === 0n && withdraw.state.status === "idle") return null;

  const busy = withdraw.state.status === "awaiting-signature" || withdraw.state.status === "pending";

  return (
    <div className="proceeds-panel">
      <p className="proceeds-panel__amount">Withdrawable sale proceeds: {formatEther(amount)} ETH</p>
      <button type="button" className="proceeds-panel__btn" disabled={amount === 0n || busy} onClick={() => withdraw.withdraw()}>
        {busy ? "Withdrawing…" : "Withdraw"}
      </button>
      <TransactionStatus state={withdraw.state} />
      <p className="proceeds-panel__note">
        Sale proceeds accrue here rather than being sent automatically — the marketplace's pull-payment pattern (see Security below).
      </p>
    </div>
  );
}
