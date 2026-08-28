import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const MIN_TIMELOCK_DELAY = 60; // seconds — demo-scaled; see web3/README.md "Known limitations"
const TREASURY_SEED_ETH = "0.1"; // small amount so an executed proposal has something real to move

/**
 * Deploys the DAO stack in the standard, security-conscious order:
 *
 *   1. Governance token (ERC20Votes)
 *   2. TimelockController — deployed with the deployer as a *temporary*
 *      admin so roles can be wired up, no proposer/executor yet
 *   3. Governor — references the token + timelock
 *   4. Grant PROPOSER_ROLE + CANCELLER_ROLE on the timelock to the
 *      governor (only the governor can queue/cancel treasury actions)
 *   5. Grant EXECUTOR_ROLE to the zero address (anyone can execute a
 *      queued proposal once its timelock delay has passed — standard
 *      "permissionless execution" pattern, not a security hole: queuing
 *      already required the proposal to pass governance)
 *   6. Revoke the deployer's admin role — from this point on, nobody has
 *      unilateral control over the timelock; only governance does
 *   7. Seed the treasury (the timelock's own address) with a small amount
 *      of test ETH so an executed proposal has something real to move
 *
 * Not executed against Sepolia as part of this change — same reason as
 * the other deploy scripts: no funded deployer key or RPC URL exists in
 * this environment. Running it for real:
 *
 *   cd web3
 *   npm install
 *   cp .env.example .env   # fill in SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY
 *   npm run deploy:dao:sepolia
 *   npm run verify:dao:sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to ${network.name} as ${deployer.address}`);

  const Token = await ethers.getContractFactory("LightGovernanceToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  console.log(`LightGovernanceToken: ${await token.getAddress()}`);

  const Timelock = await ethers.getContractFactory("TimelockController");
  const timelock = await Timelock.deploy(MIN_TIMELOCK_DELAY, [], [], deployer.address);
  await timelock.waitForDeployment();
  console.log(`TimelockController (treasury): ${await timelock.getAddress()}`);

  const Governor = await ethers.getContractFactory("LightGovernor");
  const governor = await Governor.deploy(await token.getAddress(), await timelock.getAddress());
  await governor.waitForDeployment();
  console.log(`LightGovernor: ${await governor.getAddress()}`);

  console.log("\nWiring timelock roles...");
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
  const ADMIN_ROLE = await timelock.DEFAULT_ADMIN_ROLE();

  await (await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress())).wait();
  await (await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress())).wait();
  await (await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress)).wait();
  const revokeTx = await timelock.revokeRole(ADMIN_ROLE, deployer.address);
  await revokeTx.wait();
  console.log("Deployer admin role renounced — the timelock now answers only to governance.");

  const seedTx = await deployer.sendTransaction({
    to: await timelock.getAddress(),
    value: ethers.parseEther(TREASURY_SEED_ETH),
  });
  await seedTx.wait();
  console.log(`Seeded treasury with ${TREASURY_SEED_ETH} ETH.`);

  const explorerBase = network.name === "sepolia" ? "https://sepolia.etherscan.io/address/" : null;
  const record = async (address: string, deploymentTx: ReturnType<typeof token.deploymentTransaction>) => {
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
    dao: {
      LightGovernanceToken: await record(await token.getAddress(), token.deploymentTransaction()),
      TimelockController: await record(await timelock.getAddress(), timelock.deploymentTransaction()),
      LightGovernor: await record(await governor.getAddress(), governor.deploymentTransaction()),
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${outPath} (dao namespace)`);
  console.log("Next: npm run verify:dao:sepolia, then copy this file's contents into");
  console.log("src/web3/deployments/ so the frontend registry picks up the real addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
