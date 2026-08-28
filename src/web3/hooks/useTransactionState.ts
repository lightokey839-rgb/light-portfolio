import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { supportedChain } from "../config/chains";
import { friendlyWalletError } from "../lib/errors";

/**
 * Every state a Web3 write interaction can be in, start to finish. Every
 * button/panel that triggers a transaction reads from this instead of
 * inventing its own ad-hoc loading/error booleans — see portfolio
 * requirement 20 ("every blockchain interaction should provide clear
 * states").
 */
export type TxStatus =
  | "idle"
  | "connect-wallet"
  | "wrong-network"
  | "awaiting-signature"
  | "pending"
  | "success"
  | "rejected"
  | "error";

export type TxState = {
  status: TxStatus;
  hash: `0x${string}` | null;
  errorMessage: string | null;
};

/**
 * Wraps a single wagmi contract write in the state machine above. Call
 * `send(config)` with the same args you'd pass to wagmi's `writeContract`.
 */
export function useTransactionState() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<TxState>({ status: "idle", hash: null, errorMessage: null });

  const send = useCallback(
    async (config: Parameters<typeof writeContractAsync>[0]) => {
      if (!isConnected) {
        setState({ status: "connect-wallet", hash: null, errorMessage: null });
        return;
      }
      if (chainId !== supportedChain.id) {
        setState({ status: "wrong-network", hash: null, errorMessage: null });
        return;
      }

      setState({ status: "awaiting-signature", hash: null, errorMessage: null });
      try {
        const hash = await writeContractAsync(config);
        setState({ status: "pending", hash, errorMessage: null });
        return hash;
      } catch (error) {
        const friendly = friendlyWalletError(error);
        const rejected = friendly === "Transaction cancelled.";
        setState({ status: rejected ? "rejected" : "error", hash: null, errorMessage: friendly });
        return undefined;
      }
    },
    [isConnected, chainId, writeContractAsync]
  );

  const reset = useCallback(() => setState({ status: "idle", hash: null, errorMessage: null }), []);

  return { state, send, reset, setState };
}

/** Watches a pending hash and flips the state machine to success/error on confirmation. */
export function useConfirmation(hash: `0x${string}` | null, onResolved: (status: TxStatus) => void) {
  const { data: receipt, isSuccess, isError } = useWaitForTransactionReceipt({ hash: hash ?? undefined });

  useEffect(() => {
    if (isSuccess && receipt?.status === "success") onResolved("success");
    else if (isSuccess && receipt?.status === "reverted") onResolved("error");
    else if (isError) onResolved("error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isError, receipt?.status]);
}
