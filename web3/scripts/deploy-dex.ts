import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploys the full LightSwap DEX stack to whichever network Hardhat was
 * invoked with (`--network sepolia`, `--network localhost`, etc.) and
 * writes real addresses + tx hashes into web3/deployments/<network>.json.
 *
 * This script has NOT been executed against Sepolia as part of this
 * change — that requires a funded deployer private key and an RPC URL,
 * neither of which exist in this environment. Running it for real is:
 *
 *   cd web3
 *   npm install
 *   cp .env.example .env   # fill in SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY
 *   npm run deploy:dex:sepolia
 *   npm run verify:dex:sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to ${network.name} as ${deployer.address}`);

  const Factory = await ethers.getContractFactory("LightSwapFactory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  console.log(`LightSwapFactory: ${await factory.getAddress()}`);

  const Router = await ethers.getContractFactory("LightSwapRouter");
  const router = await Router.deploy(await factory.getAddress());
  await router.waitForDeployment();
  console.log(`LightSwapRouter: ${await router.getAddress()}`);

  const Token = await ethers.getContractFactory("LightTestToken");
  const lightUSD = await Token.deploy("Light USD", "LUSD", ethers.parseEther("1000"));
  await lightUSD.waitForDeployment();
  console.log(`LightUSD: ${await lightUSD.getAddress()}`);

  const lightDAI = await Token.deploy("Light DAI", "LDAI", ethers.parseEther("1000"));
  await lightDAI.waitForDeployment();
  console.log(`LightDAI: ${await lightDAI.getAddress()}`);

  const createPairTx = await factory.createPair(await lightUSD.getAddress(), await lightDAI.getAddress());
  const createPairReceipt = await createPairTx.wait();
  const pairAddress = await factory.getPair(await lightUSD.getAddress(), await lightDAI.getAddress());
  console.log(`LightUSD/LightDAI pair: ${pairAddress}`);

  const record = (contract: { address: string; hash: string | null }) => ({
    address: contract.address,
    txHash: contract.hash,
    verified: false,
    ...(explorerBase ? { explorerUrl: `${explorerBase}${contract.address}` } : {}),
  });

  const outPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf-8")) : {};

  const out = {
    ...existing,
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    updatedAt: new Date().toISOString(),
    dex: {
      LightSwapFactory: record({
        address: await factory.getAddress(),
        hash: factory.deploymentTransaction()?.hash ?? null,
      }),
      LightSwapRouter: record({
        address: await router.getAddress(),
        hash: router.deploymentTransaction()?.hash ?? null,
      }),
      LightUSD: record({
        address: await lightUSD.getAddress(),
        hash: lightUSD.deploymentTransaction()?.hash ?? null,
      }),
      LightDAI: record({
        address: await lightDAI.getAddress(),
        hash: lightDAI.deploymentTransaction()?.hash ?? null,
      }),
      LightUSD_LightDAI_Pair: record({
        address: pairAddress,
        hash: createPairReceipt?.hash ?? null,
      }),
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${outPath} (dex namespace)`);
  console.log("Next: npm run verify:dex:sepolia, then copy this file's contents into");
  console.log("src/web3/deployments/ so the frontend registry picks up the real addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
