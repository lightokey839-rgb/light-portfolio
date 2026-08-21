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
}[] = [
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
