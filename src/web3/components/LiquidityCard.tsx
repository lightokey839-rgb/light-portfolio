import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { dexContracts, isDexDeployed } from "../config/contracts";
import { useTokenBalance, useTokenAllowance, useApproveRouter } from "../hooks/useTokenApproval";
import { useAddLiquidity, useRemoveLiquidity, useLpBalance, usePairReserves } from "../hooks/useLiquidity";
import { useTransactionState, useConfirmation } from "../hooks/useTransactionState";
import { lightSwapPairAbi } from "../abi/LightSwapPair";
import TransactionStatus from "./TransactionStatus";
import "./LiquidityCard.css";

const SLIPPAGE_BPS = 100; // 1% default tolerance for liquidity actions

export default function LiquidityCard() {
  const { isConnected } = useAccount();
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [amountLusdText, setAmountLusdText] = useState("");
  const [amountLdaiText, setAmountLdaiText] = useState("");
  const [removePercent, setRemovePercent] = useState(100);

  const deployed = isDexDeployed();
  const reserves = usePairReserves();
  const lpBalance = useLpBalance();

  const balanceLusd = useTokenBalance("lightUSD");
  const balanceLdai = useTokenBalance("lightDAI");
  const allowanceLusd = useTokenAllowance("lightUSD");
  const allowanceLdai = useTokenAllowance("lightDAI");

  const approveLusd = useApproveRouter("lightUSD");
  const approveLdai = useApproveRouter("lightDAI");
  const addLiquidity = useAddLiquidity();
  const removeLiquidity = useRemoveLiquidity();
  const approveLp = useTransactionState();

  useConfirmation(approveLusd.state.hash, (s) => approveLusd.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(approveLdai.state.hash, (s) => approveLdai.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(addLiquidity.state.hash, (s) => addLiquidity.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(removeLiquidity.state.hash, (s) => removeLiquidity.setState((prev) => ({ ...prev, status: s })));
  useConfirmation(approveLp.state.hash, (s) => approveLp.setState((prev) => ({ ...prev, status: s })));

  const amountLusd = useMemo(() => safeParse(amountLusdText), [amountLusdText]);
  const amountLdai = useMemo(() => safeParse(amountLdaiText), [amountLdaiText]);

  const needsLusdApproval = Boolean(amountLusd && allowanceLusd.data !== undefined && (allowanceLusd.data as bigint) < amountLusd);
  const needsLdaiApproval = Boolean(amountLdai && allowanceLdai.data !== undefined && (allowanceLdai.data as bigint) < amountLdai);

  const lpToRemove = lpBalance.data ? ((lpBalance.data as bigint) * BigInt(removePercent)) / 100n : 0n;

  if (!deployed) {
    return (
      <div className="liquidity-card liquidity-card--pending">
        <p>Deployment pending — same reason as the swap card above. Contract calls here are fully wired against the real router ABI.</p>
      </div>
    );
  }

  return (
    <div className="liquidity-card">
      <div className="liquidity-card__tabs" role="tablist" aria-label="Liquidity action">
        <button role="tab" aria-selected={mode === "add"} className={mode === "add" ? "is-active" : ""} onClick={() => setMode("add")}>
          Add liquidity
        </button>
        <button role="tab" aria-selected={mode === "remove"} className={mode === "remove" ? "is-active" : ""} onClick={() => setMode("remove")}>
          Remove liquidity
        </button>
      </div>

      {reserves.data && (
        <p className="liquidity-card__pool-info">
          Pool reserves: {formatUnits(reserves.data[0], 18)} LUSD / {formatUnits(reserves.data[1], 18)} LDAI
        </p>
      )}

      {mode === "add" ? (
        <>
          <label className="liquidity-card__field">
            <span>LUSD amount (balance: {balanceLusd.data !== undefined ? formatUnits(balanceLusd.data as bigint, 18) : "—"})</span>
            <input inputMode="decimal" value={amountLusdText} onChange={(e) => setAmountLusdText(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.0" />
          </label>
          <label className="liquidity-card__field">
            <span>LDAI amount (balance: {balanceLdai.data !== undefined ? formatUnits(balanceLdai.data as bigint, 18) : "—"})</span>
            <input inputMode="decimal" value={amountLdaiText} onChange={(e) => setAmountLdaiText(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.0" />
          </label>

          {needsLusdApproval && (
            <button className="liquidity-card__action" disabled={!isConnected} onClick={() => amountLusd && approveLusd.approve(amountLusd)}>
              Approve LUSD
            </button>
          )}
          {needsLdaiApproval && (
            <button className="liquidity-card__action" disabled={!isConnected} onClick={() => amountLdai && approveLdai.approve(amountLdai)}>
              Approve LDAI
            </button>
          )}
          {!needsLusdApproval && !needsLdaiApproval && (
            <button
              className="liquidity-card__action"
              disabled={!isConnected || !amountLusd || !amountLdai}
              onClick={() => {
                if (!amountLusd || !amountLdai) return;
                const minLusd = (amountLusd * BigInt(10_000 - SLIPPAGE_BPS)) / 10_000n;
                const minLdai = (amountLdai * BigInt(10_000 - SLIPPAGE_BPS)) / 10_000n;
                addLiquidity.add(amountLusd, amountLdai, minLusd, minLdai);
              }}
            >
              {!isConnected ? "Connect wallet" : "Add liquidity"}
            </button>
          )}

          <TransactionStatus state={approveLusd.state} />
          <TransactionStatus state={approveLdai.state} />
          <TransactionStatus state={addLiquidity.state} />
        </>
      ) : (
        <>
          <p className="liquidity-card__lp-balance">
            Your LP shares: {lpBalance.data !== undefined ? formatUnits(lpBalance.data as bigint, 18) : "—"}
          </p>
          <div className="liquidity-card__percent-row">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} className={removePercent === p ? "is-active" : ""} onClick={() => setRemovePercent(p)}>
                {p}%
              </button>
            ))}
          </div>

          <button
            className="liquidity-card__action"
            disabled={!isConnected || lpToRemove === 0n}
            onClick={() =>
              dexContracts.router.address &&
              dexContracts.pair.address &&
              approveLp.send({
                address: dexContracts.pair.address,
                abi: lightSwapPairAbi,
                functionName: "approve",
                args: [dexContracts.router.address, lpToRemove],
              })
            }
          >
            Approve LP tokens
          </button>
          <button
            className="liquidity-card__action"
            disabled={!isConnected || lpToRemove === 0n}
            onClick={() => removeLiquidity.remove(lpToRemove, 0n, 0n)}
          >
            Remove liquidity
          </button>

          <TransactionStatus state={approveLp.state} />
          <TransactionStatus state={removeLiquidity.state} />
        </>
      )}
    </div>
  );
}

function safeParse(text: string): bigint | undefined {
  if (!text || Number.isNaN(Number(text))) return undefined;
  try {
    return parseUnits(text, 18);
  } catch {
    return undefined;
  }
}
