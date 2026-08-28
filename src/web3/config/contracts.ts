import sepoliaDeployments from "../deployments/sepolia.json";
import { lightSwapFactoryAbi } from "../abi/LightSwapFactory";
import { lightSwapRouterAbi } from "../abi/LightSwapRouter";
import { lightSwapPairAbi } from "../abi/LightSwapPair";
import { lightTestTokenAbi } from "../abi/LightTestToken";
import { lightNftAbi } from "../abi/LightNFT";
import { lightNftMarketplaceAbi } from "../abi/LightNFTMarketplace";
import { lightGovernanceTokenAbi } from "../abi/LightGovernanceToken";
import { lightGovernorAbi } from "../abi/LightGovernor";
import { lightPriceConsumerAbi } from "../abi/LightPriceConsumer";
import { lightPriceSnapshotterAbi } from "../abi/LightPriceSnapshotter";
import { chainMeta, explorerAddressUrl } from "./chains";

export type DeploymentRecord = {
  address: `0x${string}` | null;
  txHash: string | null;
  verified: boolean;
  explorerUrl: string | null;
};

export type NftDeploymentRecord = DeploymentRecord & { deployedAtBlock: number | null };

type DeploymentsFile = {
  network: string;
  chainId: number;
  updatedAt: string | null;
  dex: Record<string, DeploymentRecord>;
  nft: Record<string, NftDeploymentRecord>;
  dao: Record<string, NftDeploymentRecord>;
  oracle: {
    chainlinkFeed: { address: `0x${string}`; note: string; explorerUrl: string | null };
    LightPriceConsumer: NftDeploymentRecord;
    LightPriceSnapshotter: NftDeploymentRecord;
  };
};

const deployments = sepoliaDeployments as DeploymentsFile;

/**
 * Every contract address, ABI, and deployment status the frontend needs,
 * in one place, namespaced per project. Nothing in src/web3 or src/pages
 * should import an address or an ABI from anywhere else — this is what
 * "don't duplicate contract addresses throughout the frontend" (portfolio
 * requirement) means in practice.
 *
 * `deployments/sepolia.json` currently has every address set to `null`
 * because nothing has been deployed yet — see web3/README.md for the
 * exact remaining step per project. Every consumer of this registry is
 * expected to check `.address` for null and render a "Deployment pending"
 * state rather than assume a contract exists.
 */
export const dexContracts = {
  factory: { abi: lightSwapFactoryAbi, ...deployments.dex.LightSwapFactory },
  router: { abi: lightSwapRouterAbi, ...deployments.dex.LightSwapRouter },
  lightUSD: { abi: lightTestTokenAbi, symbol: "LUSD", name: "Light USD", ...deployments.dex.LightUSD },
  lightDAI: { abi: lightTestTokenAbi, symbol: "LDAI", name: "Light DAI", ...deployments.dex.LightDAI },
  pair: { abi: lightSwapPairAbi, ...deployments.dex.LightUSD_LightDAI_Pair },
} as const;

export const nftContracts = {
  collection: { abi: lightNftAbi, name: "Light Demo Collection", symbol: "LIGHTNFT", ...deployments.nft.LightNFT },
  marketplace: { abi: lightNftMarketplaceAbi, ...deployments.nft.LightNFTMarketplace },
} as const;

export const daoContracts = {
  token: { abi: lightGovernanceTokenAbi, symbol: "LGOV", name: "Light Governance", ...deployments.dao.LightGovernanceToken },
  timelock: { ...deployments.dao.TimelockController },
  governor: { abi: lightGovernorAbi, ...deployments.dao.LightGovernor },
} as const;

export const oracleContracts = {
  chainlinkFeed: deployments.oracle.chainlinkFeed,
  consumer: { abi: lightPriceConsumerAbi, ...deployments.oracle.LightPriceConsumer },
  snapshotter: { abi: lightPriceSnapshotterAbi, ...deployments.oracle.LightPriceSnapshotter },
} as const;

export function isDexDeployed(): boolean {
  return Object.values(dexContracts).every((c) => c.address !== null);
}

export function isNftDeployed(): boolean {
  return Object.values(nftContracts).every((c) => c.address !== null);
}

export function isDaoDeployed(): boolean {
  return Object.values(daoContracts).every((c) => c.address !== null);
}

export function isOracleDeployed(): boolean {
  return oracleContracts.consumer.address !== null && oracleContracts.snapshotter.address !== null;
}

export function deploymentStatusLabel(record: { address: string | null; verified: boolean }): string {
  if (!record.address) return "Deployment pending";
  return record.verified ? "Verified" : "Deployed (verification pending)";
}

export { chainMeta, explorerAddressUrl };
