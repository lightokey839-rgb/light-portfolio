Part of the [Light Web3 workspace](../../README.md) — shared setup,
testing, and environment-variable instructions live there; this file
covers only what's specific to this project.

# Project B — LightNFT Marketplace (NFT)

An ERC-721 demo collection plus a minimal, pull-payment marketplace:

| Contract | Role |
|---|---|
| `contracts/nft/LightNFT.sol` | ERC-721 collection. Public `mint()`, capped at 500 supply / 5 per wallet. Metadata (including the image) is generated **fully on-chain** as a base64 data URI — no IPFS/off-chain host dependency. |
| `contracts/nft/LightNFTMarketplace.sol` | List/cancel/buy for any standards-compliant ERC-721 (not just LightNFT). Pull-payment (`withdrawProceeds`) rather than pushing ETH to the seller inside `buyItem`. |

## Why on-chain metadata

Generating the NFT image and JSON metadata on-chain (see `LightNFT._generateSVG`
and `tokenURI`) was a deliberate choice, not a shortcut: a "real" NFT project
normally pins images/metadata to IPFS or Arweave, but that requires a pinning
service and network access this environment doesn't have. On-chain generative
metadata sidesteps that dependency entirely and is independently verifiable —
anyone can decode `tokenURI(id)` and get the exact same SVG back, forever,
with no pinning service to go down. The tradeoff is intentionally simple
art (a couple of deterministic circles) rather than a large offline-rendered
image.

## Architecture

```
User
 ↓
Wallet (MetaMask / injected provider)
 ↓
Frontend (React) — src/web3/*, src/pages/lab/NftLabPage.tsx
 ↓
viem / wagmi (Web3 client)
 ↓
LightNFTMarketplace  →  LightNFT (ERC-721: ownerOf / approve / safeTransferFrom)
 ↓
Sepolia testnet (Ethereum)
```

On-chain: `LightNFT`, `LightNFTMarketplace`. Off-chain / infrastructure: the
frontend reads listings via `getListing`/event logs and renders the decoded
`tokenURI` image directly — no backend/indexer is involved for this project.

## Testing

`npm test` also runs `test/nft/`:

- **`LightNFT.test.ts`** — sequential minting, `MAX_PER_WALLET` enforcement,
  per-wallet mint tracking, `tokenURI` decoding (valid base64 JSON + embedded
  SVG), that different token IDs produce different images, standard transfer.
- **`LightNFTMarketplace.test.ts`** — listing authorization (must own the
  token, must have approved the marketplace), duplicate-listing rejection,
  cancel-by-seller-only, purchase flow (NFT transfer + proceeds credited +
  listing cleared), underpayment rejection, **stale-listing detection**
  (seller transfers the NFT away without cancelling — buy must revert, not
  silently fail or lock funds), pull-payment withdrawal accounting.

## Deployment (Sepolia)

```bash
npm run deploy:nft:sepolia   # writes deployments/sepolia.json (nft namespace)
npm run verify:nft:sepolia   # submits source to Etherscan
```

**Not run yet**, same reason as the DEX project — no funded deployer key or
RPC URL in this environment. `deployments/sepolia.json`'s `nft` section
ships with every address `null`.

## Security considerations

- **Reentrancy** — `buyItem` and `withdrawProceeds` are `nonReentrant`
  (OpenZeppelin `ReentrancyGuard`).
- **Pull over push payments** — `buyItem` never sends ETH directly to the
  seller; it only credits an internal balance. This is the standard defense
  against a seller contract that reverts on receiving ETH (which would
  otherwise permanently block the sale) or attempts to reenter during the
  transfer.
- **Ownership / listing authorization** — `listItem` checks `ownerOf ==
  msg.sender` *and* that the marketplace has been approved
  (`getApproved`/`isApprovedForAll`) before storing a listing.
- **Stale listings** — a seller can transfer or burn a listed token outside
  the marketplace without cancelling. `buyItem` re-checks `ownerOf ==
  listing.seller` immediately before transferring and reverts with a clear
  `ListingStale` error rather than letting `safeTransferFrom` fail deep in
  the call or (worse) silently succeed against the wrong token state.
- **Safe transfers** — uses `safeTransferFrom`, which reverts if the
  recipient is a contract that doesn't implement `onERC721Received`,
  preventing NFTs from getting permanently stuck.
- **Checks-effects-interactions** — the listing is deleted and proceeds
  credited *before* the external `safeTransferFrom` call in `buyItem`.
- **No refund on overpayment** — `buyItem` requires `msg.value >= price` but
  doesn't refund the difference; the frontend is responsible for sending the
  exact price. Documented here rather than silently surprising a caller who
  overpays through a different client.

## Known limitations

- **Not audited** — same statement as the DEX project.
- **No royalties (EIP-2981).** Listing/sale price goes entirely to the
  seller; no creator-royalty mechanism is implemented.
- **No bidding/auction mechanism** — fixed-price listings only.
- **`LightNFT.mint()` is free and public** — appropriate for a demo
  collection meant to populate the marketplace, not a real drop mechanic
  (allowlist, price curve, etc.).
- **On-chain SVG art is intentionally simple** — a tradeoff for having zero
  off-chain hosting dependency, not a limitation of the approach itself.
