import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

// Seed data for a fresh install — the frontend fetches technologies from
// the API, so this is the only place these need to be defined.
const TECHNOLOGIES: { name: string; category: string }[] = [
  { name: "HTML", category: "Frontend" },
  { name: "CSS", category: "Frontend" },
  { name: "JavaScript", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "React", category: "Frontend" },
  { name: "Vite", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Python", category: "Backend" },
  { name: "Fastify", category: "Backend" },
  { name: "REST APIs", category: "Backend" },
  { name: "PostgreSQL", category: "Databases & Infrastructure" },
  { name: "Prisma", category: "Databases & Infrastructure" },
  { name: "Redis", category: "Databases & Infrastructure" },
  { name: "Telegram Bot API", category: "Web3 & Integrations" },
  { name: "Telegram Mini Apps", category: "Web3 & Integrations" },
  { name: "Wallet Integrations", category: "Web3 & Integrations" },
  { name: "Web3 APIs", category: "Web3 & Integrations" },
  { name: "Blockchain Integrations", category: "Web3 & Integrations" },
  { name: "Solidity", category: "Web3 & Integrations" },
  { name: "Hardhat", category: "Web3 & Integrations" },
  { name: "OpenZeppelin", category: "Web3 & Integrations" },
  { name: "wagmi", category: "Web3 & Integrations" },
  { name: "viem", category: "Web3 & Integrations" },
  { name: "Chainlink", category: "Web3 & Integrations" },
  { name: "Git", category: "Tools" },
  { name: "GitHub", category: "Tools" },
  { name: "VS Code", category: "Tools" },
];

// Seed data for a fresh install — the frontend fetches services from the
// API, so this is the only place these need to be defined.
const SERVICES: { title: string; description: string; icon: string; sortOrder: number }[] = [
  {
    title: "Web3 Websites",
    description:
      "High-converting websites and landing pages that build trust fast for token projects, startups, and communities.",
    icon: "🌐",
    sortOrder: 0,
  },
  {
    title: "Telegram Bots",
    description:
      "Community automation, task/quest systems, and rewards — built to run themselves day to day.",
    icon: "🤖",
    sortOrder: 1,
  },
  {
    title: "Telegram Mini Apps",
    description:
      "Interactive apps for tasks, rewards, and daily engagement — built directly inside Telegram.",
    icon: "📱",
    sortOrder: 2,
  },
  {
    title: "Web3 Tools & Community Systems",
    description:
      "Dashboards, task systems, and custom infrastructure that keep a growing community organized.",
    icon: "⚡",
    sortOrder: 3,
  },
];

// Seed data for a fresh install — the frontend fetches projects from the
// API, so this is the only place these need to be defined.
const PROJECTS: {
  title: string;
  slug: string;
  category: string;
  description: string;
  sortOrder: number;
  technologies: string[];
  featured?: boolean;
  challenge?: string;
  solution?: string;
  keyFeatures?: string[];
  liveUrl?: string;
  githubUrl?: string;
  results?: string;
}[] = [
  {
    title: "LightSwap — DeFi / DEX",
    slug: "lightswap-defi-dex",
    category: "DeFi",
    description:
      "A constant-product AMM (Uniswap V2 architecture, independently implemented) with real token swaps, liquidity pools, and LP accounting — Solidity contracts, Hardhat test suite, and a wallet-connected frontend, deployed to Sepolia testnet.",
    sortOrder: -1,
    technologies: ["Solidity", "Hardhat", "OpenZeppelin", "wagmi", "viem", "React", "TypeScript"],
    featured: true,
    challenge:
      "Demonstrate real DeFi engineering — not a mockup — covering AMM math, LP accounting, slippage protection, and the full wallet-to-contract transaction lifecycle, verifiably rather than as static screenshots.",
    solution:
      "A from-scratch constant-product AMM: LightSwapFactory, LightSwapPair (itself the LP token), and LightSwapRouter, with a Hardhat test suite covering happy paths, invariant violations, and access control, plus a React frontend using wagmi/viem for wallet connection, live quotes, and price-impact display.",
    keyFeatures: [
      "Token swaps with live price-impact and slippage-tolerance controls",
      "Add/remove liquidity with proportional LP-share accounting",
      "Full transaction state machine: connect, approve, sign, pending, confirmed, failed, rejected",
      "Centralized contract registry with an honest 'deployment pending' state — no fabricated addresses",
    ],
    liveUrl: "/lab/dex",
  },
  {
    title: "LightNFT Marketplace — NFT",
    slug: "lightnft-marketplace",
    category: "NFT",
    description:
      "An ERC-721 collection with fully on-chain generative metadata (no IPFS dependency), plus a pull-payment NFT marketplace: mint, list, buy, and cancel — wired to real Solidity contracts on Sepolia testnet.",
    sortOrder: -1,
    technologies: ["Solidity", "Hardhat", "OpenZeppelin", "wagmi", "viem", "React", "TypeScript"],
    featured: true,
    challenge:
      "Demonstrate NFT marketplace engineering — ownership checks, listing authorization, and payment handling — without depending on an IPFS pinning service this environment has no way to set up or keep available.",
    solution:
      "An ERC-721 collection whose tokenURI generates its JSON metadata and SVG image fully on-chain and base64-encoded, paired with a marketplace contract using the pull-payment pattern (proceeds are credited, then withdrawn separately) so a broken or malicious seller contract can never block a sale.",
    keyFeatures: [
      "Free public mint (capped 5/wallet, 500 total) with fully on-chain generative art",
      "List, cancel, and buy flows with ownership + approval checks before a listing is accepted",
      "Stale-listing detection — a token transferred outside the marketplace fails the purchase cleanly",
      "Pull-payment proceeds withdrawal, isolated from the buy transaction",
    ],
    liveUrl: "/lab/nft",
  },
  {
    title: "LightDAO — Governance",
    slug: "lightdao-governance",
    category: "DAO",
    description:
      "Token-weighted DAO governance built on OpenZeppelin's audited Governor + TimelockController modules: proposal creation, delegated voting, quorum, and timelock-gated treasury execution — wired to real Solidity contracts on Sepolia testnet.",
    sortOrder: -1,
    technologies: ["Solidity", "Hardhat", "OpenZeppelin", "wagmi", "viem", "React", "TypeScript"],
    featured: true,
    challenge:
      "Demonstrate DAO engineering with genuine governance guarantees — flash-loan-resistant voting power, a timelock between a passed vote and fund movement, no privileged admin left standing — using established primitives rather than a bespoke voting contract.",
    solution:
      "An OpenZeppelin Governor composed with checkpointed ERC20Votes voting power, percentage-of-supply quorum, and GovernorTimelockControl. The TimelockController itself is the treasury; its proposer role is granted solely to the Governor and the deployer's admin role is renounced right after setup, so no address ever retains unilateral control.",
    keyFeatures: [
      "Delegate-then-vote flow matching real DAO UX (Compound/Uniswap-style ERC20Votes)",
      "Live proposal dashboard: state, for/against/abstain tally, quorum progress, voting deadline",
      "Constrained treasury-transfer proposal template rather than free-form calldata input",
      "Full lifecycle wired end-to-end: propose → vote → queue → timelock delay → execute",
    ],
    liveUrl: "/lab/dao",
  },
  {
    title: "LightOracle — Chainlink Integration",
    slug: "lightoracle-chainlink",
    category: "Infrastructure",
    description:
      "Secure external data consumption using Chainlink: a Data Feed consumer with staleness and validity checks, plus a Chainlink Automation-compatible contract that records price snapshots on a schedule — reading Chainlink's real live Sepolia ETH/USD feed, never mocked data.",
    sortOrder: -1,
    technologies: ["Solidity", "Hardhat", "Chainlink", "wagmi", "viem", "React", "TypeScript"],
    featured: true,
    challenge:
      "Demonstrate safe on-chain consumption of external data — the exact place naive integrations get exploited via stale or manipulated prices — using Chainlink's real, already-deployed infrastructure rather than a convenient mock presented as live data.",
    solution:
      "A consumer contract that validates every value Chainlink's Sepolia ETH/USD feed returns (positive price, complete round, not stale) before trusting it, paired with an Automation-compatible contract (checkUpkeep/performUpkeep) that records validated snapshots on a schedule — demonstrating two separate Chainlink products, Data Feeds and Automation, working together.",
    keyFeatures: [
      "Reads Chainlink's real, verified Sepolia ETH/USD feed — address confirmed against Chainlink's own documentation",
      "Reverts on stale, invalid, or incomplete-round data rather than silently returning it",
      "Chainlink Automation-compatible snapshotting, triggerable manually in this demo pending real Automation registration",
      "Bounded on-chain history (oldest snapshot evicted) rather than unbounded storage growth",
    ],
    liveUrl: "/lab/oracle",
  },
  {
    title: "Web3 / Memecoin Website",
    slug: "web3-memecoin-website",
    category: "Web3 Website",
    description:
      "A launch-ready website for a token project — built to establish trust, explain the concept clearly, and give the community a home before and after launch.",
    sortOrder: 0,
    technologies: ["React", "TypeScript", "Vite"],
    featured: true,
    challenge:
      "The project needed a home before launch that could explain the token, build trust with a skeptical audience, and give the community somewhere to land — all on a tight timeline.",
    solution:
      "A fast, single-page site covering the concept, tokenomics, and roadmap, with a clear path into the project's Telegram and socials rather than a wall of unexplained jargon.",
    keyFeatures: [
      "Tokenomics and roadmap laid out clearly for a non-technical audience",
      "Fast load times on a lightweight React + Vite build",
      "Direct links into the community's Telegram and socials",
    ],
  },
  {
    title: "Telegram Task & Quest System",
    slug: "telegram-task-quest-system",
    category: "Telegram Bot / Web3",
    description:
      "A Telegram bot that runs task and quest campaigns for a Web3 community — handling verification, points, and day-to-day engagement automatically.",
    sortOrder: 1,
    technologies: ["Node.js", "Telegram Bot API", "PostgreSQL"],
    featured: true,
    challenge:
      "Running community quest campaigns by hand doesn't scale — verifying task completion and tracking points manually eats time the community team doesn't have.",
    solution:
      "A Telegram bot that defines tasks, verifies completion automatically where possible, and tracks points per member in Postgres, so campaigns run themselves day to day.",
    keyFeatures: [
      "Automated task verification",
      "Persistent per-member points tracking",
      "Admin commands to launch and adjust campaigns without redeploying",
    ],
  },
  {
    title: "Telegram Web3 Mini App",
    slug: "telegram-web3-mini-app",
    category: "Telegram Mini App",
    description:
      "A Telegram Mini App built around tasks, rewards, and daily engagement — designed to keep a Web3 community active inside Telegram itself.",
    sortOrder: 2,
    technologies: ["React", "TypeScript", "Telegram Mini Apps"],
  },
  {
    title: "Business / Product Website",
    slug: "business-product-website",
    category: "Web Development",
    description:
      "A modern website for a product or business outside Web3 — clean interface, fast load times, and a clear path for visitors to get in touch.",
    sortOrder: 3,
    technologies: ["React", "TypeScript", "REST APIs"],
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env before seeding."
    );
  }

  const passwordHash = await argon2.hash(password);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {}, // never overwrite an existing admin's password on re-seed
    create: {
      email,
      passwordHash,
      name: "Light",
    },
  });

  console.log(`✓ Admin ready: ${admin.email}`);
}

async function seedTechnologies() {
  for (const tech of TECHNOLOGIES) {
    await prisma.technology.upsert({
      where: { name: tech.name },
      update: { category: tech.category },
      create: tech,
    });
  }
  console.log(`✓ ${TECHNOLOGIES.length} technologies seeded`);
}

async function seedServices() {
  for (const service of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { title: service.title } });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service });
    } else {
      await prisma.service.create({ data: service });
    }
  }
  console.log(`✓ ${SERVICES.length} services seeded`);
}

async function seedProjects() {
  for (const project of PROJECTS) {
    const { technologies, featured, challenge, solution, keyFeatures, ...projectData } = project;
    const caseStudyData = {
      featured: featured ?? false,
      challenge: challenge ?? null,
      solution: solution ?? null,
      keyFeatures: keyFeatures ?? [],
    };

    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        ...projectData,
        ...caseStudyData,
        technologies: { set: [], connect: technologies.map((name) => ({ name })) },
      },
      create: {
        ...projectData,
        ...caseStudyData,
        published: true,
        technologies: { connect: technologies.map((name) => ({ name })) },
      },
    });
  }
  console.log(`✓ ${PROJECTS.length} projects seeded`);
}

async function seedSiteSettings() {
  const existing = await prisma.siteSettings.findFirst();

  const data = {
    name: "Light",
    title: "Web3 Developer & Builder",
    bio: "Web3 Developer & Builder focused on creating practical digital products for Web3 projects, communities, and startups — modern websites, Telegram bots, Telegram Mini Apps, and custom Web3 tools.",
    telegram: "https://t.me/web3light07",
    twitter: "https://x.com/LIGHTDESIGN2022",
  };

  if (existing) {
    await prisma.siteSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.siteSettings.create({ data });
  }
  console.log("✓ Site settings seeded");
}

async function main() {
  console.log("Seeding database...\n");
  await seedAdmin();
  await seedTechnologies();
  await seedServices();
  await seedProjects();
  await seedSiteSettings();
  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
