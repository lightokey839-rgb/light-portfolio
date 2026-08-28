import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
const SNAPSHOT_INTERVAL_SECONDS = 3600;

async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const { oracle: contracts } = deployments;

  if (!contracts?.LightPriceConsumer?.address) {
    throw new Error(`No oracle deployment found for ${network.name}. Run "npm run deploy:oracle:${network.name}" first.`);
  }

  const verifications = [
    { name: "LightPriceConsumer", address: contracts.LightPriceConsumer.address, args: [SEPOLIA_ETH_USD_FEED] },
    {
      name: "LightPriceSnapshotter",
      address: contracts.LightPriceSnapshotter.address,
      args: [SEPOLIA_ETH_USD_FEED, SNAPSHOT_INTERVAL_SECONDS],
    },
  ];

  for (const v of verifications) {
    try {
      await run("verify:verify", { address: v.address, constructorArguments: v.args });
      console.log(`Verified ${v.name} at ${v.address}`);
    } catch (error) {
      console.error(`Failed to verify ${v.name}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
