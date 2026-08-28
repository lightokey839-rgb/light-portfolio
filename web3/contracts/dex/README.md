Part of the [Light Web3 workspace](../../README.md) — shared setup,
testing, and environment-variable instructions live there; this file
covers only what's specific to this project.

# Project A — LightSwap (DeFi / DEX)

A constant-product AMM (Uniswap V2 architecture, independently written and
adapted — not a fork) with three contracts:

| Contract | Role |
|---|---|
| `contracts/dex/LightSwapFactory.sol` | Deploys and indexes one `LightSwapPair` per token pair. |
| `contracts/dex/LightSwapPair.sol` | Holds reserves for one token pair, mints/burns LP shares, executes swaps against the `x*y=k` invariant. Itself an ERC-20 (the LP token). |
| `contracts/dex/LightSwapRouter.sol` | User-facing entrypoint: optimal-ratio liquidity math, multi-hop swap routing, slippage (`amountMin`) and deadline protection. |
| `contracts/dex/LightTestToken.sol` | Mintable ERC-20 with a rate-limited public faucet — the two demo assets (Light USD / Light DAI) traded on the demo pool. Explicitly not a real-value asset. |

## Architecture

```
User
 ↓
Wallet (MetaMask / injected provider)
 ↓
Frontend (React) — src/web3/*
 ↓
viem / wagmi (Web3 client)
 ↓
LightSwapRouter  →  LightSwapFactory / LightSwapPair
 ↓
Sepolia testnet (Ethereum)
```

On-chain: `LightSwapFactory`, `LightSwapPair`, `LightSwapRouter`,
`LightTestToken`. Off-chain / infrastructure: the frontend's quote preview
(mirrors `getAmountOut` in TypeScript so the UI can show a price before the
user signs anything — the contract independently re-checks the invariant on
submission, so the frontend quote is a prediction, never a trust
assumption).

## Setup

```bash
cd web3
npm install
cp .env.example .env   # fill in SEPOLIA_RPC_URL / DEPLOYER_PRIVATE_KEY / ETHERSCAN_API_KEY
npm run compile
npm test
```

## Testing

`npm test` runs the Hardhat/Chai suite in `test/dex/`:

- **`LightSwapFactory.test.ts`** — pair creation, bidirectional lookup,
  duplicate/identical/zero-address rejection, `feeToSetter` access control.
- **`LightSwapPair.test.ts`** — minimum-liquidity lock on first deposit,
  proportional minting on subsequent deposits, pro-rata burns, the swap
  invariant (including that `k` strictly increases from fees), rejection of
  invariant-violating swaps, rejection of swaps to the pool's own token
  addresses, `sync()` reconciliation.
- **`LightSwapRouter.test.ts`** — liquidity-ratio math on unequal deposits,
  slippage protection on `addLiquidity`/swaps, deadline expiry, exact-in and
  exact-out swaps, `PairNotFound` on a nonexistent path.

Run `npm run coverage` for a coverage report, `REPORT_GAS=true npm test` for
gas usage per test.

## Deployment (Sepolia)

```bash
npm run deploy:dex:sepolia   # writes deployments/sepolia.json (dex namespace) with real addresses/tx hashes
npm run verify:dex:sepolia   # submits source to Etherscan
```

**This has not been run yet in this change** — it requires a funded Sepolia
deployer key and an RPC URL, neither of which exist in the environment this
code was written in. `deployments/sepolia.json` ships with every address set
to `null` for exactly that reason; the frontend contract registry
(`src/web3/config/contracts.ts`) reads this file and renders an honest
"Deployment pending" state instead of a fabricated address. Once deployed,
copy the script's output into `src/web3/deployments/sepolia.json` to wire
the frontend to the real contracts.

## Security considerations

- **Reentrancy** — `mint`, `burn`, `swap`, and `sync` on `LightSwapPair` are
  `nonReentrant` (OpenZeppelin `ReentrancyGuard`). The router holds no
  persistent token balance between calls, so there's nothing for a
  reentrant call into it to steal.
- **Checks-effects-interactions** — reserves (`_update`) are only written
  after external token transfers are attempted in `burn`/`swap`; `mint`
  reads balances (which reflect a transfer the *caller* already made)
  before minting.
- **Slippage protection** — enforced at the router (`amountOutMin` /
  `amountInMax` / `amountAMin` / `amountBMin`), not the pair. The pair only
  guarantees the AMM invariant holds; it has no concept of "acceptable."
- **Price impact** — a direct consequence of the constant-product formula;
  the frontend surfaces it explicitly (see `src/web3/hooks/useSwapQuote.ts`)
  rather than only showing the output amount.
- **Token approval risk** — the router uses `transferFrom`, so it only ever
  moves what the user has explicitly approved. The frontend never requests
  unlimited approvals silently — see `src/web3/hooks/useTokenApproval.ts`.
- **Reserve accounting / rounding** — reserves are cached as `uint112` (packed
  with a `uint32` timestamp into one slot, matching the source pattern);
  `_update` reverts on overflow past `type(uint112).max` rather than
  silently wrapping.
- **First-depositor / donation attack** — mitigated the standard way:
  `MINIMUM_LIQUIDITY` (1000 wei of LP shares) is permanently locked to
  `address(0)` on the first deposit, which puts a floor under the minimum
  share price.
- **Access control** — `LightSwapFactory.setFeeTo` / `setFeeToSetter` are
  gated to the current `feeToSetter`. No other privileged role exists in
  this contract set — there is no owner who can pause trading, blacklist an
  address, or upgrade the contracts.

## Known limitations

- **Not audited.** This is a portfolio/demonstration implementation of a
  well-understood AMM design, built and tested by one engineer. It has not
  had an external security review, and nothing in this repository claims
  otherwise.
- **Protocol fee switch is inert.** `LightSwapFactory.feeTo` exists but
  `LightSwapPair.mint` does not currently mint the corresponding protocol
  fee share — activating it is future work, not a current feature.
- **No CREATE2 deterministic pair addresses.** Pairs are deployed with plain
  `new`, so the router always looks addresses up via the factory rather
  than computing them offline. Simpler and smaller audit surface; slightly
  more gas per lookup.
- **No malicious-token / ERC-777-style reentrancy fixture in the test
  suite.** `nonReentrant` guards are in place, but the tests exercise them
  against well-behaved ERC-20s, not a token with transfer hooks. Adding
  such a fixture is a natural next step before treating this as
  security-reviewed.
- **Single-chain (Sepolia) only.** No mainnet deployment, and none is
  implied anywhere in the frontend — see `src/web3/config/chains.ts`.
