# Light Web3 — Smart Contracts

Solidity contracts for the Web3 projects shown on the Light portfolio.
This directory is a self-contained Hardhat + TypeScript workspace,
separate from the frontend (`/src`) and backend (`/backend`) packages.

**Status:** all four projects below are implemented (contracts + tests +
deploy/verify scripts + frontend integration where noted). None have
been deployed yet — see each project's own README for the exact
remaining external step.

## Projects

Each project has its own README covering its contracts, architecture,
testing, deployment, security considerations, and known limitations in
full — this file only covers what's shared across all four.

| Project | Contracts | Docs |
|---|---|---|
| **A — LightSwap** (DeFi / DEX) | `LightSwapFactory`, `LightSwapPair`, `LightSwapRouter`, `LightTestToken` | [`contracts/dex/README.md`](./contracts/dex/README.md) |
| **B — LightNFT Marketplace** (NFT) | `LightNFT`, `LightNFTMarketplace` | [`contracts/nft/README.md`](./contracts/nft/README.md) |
| **C — LightDAO** (Governance) | `LightGovernanceToken`, `LightGovernor`, `TimelockController` | [`contracts/dao/README.md`](./contracts/dao/README.md) |
| **D — LightOracle** (Chainlink) | `LightPriceConsumer`, `LightPriceSnapshotter` | [`contracts/oracle/README.md`](./contracts/oracle/README.md) |

## Setup (shared across all four projects)

```bash
cd web3
npm install
cp .env.example .env   # fill in SEPOLIA_RPC_URL / DEPLOYER_PRIVATE_KEY / ETHERSCAN_API_KEY
npm run compile
npm test                # runs every project's suite (test/dex, test/nft, test/dao, test/oracle)
```

`npm run coverage` for a coverage report; `REPORT_GAS=true npm test` for
gas usage per test. `npm run lint` runs solhint across all contracts.

## Environment variables

All defined in `.env.example`:

| Variable | Required for | Purpose |
|---|---|---|
| `SEPOLIA_RPC_URL` | `deploy:*:sepolia` | RPC endpoint for the Sepolia testnet. |
| `DEPLOYER_PRIVATE_KEY` | `deploy:*:sepolia` | Deployer wallet, funded with Sepolia test ETH from a faucet. Never a wallet holding real funds. |
| `ETHERSCAN_API_KEY` | `verify:*:sepolia` | Submits source code for contract verification. |
| `REPORT_GAS` | `npm test` (optional) | Set to `true` to print a gas-usage report. |

None of these are required for `npm run compile` or `npm test`, which
only need a local in-memory Hardhat network.

## Deployment scripts

Each project has its own `deploy:<project>:sepolia` / `verify:<project>:sepolia`
npm script (see the project's own README for specifics). All four write
into the same namespaced registry, `deployments/<network>.json` — one
top-level key per project (`dex`, `nft`, `dao`, `oracle`), so deploying
one project never clobbers another's addresses. The frontend's copy at
`src/web3/deployments/sepolia.json` is a manually-synced mirror; update
it after a real deployment so `src/web3/config/contracts.ts` picks up
the live addresses.

## Shared frontend integration

`src/web3/` (outside this workspace, in the main Vite app) holds the
wallet-connection UI, the centralized contract registry, and the
transaction-state machine every one of the four project pages
(`src/pages/lab/*.tsx`) is built from — see the root `README.md`'s "Web3
projects" section for how that layer is organized.

## Security

See the root [`SECURITY.md`](../SECURITY.md) for the portfolio-wide
security write-up spanning all four projects (including topics that cut
across them, like signature/replay protection and oracle/price
manipulation) — each project's own README additionally covers its
project-specific considerations and known limitations in more depth.
