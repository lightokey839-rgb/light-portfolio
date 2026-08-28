export interface LabExperiment {
  slug: "dex" | "nft" | "dao" | "oracle";
  name: string;
  shortName: string;
  description: string;
  status: "live" | "experimental" | "beta" | "soon";
  statusLabel: string;
  tech: string[];
  glyph: string;
}

/**
 * Single source of truth for the four experiments — used by both the
 * /lab landing page and the LabNavigation chrome shown on each
 * /lab/:slug page, so they can never drift out of sync.
 *
 * All four are real, wired Solidity contracts on Sepolia testnet (not
 * mocked UI) — "LIVE · TESTNET" reflects that honestly rather than
 * implying mainnet.
 */
export const labExperiments: LabExperiment[] = [
  {
    slug: "dex",
    name: "Decentralized Exchange",
    shortName: "DEX",
    description:
      "A constant-product AMM: token swaps, liquidity pools, and slippage-protected quotes, wired to real Solidity contracts.",
    status: "live",
    statusLabel: "Live · Testnet",
    tech: ["Solidity", "Wagmi", "Viem"],
    glyph: "⇄",
  },
  {
    slug: "nft",
    name: "NFT Marketplace",
    shortName: "NFT",
    description:
      "An ERC-721 collection with on-chain generative metadata, plus a pull-payment marketplace: mint, list, buy, cancel.",
    status: "live",
    statusLabel: "Live · Testnet",
    tech: ["ERC-721", "Solidity", "Wagmi"],
    glyph: "◈",
  },
  {
    slug: "dao",
    name: "DAO Governance",
    shortName: "DAO",
    description:
      "Token-weighted governance on OpenZeppelin's Governor + TimelockController — proposals, voting, quorum, timelocked execution.",
    status: "live",
    statusLabel: "Live · Testnet",
    tech: ["OpenZeppelin", "Governor", "Solidity"],
    glyph: "▤",
  },
  {
    slug: "oracle",
    name: "Price Oracle & Automation",
    shortName: "Oracle",
    description:
      "A Chainlink Data Feed consumer with staleness checks, plus an Automation-compatible contract recording scheduled price snapshots.",
    status: "live",
    statusLabel: "Live · Testnet",
    tech: ["Chainlink", "Automation", "Solidity"],
    glyph: "◎",
  },
];
