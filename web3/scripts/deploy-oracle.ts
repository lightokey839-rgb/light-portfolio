import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Chainlink's own ETH/USD price feed on Sepolia — not deployed by this
 * project, just consumed. Verified against Chainlink's official docs
 * (https://docs.chain.link/data-feeds/price-feeds/addresses#Sepolia-Testnet
 * and https://docs.chain.link/data-feeds/api-reference) at the time this
 * was written. If Chainlink ever migrates this feed to a new address,
 * update it here and re-verify against the docs page — never guess.
 */
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const SNAPSHOT_INTERVAL_SECONDS = 3600; // 1 hour

/**
 * Deploys LightPriceConsumer + LightPriceSnapshotter against Chainlink's
 * real Sepolia ETH/USD feed. Unlike the other three projects' deploy
 * scripts, this one deploys NOTHING that acts as an oracle itself — both
 * contracts are pure consumers of infrastructure Chainlink already runs.
 *
 * Not executed against Sepolia as part of this change — no funded
 * deployer key or RPC URL exists in this environment. Running it for
 * real:
 *
 *   cd web3
 *   npm install
 *   cp .env.example .env   # fill in SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY
 *   npm run deploy:oracle:sepolia
 *   npm run verify:oracle:sepolia
 *
 * Registering LightPriceSnapshotter with Chainlink Automation (so it's
 * actually called on a schedule rather than only callable manually) is a
 * separate, further external step at https://automation.chain.link,
 * funded with Sepolia LINK — documented in web3/README.md, not performed
 * by this script.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to ${network.name} as ${deployer.address}`);
  console.log(`Consuming Chainlink feed at ${SEPOLIA_ETH_USD_FEED} (ETH/USD, Sepolia)`);

  const Consumer = await ethers.getContractFactory("LightPriceConsumer");
  const consumer = await Consumer.deploy(SEPOLIA_ETH_USD_FEED);
  await consumer.waitForDeployment();
  console.log(`LightPriceConsumer: ${await consumer.getAddress()}`);

  const Snapshotter = await ethers.getContractFactory("LightPriceSnapshotter");
  const snapshotter = await Snapshotter.deploy(SEPOLIA_ETH_USD_FEED, SNAPSHOT_INTERVAL_SECONDS);
  await snapshotter.waitForDeployment();
  console.log(`LightPriceSnapshotter: ${await snapshotter.getAddress()}`);

  const explorerBase = network.name === "sepolia" ? "https://sepolia.etherscan.io/address/" : null;
  const record = async (address: string, deploymentTx: ReturnType<typeof consumer.deploymentTransaction>) => {
    const receipt = deploymentTx ? await deploymentTx.wait() : null;
    return {
      address,
      txHash: deploymentTx?.hash ?? null,
      verified: false,
      deployedAtBlock: receipt?.blockNumber ?? null,
      ...(explorerBase ? { explorerUrl: `${explorerBase}${address}` } : {}),
    };
  };

  const outPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf-8")) : {};

  const out = {
    ...existing,
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    updatedAt: new Date().toISOString(),
    oracle: {
      chainlinkFeed: {
        address: SEPOLIA_ETH_USD_FEED,
        note: "Chainlink's own live feed — not deployed by this project.",
        explorerUrl: explorerBase ? `${explorerBase}${SEPOLIA_ETH_USD_FEED}` : null,
      },
      LightPriceConsumer: await record(await consumer.getAddress(), consumer.deploymentTransaction()),
      LightPriceSnapshotter: await record(await snapshotter.getAddress(), snapshotter.deploymentTransaction()),
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${outPath} (oracle namespace)`);
  console.log("Next: npm run verify:oracle:sepolia, then copy this file's contents into");
  console.log("src/web3/deployments/ so the frontend registry picks up the real addresses.");
  console.log("Optional further step: register LightPriceSnapshotter at automation.chain.link");
  console.log("(funded with Sepolia LINK) for genuinely automatic, scheduled snapshots.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
