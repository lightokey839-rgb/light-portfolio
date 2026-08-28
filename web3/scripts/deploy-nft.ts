import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploys LightNFT + LightNFTMarketplace and writes real addresses/tx
 * hashes into the "nft" namespace of web3/deployments/<network>.json,
 * preserving whatever else (e.g. "dex") is already in that file.
 *
 * Not executed against Sepolia as part of this change — same reason as
 * deploy-dex.ts: no funded deployer key or RPC URL exists in this
 * environment. Running it for real:
 *
 *   cd web3
 *   npm install
 *   cp .env.example .env   # fill in SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY
 *   npm run deploy:nft:sepolia
 *   npm run verify:nft:sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to ${network.name} as ${deployer.address}`);

  const LightNFT = await ethers.getContractFactory("LightNFT");
  const nft = await LightNFT.deploy();
  await nft.waitForDeployment();
  console.log(`LightNFT: ${await nft.getAddress()}`);

  const Marketplace = await ethers.getContractFactory("LightNFTMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  console.log(`LightNFTMarketplace: ${await marketplace.getAddress()}`);

  const explorerBase = network.name === "sepolia" ? "https://sepolia.etherscan.io/address/" : null;
  const record = async (contract: { address: string; deploymentTx: ReturnType<typeof nft.deploymentTransaction> }) => {
    const receipt = contract.deploymentTx ? await contract.deploymentTx.wait() : null;
    return {
      address: contract.address,
      txHash: contract.deploymentTx?.hash ?? null,
      verified: false,
      deployedAtBlock: receipt?.blockNumber ?? null,
      ...(explorerBase ? { explorerUrl: `${explorerBase}${contract.address}` } : {}),
    };
  };

  const outPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf-8")) : {};

  const out = {
    ...existing,
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    updatedAt: new Date().toISOString(),
    nft: {
      LightNFT: await record({ address: await nft.getAddress(), deploymentTx: nft.deploymentTransaction() }),
      LightNFTMarketplace: await record({
        address: await marketplace.getAddress(),
        deploymentTx: marketplace.deploymentTransaction(),
      }),
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${outPath} (nft namespace)`);
  console.log("Next: npm run verify:nft:sepolia, then copy this file's contents into");
  console.log("src/web3/deployments/ so the frontend registry picks up the real addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
