import { sepolia } from "viem/chains";
import type { Chain } from "viem";

/**
 * The single supported network for every Web3 project on this portfolio.
 * Every place in the app that needs a chain ID, explorer URL, or native
 * currency symbol imports from here — never hardcode `11155111` or an
 * Etherscan URL anywhere else.
 *
 * Sepolia (a public Ethereum testnet) was chosen because it has no real
 * economic value, has reliable public faucets, and is what the Etherscan
 * verification tooling and most RPC providers support out of the box.
 * Nothing in this codebase claims a mainnet deployment.
 */
export const supportedChain: Chain = sepolia;

export const chainMeta = {
  id: sepolia.id,
  name: sepolia.name,
  nativeCurrency: sepolia.nativeCurrency,
  explorerName: "Etherscan (Sepolia)",
  explorerUrl: "https://sepolia.etherscan.io",
  isTestnet: true,
} as const;

export function explorerAddressUrl(address: string): string {
  return `${chainMeta.explorerUrl}/address/${address}`;
}

export function explorerTxUrl(hash: string): string {
  return `${chainMeta.explorerUrl}/tx/${hash}`;
}
