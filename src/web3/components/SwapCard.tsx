import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { dexContracts, isDexDeployed } from "../config/contracts";
import { useTokenBalance, useTokenAllowance, useApproveRouter } from "../hooks/useTokenApproval";
import { useSwapQuote } from "../hooks/useSwapQuote";
import { useSwap, applySlippage } from "../hooks/useSwap";
import { useConfirmation } from "../hooks/useTransactionState";
import TransactionStatus from "./TransactionStatus";
import "./SwapCard.css";

type TokenKey = "lightUSD" | "lightDAI";
const SLIPPAGE_OPTIONS = [10, 50, 100]; // basis points: 0.1%, 0.5%, 1%

export default function SwapCard() {
  const { isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState<TokenKey>("lightUSD");
  const [tokenOut, setTokenOut] = useState<TokenKey>("lightDAI");
  const [amountInText, setAmountInText] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);

  const deployed = isDexDeployed();

  const amountIn = useMemo(() => {
    if (!amountInText || Number.isNaN(Number(amountInText))) return undefined;
    try {
      return parseUnits(amountInText, 18);
    } catch {
      return undefined;
    }
  }, [amountInText]);

  const balanceIn = useTokenBalance(tokenIn);
  const allowanceIn = useTokenAllowance(tokenIn);
  const quote = useSwapQuote(tokenIn, tokenOut, amountIn);
  const approval = useApproveRouter(tokenIn);
  const swapTx = useSwap(tokenIn, tokenOut);

  useConfirmation(approval.state.hash, (status) => approval.setState((s) => ({ ...s, status })));
  useConfirmation(swapTx.state.hash, (status) => swapTx.setState((s) => ({ ...s, status })));

  const needsApproval = Boolean(
    amountIn && allowanceIn.data !== undefined && (allowanceIn.data as bigint) < amountIn
  );
  const minAmountOut = quote.amountOut ? applySlippage(quote.amountOut, slippageBps) : undefined;
  const priceImpactHigh = (quote.priceImpactBps ?? 0) > 300; // >3%

  const flipTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountInText("");
  };

  const busy = approval.state.status === "awaiting-signature" || approval.state.status === "pending" ||
    swapTx.state.status === "awaiting-signature" || swapTx.state.status === "pending";

  const canSwap = Boolean(amountIn && amountIn > 0n && !needsApproval && quote.amountOut && !busy);

  if (!deployed) {
    return (
      <div className="swap-card swap-card--pending">
        <p className="swap-card__pending-title">Deployment pending</p>
        <p className="swap-card__pending-body">
          The contracts this swap UI talks to (see the Contracts tab below) haven't been deployed to Sepolia yet —
          the frontend is fully wired up against the real router ABI and will work as soon as they are. See{" "}
          <code>web3/README.md</code> for the exact deploy command.
        </p>
      </div>
    );
  }

  return (
    <div className="swap-card">
      <div className="swap-card__field">
        <div className="swap-card__field-head">
          <span>You pay</span>
          <span className="swap-card__balance">
            Balance: {balanceIn.data !== undefined ? formatUnits(balanceIn.data as bigint, 18) : "—"}{" "}
            {dexContracts[tokenIn].symbol}
          </span>
        </div>
        <div className="swap-card__field-row">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amountInText}
            onChange={(e) => setAmountInText(e.target.value.replace(/[^0-9.]/g, ""))}
            aria-label={`Amount of ${dexContracts[tokenIn].symbol} to pay`}
          />
          <span className="swap-card__token">{dexContracts[tokenIn].symbol}</span>
        </div>
      </div>

      <button type="button" className="swap-card__flip" onClick={flipTokens} aria-label="Reverse swap direction">
        ↓
      </button>

      <div className="swap-card__field">
        <div className="swap-card__field-head">
          <span>You receive (estimated)</span>
        </div>
        <div className="swap-card__field-row">
          <input
            readOnly
            value={quote.amountOut ? formatUnits(quote.amountOut, 18) : ""}
            placeholder="0.0"
            aria-label={`Estimated ${dexContracts[tokenOut].symbol} received`}
          />
          <span className="swap-card__token">{dexContracts[tokenOut].symbol}</span>
        </div>
      </div>

      <div className="swap-card__slippage">
        <span>Slippage tolerance</span>
        <div className="swap-card__slippage-options">
          {SLIPPAGE_OPTIONS.map((bps) => (
            <button
              key={bps}
              type="button"
              className={`swap-card__slippage-btn${slippageBps === bps ? " swap-card__slippage-btn--active" : ""}`}
              onClick={() => setSlippageBps(bps)}
              aria-pressed={slippageBps === bps}
            >
              {(bps / 100).toFixed(1)}%
            </button>
          ))}
        </div>
      </div>

      {quote.priceImpactBps !== null && amountIn !== undefined && amountIn > 0n && (
        <div className={`swap-card__impact${priceImpactHigh ? " swap-card__impact--high" : ""}`} role={priceImpactHigh ? "alert" : undefined}>
          Price impact: ~{(quote.priceImpactBps / 100).toFixed(2)}%
          {priceImpactHigh && " — this trade is large relative to pool liquidity."}
        </div>
      )}

      {needsApproval ? (
        <button
          type="button"
          className="swap-card__action"
          disabled={busy || !isConnected}
          onClick={() => amountIn && approval.approve(amountIn)}
        >
          {approval.state.status === "awaiting-signature" || approval.state.status === "pending"
            ? "Approving…"
            : `Approve ${dexContracts[tokenIn].symbol}`}
        </button>
      ) : (
        <button
          type="button"
          className="swap-card__action"
          disabled={!canSwap}
          onClick={() => amountIn && minAmountOut && swapTx.swap(amountIn, minAmountOut)}
        >
          {!isConnected ? "Connect wallet to swap" : busy ? "Swapping…" : "Swap"}
        </button>
      )}

      <TransactionStatus state={approval.state} />
      <TransactionStatus state={swapTx.state} />

      <p className="swap-card__note">
        LUSD and LDAI are demonstration test tokens with no real value — mint some from the faucet below to try this.
      </p>
    </div>
  );
}
