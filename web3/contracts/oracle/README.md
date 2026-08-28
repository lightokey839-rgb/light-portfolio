Part of the [Light Web3 workspace](../../README.md) — shared setup,
testing, and environment-variable instructions live there; this file
covers only what's specific to this project.

# Project D — LightOracle (Oracle / Chainlink Integration)

Secure external data consumption via Chainlink — two contracts that
*consume* Chainlink infrastructure rather than deploy or operate any of
it themselves:

| Contract | Role |
|---|---|
| `contracts/oracle/LightPriceConsumer.sol` | Reads Chainlink's Data Feed, validates the result (positive price, complete round, not stale) before returning it. |
| `contracts/oracle/LightPriceSnapshotter.sol` | Implements `AutomationCompatibleInterface` (`checkUpkeep`/`performUpkeep`) to record validated price snapshots on a schedule. |
| `contracts/oracle/mocks/MockV3Aggregator.sol` | Test-only stand-in implementing the same `AggregatorV3Interface` — used exclusively by the Hardhat test suite, since a local network can't reach Chainlink's real decentralized oracle network. **Never deployed to Sepolia or any real network.** |

## The feed address is real, verified infrastructure — not fabricated

`scripts/deploy-oracle.ts` points both contracts at
`0x694AA1769357215DE4FAC081bf1f309aDC325306` — Chainlink's own, already-
live ETH/USD Data Feed on Sepolia. This address was confirmed directly
against Chainlink's official documentation
([price feed addresses](https://docs.chain.link/data-feeds/price-feeds/addresses),
[API reference](https://docs.chain.link/data-feeds/api-reference)) rather
than assumed from memory or copied from a secondary source. This project
does not deploy, control, or claim credit for that feed — it's real
infrastructure Chainlink's decentralized oracle network already operates;
`LightPriceConsumer` and `LightPriceSnapshotter` are consumers of it, and
the frontend never substitutes a hardcoded or mocked value while
presenting it as oracle data.

## Architecture

```
Chainlink DON (decentralized oracle network)
 ↓
Chainlink Aggregator — Sepolia ETH/USD (0x694AA...25306, Chainlink's own)
 ↓
LightPriceConsumer — validates: positive, complete round, not stale
 ↓
LightPriceSnapshotter — Automation-compatible: records on a schedule
 ↓
Frontend (React) — src/web3/*, src/pages/lab/OracleLabPage.tsx
 ↓
User
```

On-chain: `LightPriceConsumer`, `LightPriceSnapshotter`, and Chainlink's
own aggregator (infrastructure, not part of this project's deployment).
Off-chain / infrastructure: the Chainlink decentralized oracle network
itself, and (once registered) the Chainlink Automation network calling
`performUpkeep` on a schedule.

## Testing

`npm test` also runs `test/oracle/`:

- **`LightPriceConsumer.test.ts`** — correct price/decimals/round
  passthrough, reflecting feed updates, `InvalidPrice` on a zero/negative
  answer, `StalePrice` once past `MAX_STALENESS` (including the exact
  boundary), and that a fresh update resets staleness even after a long
  gap.
- **`LightPriceSnapshotter.test.ts`** — `checkUpkeep`/`performUpkeep`
  interval enforcement, `TooEarly` on a repeat call, `checkUpkeep` state
  transitions around a snapshot, `InvalidPrice`/`StalePrice` rejection
  inside `performUpkeep` itself (not just relying on `checkUpkeep`), and
  bounded history (oldest entry evicted past `MAX_HISTORY`).

Both suites run against `MockV3Aggregator`, not the real Chainlink feed —
a local Hardhat network has no path to Chainlink's decentralized oracle
network, so this is the standard, honest way to unit-test a Data Feed
consumer. The deploy script points at the real feed; the tests point at
the mock. Neither pretends to be the other.

## Deployment (Sepolia)

```bash
npm run deploy:oracle:sepolia   # writes deployments/sepolia.json (oracle namespace)
npm run verify:oracle:sepolia   # submits source to Etherscan
```

**Not run yet**, same reason as the other three projects — no funded
deployer key or RPC URL in this environment.

A further, separate external step: registering `LightPriceSnapshotter`
with Chainlink Automation at
[automation.chain.link](https://automation.chain.link) (funded with
Sepolia LINK from [Chainlink's faucet](https://faucets.chain.link/)) is
what makes `performUpkeep` actually get called automatically, on a
schedule, rather than only when someone clicks "Take a snapshot now" in
the demo UI. This registration is not performed by this codebase — it's
a UI action on Chainlink's own site requiring LINK funding, the same
category of external dependency as a funded deployer key.

## Validation &amp; security considerations

- **Staleness validation** — `block.timestamp > updatedAt + MAX_STALENESS`
  (not a subtraction, which could underflow if `updatedAt` were ever
  unexpectedly in the future).
- **Invalid-data handling** — `answer <= 0` reverts with `InvalidPrice`
  rather than propagating a corrupt value.
- **Round consistency** — `answeredInRound < roundId` is checked as a
  secondary sanity check. Documented honestly: Chainlink's own current
  guidance notes this comparison has known limitations as a *sole*
  staleness signal, which is why `MAX_STALENESS` is the primary defense
  here, not this check.
- **Safe value processing** — validation order is invalid-price →
  incomplete-round → staleness, so a corrupt answer is rejected
  regardless of how fresh its timestamp is.
- **Automation re-validates independently** — `performUpkeep` re-checks
  the interval and re-validates the price itself rather than trusting
  that `checkUpkeep` was actually called first; anyone can call
  `performUpkeep` directly; it must be safe to call at any time.
- **Bounded storage** — `LightPriceSnapshotter` caps history at
  `MAX_HISTORY`, evicting the oldest entry, rather than growing forever.

## Known limitations

- **Not audited** — same statement as the other three projects.
- **Fixed staleness threshold for every feed.** `MAX_STALENESS` (24h) is
  one conservative value used regardless of which feed is configured;
  production code should look up the specific feed's published heartbeat
  (shown per-feed on Chainlink's Price Feed Addresses page) instead.
- **No L2 sequencer-uptime check** — irrelevant on Sepolia (an L1
  testnet) but would be required if this were adapted to an L2 like
  Arbitrum or Optimism, per Chainlink's own L2 guidance.
- **Automation not registered** — see "Deployment" above. Snapshots are
  only ever taken when `performUpkeep` is called, manually in this demo,
  until real Automation registration is completed.
- **Single-feed, single-chain.** Only ETH/USD on Sepolia; the contracts
  support any Chainlink `AggregatorV3Interface` feed via constructor
  argument, but only one is deployed here.
