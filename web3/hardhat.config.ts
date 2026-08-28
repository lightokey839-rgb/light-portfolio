import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

// Deployment / verification credentials are read from environment
// variables only — never hardcoded, never committed. See .env.example
// for the full list. All three are optional for `hardhat compile` /
// `hardhat test`, which only need a local in-memory chain.
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Prevents accidental use of a stack-too-deep workaround that changes
      // codegen in ways that are harder to reason about for a small,
      // security-focused contract set like this one.
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      // Default in-memory network used by `hardhat test` — no RPC, no
      // real funds, resets every run.
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://sepolia.rpc.example",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
