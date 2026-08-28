import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/** Submits LightNFT + LightNFTMarketplace source to Etherscan for verification. */
async function main() {
  const deploymentsPath = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const { nft: contracts } = deployments;

  if (!contracts?.LightNFT?.address) {
    throw new Error(`No NFT deployment found for ${network.name}. Run "npm run deploy:nft:${network.name}" first.`);
  }

  const verifications = [
    { name: "LightNFT", address: contracts.LightNFT.address, args: [] as unknown[] },
    { name: "LightNFTMarketplace", address: contracts.LightNFTMarketplace.address, args: [] as unknown[] },
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
