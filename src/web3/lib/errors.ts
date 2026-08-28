/**
 * Every Web3 error a user can actually hit, translated into one short,
 * calm sentence. Nothing here ever surfaces a raw RPC error object, a
 * stack trace, or a Solidity revert's hex selector to the UI — see
 * portfolio requirement 21 ("show useful user-facing errors without
 * exposing raw stack traces").
 */
export type WalletErrorKind =
  | "user-rejected"
  | "wrong-network"
  | "insufficient-funds"
  | "wallet-unavailable"
  | "contract-revert"
  | "rpc-error"
  | "timeout"
  | "unknown";

const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  InsufficientOutputAmount: "The price moved and your minimum output could no longer be met. Try again with a higher slippage tolerance.",
  ExcessiveInputAmount: "The price moved and this trade would now cost more than your set maximum.",
  InsufficientAAmount: "The second token amount fell below your slippage tolerance.",
  InsufficientBAmount: "The second token amount fell below your slippage tolerance.",
  Expired: "This transaction's deadline passed before it was confirmed. Please try again.",
  KInvariant: "This trade would break the pool's pricing formula — likely a stale quote. Try again.",
  InsufficientLiquidity: "The pool doesn't have enough liquidity for this trade size.",
  PairNotFound: "No liquidity pool exists yet for this token pair.",
};

export function classifyWalletError(error: unknown): WalletErrorKind {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("user rejected") || message.includes("user denied") || message.includes("4001")) {
    return "user-rejected";
  }
  if (message.includes("insufficient funds")) return "insufficient-funds";
  if (message.includes("chain mismatch") || message.includes("wrong network") || message.includes("unsupported chain")) {
    return "wrong-network";
  }
  if (message.includes("no ethereum provider") || message.includes("no injected") || message.includes("not detected")) {
    return "wallet-unavailable";
  }
  if (message.includes("timeout") || message.includes("timed out")) return "timeout";
  if (Object.keys(CUSTOM_ERROR_MESSAGES).some((name) => message.includes(name.toLowerCase()))) {
    return "contract-revert";
  }
  if (message.includes("revert") || message.includes("execution reverted")) return "contract-revert";
  if (message.includes("network") || message.includes("rpc")) return "rpc-error";
  return "unknown";
}

/** One clean sentence for the UI. Never returns raw error text for unknown/rpc/contract errors. */
export function friendlyWalletError(error: unknown): string {
  const kind = classifyWalletError(error);
  const message = errorMessage(error);

  for (const [name, friendly] of Object.entries(CUSTOM_ERROR_MESSAGES)) {
    if (message.includes(name)) return friendly;
  }

  switch (kind) {
    case "user-rejected":
      return "Transaction cancelled.";
    case "wrong-network":
      return "Please switch your wallet to the Sepolia test network to continue.";
    case "insufficient-funds":
      return "Your wallet doesn't have enough ETH to cover this transaction's gas.";
    case "wallet-unavailable":
      return "No wallet extension detected. Install MetaMask (or another EVM wallet) to continue.";
    case "timeout":
      return "The network took too long to respond. Please try again.";
    case "contract-revert":
      return "The transaction would fail on-chain and was not sent. Double-check the amounts and try again.";
    case "rpc-error":
      return "Couldn't reach the network right now. Please try again in a moment.";
    default:
      return "Something went wrong sending that transaction. Please try again.";
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const withShortMessage = error as { shortMessage?: string; message?: string };
    return withShortMessage.shortMessage ?? withShortMessage.message ?? String(error);
  }
  return String(error);
}
