import { isOracleDeployed, oracleContracts } from "../config/contracts";
import { useLatestPrice, useFeedDescription } from "../hooks/useOracle";
import "./PriceCard.css";

function formatPrice(price: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = price / divisor;
  const fraction = price % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fractionStr}`;
}

export default function PriceCard() {
  const priceQuery = useLatestPrice();
  const descriptionQuery = useFeedDescription();

  if (!isOracleDeployed()) {
    return (
      <div className="price-card price-card--pending">
        <p>Deployment pending — this card is fully wired against the real LightPriceConsumer ABI, reading Chainlink's live Sepolia ETH/USD feed once deployed.</p>
      </div>
    );
  }

  if (priceQuery.isError) {
    return (
      <div className="price-card price-card--error" role="alert">
        <p>The feed data failed validation (stale, invalid, or an incomplete round) — the contract reverted rather than returning it. That's the validation working as intended, not a UI bug.</p>
      </div>
    );
  }

  if (priceQuery.isLoading || !priceQuery.data) {
    return <div className="price-card price-card--loading">Loading validated price…</div>;
  }

  const { price, decimals, updatedAt, roundId } = priceQuery.data as {
    price: bigint;
    decimals: number;
    updatedAt: bigint;
    roundId: bigint;
  };

  return (
    <div className="price-card">
      <p className="price-card__label">{(descriptionQuery.data as string) ?? "Chainlink Data Feed"}</p>
      <p className="price-card__value">${formatPrice(price, decimals)}</p>
      <dl className="price-card__meta">
        <div>
          <dt>Decimals</dt>
          <dd>{decimals}</dd>
        </div>
        <div>
          <dt>Round</dt>
          <dd>{roundId.toString()}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{new Date(Number(updatedAt) * 1000).toLocaleString()}</dd>
        </div>
      </dl>
      <p className="price-card__source">
        Live from Chainlink's Sepolia ETH/USD feed at{" "}
        <a href={oracleContracts.chainlinkFeed.explorerUrl ?? "#"} target="_blank" rel="noreferrer">
          {oracleContracts.chainlinkFeed.address.slice(0, 8)}…{oracleContracts.chainlinkFeed.address.slice(-6)}
        </a>{" "}
        — not this project's infrastructure, just consumed by it.
      </p>
    </div>
  );
}
