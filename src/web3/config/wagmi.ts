import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { supportedChain } from "./chains";

/**
 * Single wagmi config for every Web3 project (DEX, and NFT/DAO/oracle as
 * they're added). One config, one place to add a chain or connector.
 *
 * Connector: `injected()` covers MetaMask and any other EIP-1193 wallet
 * extension. WalletConnect (for mobile wallets) is a natural addition —
 * `import { walletConnect } from "wagmi/connectors"` and a project ID from
 * https://cloud.walletconnect.com — omitted here so this works with zero
 * external signup required to try the demo locally.
 *
 * transports: uses the chain's default public RPC. For production use,
 * point this at a dedicated RPC provider (the same SEPOLIA_RPC_URL used by
 * the contracts workspace) via `http(import.meta.env.VITE_SEPOLIA_RPC_URL)`
 * to avoid public-endpoint rate limits.
 */
export const wagmiConfig = createConfig({
  chains: [supportedChain],
  connectors: [injected()],
  transports: {
    [supportedChain.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
