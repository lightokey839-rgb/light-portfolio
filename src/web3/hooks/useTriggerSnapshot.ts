import { oracleContracts } from "../config/contracts";
import { useTransactionState } from "./useTransactionState";

/**
 * Chainlink Automation registration (which would call performUpkeep
 * automatically, on a schedule) is an external step requiring
 * automation.chain.link + funded LINK — not performed by this codebase.
 * Until registered, performUpkeep is still a plain external function
 * anyone can call directly, which is what this hook does — it lets a
 * portfolio visitor trigger a real snapshot without waiting for
 * automatic scheduling to be set up.
 */
export function useTriggerSnapshot() {
  const snapshotter = oracleContracts.snapshotter;
  const tx = useTransactionState();

  const trigger = () => {
    if (!snapshotter.address) return;
    return tx.send({ address: snapshotter.address, abi: snapshotter.abi, functionName: "performUpkeep", args: ["0x"] });
  };

  return { ...tx, trigger };
}
