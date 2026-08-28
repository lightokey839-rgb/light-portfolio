import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const MIN_TIMELOCK_DELAY = 60;

/**
 * Submits token, timelock, and governor source to Etherscan for
 * verification. Constructor args must match deploy-dao.ts exactly —
 * update DEPLOYER_ADDRESS below if your deployer differs (Etherscan
 * verification recomputes the constructor-encoded bytecode itself, so
 * any mismatch fails verification even though the contract works fine).
 */
async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const { dao: contracts } = deployments;

  if (!contracts?.LightGovernanceToken?.address) {
    throw new Error(`No DAO deployment found for ${network.name}. Run "npm run deploy:dao:${network.name}" first.`);
  }

  const DEPLOYER_ADDRESS = "0x0000000000000000000000000000000000dEaD"; // replace with the real deployer address used

  const verifications = [
    { name: "LightGovernanceToken", address: contracts.LightGovernanceToken.address, args: [] as unknown[] },
    {
      name: "TimelockController",
      address: contracts.TimelockController.address,
      args: [MIN_TIMELOCK_DELAY, [], [], DEPLOYER_ADDRESS],
    },
    {
      name: "LightGovernor",
      address: contracts.LightGovernor.address,
      args: [contracts.LightGovernanceToken.address, contracts.TimelockController.address],
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
