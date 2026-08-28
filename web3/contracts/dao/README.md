Part of the [Light Web3 workspace](../../README.md) — shared setup,
testing, and environment-variable instructions live there; this file
covers only what's specific to this project.

# Project C — LightDAO (DAO / Governance)

Token-weighted governance built almost entirely from OpenZeppelin's
governance module — deliberately not a bespoke voting contract:

| Contract | Role |
|---|---|
| `contracts/dao/LightGovernanceToken.sol` | `ERC20Votes` governance token. Balances don't count as voting power until the holder calls `delegate()` — standard upstream behavior, surfaced explicitly in the UI. Includes a rate-limited faucet. |
| `contracts/dao/LightGovernor.sol` | `Governor` composed with `GovernorSettings`, `GovernorCountingSimple`, `GovernorVotes`, `GovernorVotesQuorumFraction`, `GovernorTimelockControl` — the standard OpenZeppelin Wizard composition. No custom voting/counting logic. |
| `TimelockController` | OpenZeppelin's own contract, deployed directly (no wrapper) via the deploy script. Doubles as the DAO's treasury — it holds the funds a passed proposal moves. |

## Why established primitives instead of a custom voting contract

Governance is exactly the domain where a from-scratch implementation is
the wrong call for a portfolio piece: subtle bugs here (double-voting,
snapshot manipulation, incorrect quorum math) are exactly what real
protocol exploits are made of, and OpenZeppelin's Governor module is
externally audited as part of the OpenZeppelin Contracts library. Using
it correctly — including the full secure setup sequence in
`scripts/deploy-dao.ts` (grant proposer/canceller to the Governor, grant
open executor, renounce the deployer's admin role) — demonstrates the
same engineering judgment a from-scratch contract would, without
reproducing security-critical logic that's already been reviewed by more
eyes than one portfolio project can get.

## Architecture

```
Token holder
 ↓
Wallet (MetaMask / injected provider)
 ↓
Frontend (React) — src/web3/*, src/pages/lab/DaoLabPage.tsx
 ↓
viem / wagmi (Web3 client)
 ↓
LightGovernor  →  TimelockController (treasury)  →  Target contract
 ↓
Sepolia testnet (Ethereum)
```

On-chain: `LightGovernanceToken`, `LightGovernor`, `TimelockController`.
Off-chain / infrastructure: the frontend discovers proposals via
`ProposalCreated` event logs (bounded to the governor's deployment block)
rather than a backend indexer.

## Testing

`npm test` also runs `test/dao/`:

- **`LightGovernanceToken.test.ts`** — faucet cooldown, that a balance
  doesn't count as voting power until `delegate()` is called, and that
  voting power is checkpointed (a later transfer doesn't retroactively
  change an earlier block's snapshot — the actual mechanism behind
  flash-loan-voting resistance).
- **`LightGovernor.test.ts`** — the full lifecycle (Pending → Active →
  Succeeded → Queued → Executed, moving real treasury ETH), a Defeated
  outcome when quorum isn't met even with 100% "For" votes, rejection of
  a second vote from the same account, rejection of execution before the
  timelock delay elapses, rejection of a non-governor account trying to
  schedule directly on the timelock, confirmation that the deployer's
  admin role was actually renounced, and that votes are weighted by
  power rather than by voter count.

## Deployment (Sepolia)

```bash
npm run deploy:dao:sepolia   # writes deployments/sepolia.json (dao namespace)
npm run verify:dao:sepolia   # submits source to Etherscan
```

**Not run yet**, same reason as the other two projects — no funded
deployer key or RPC URL in this environment. The deploy script performs
the full role-wiring + admin-renouncement sequence described above as
part of deployment, not as a separate manual step.

## Security &amp; governance-risk considerations

- **Flash-loan voting** — mitigated structurally: `ERC20Votes` checkpoints
  balances, and voting power for a proposal is read at that proposal's
  *snapshot block* (`votingDelay` after creation), not the current block.
  Tokens borrowed and repaid within a single transaction never had
  voting power at a past snapshot block to begin with.
- **Quorum** — 4% of total supply (`GovernorVotesQuorumFraction(4)`).
  Because the token has an open faucet, total supply — and so the quorum
  target — grows as people claim from it. Documented as a demo-specific
  dynamic; production governance tokens typically have fixed or
  separately-governed supply.
- **Privileged roles** — none survive deployment. The deployer holds the
  timelock's `DEFAULT_ADMIN_ROLE` only transiently, during role setup,
  then renounces it (`scripts/deploy-dao.ts`, confirmed by a dedicated
  test). From that point, only a passed governance vote can queue a
  treasury action.
- **Timelock** — every passed proposal must sit for `MIN_TIMELOCK_DELAY`
  before it can execute. Set to 60 seconds here for demo interactivity —
  a real DAO holding real value should use multi-day delays so token
  holders have a genuine window to notice and react to a bad proposal.
- **Proposal execution risk** — the frontend only ever constructs a plain
  ETH-transfer proposal (see `useCreateTreasuryProposal`), never
  free-form calldata from a form field. The Governor contract itself
  supports arbitrary calldata (that's what `Governor.propose` takes);
  restricting what the *UI* will construct removes an entire class of
  "the proposal didn't do what its description said" risk.
- **Multisig** — not used. The timelock's proposer/canceller roles are
  held solely by the Governor. A production deployment might add a
  multisig-held canceller role as an emergency circuit breaker —
  documented here as a limitation, not implemented.

## Known limitations

- **Not audited** (the composition and deployment sequence, that is —
  the underlying OpenZeppelin modules are themselves audited as part of
  that library, which is the whole point of using them).
- **Demo-scaled parameters throughout** — 1-block voting delay, ~1-hour
  voting period, 0 proposal threshold, 60-second timelock delay. Every
  one of these would be set far more conservatively (multi-day periods,
  a real proposal threshold to deter spam) for a DAO governing anything
  of actual value; the tradeoff here is favoring a demo a portfolio
  visitor can actually complete in one sitting.
- **No canceller multisig / emergency pause** beyond the Governor's own
  proposal-cancellation path.
- **UI only proposes ETH transfers** — a deliberate scope limit on the
  frontend, not the Governor contract itself.
