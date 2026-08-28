import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Submits each deployed contract's source to Etherscan for verification,
 * reading addresses from the deployments registry that deploy-dex.ts wrote.
 * Requires ETHERSCAN_API_KEY in web3/.env and a completed deployment.
 */
async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const { dex: contracts } = deployments;

  if (!contracts.LightSwapFactory.address) {
    throw new Error(
      `No deployment found for ${network.name}. Run "npm run deploy:dex:${network.name}" first.`
    );
  }

  const verifications: Array<{ name: string; address: string; args: unknown[] }> = [
    { name: "LightSwapFactory", address: contracts.LightSwapFactory.address, args: [] }, // deployer arg — see note below
    { name: "LightSwapRouter", address: contracts.LightSwapRouter.address, args: [contracts.LightSwapFactory.address] },
    { name: "LightUSD (LightTestToken)", address: contracts.LightUSD.address, args: [] },
    { name: "LightDAI (LightTestToken)", address: contracts.LightDAI.address, args: [] },
  ];

  console.log(
    "NOTE: fill in the exact constructor args used at deploy time below " +
      "(deployer address for the factory, token name/symbol/faucetAmount for each " +
      "LightTestToken) before running this — they must match exactly for Etherscan " +
      "to verify successfully."
  );

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
