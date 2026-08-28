/**
 * ABI for LightPriceConsumer — see the note in
 * src/web3/abi/LightSwapRouter.ts about how these ABIs were produced
 * (no Solidity compiler in this environment) and what should replace
 * this after `npm run compile`.
 */
export const lightPriceConsumerAbi = [
  {
    type: "function",
    name: "getValidatedPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "price", type: "int256" },
          { name: "decimals", type: "uint8" },
          { name: "updatedAt", type: "uint256" },
          { name: "roundId", type: "uint80" },
        ],
      },
    ],
  },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { type: "function", name: "description", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "MAX_STALENESS", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "priceFeed", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
] as const;
