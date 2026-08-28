/**
 * ABI for LightPriceSnapshotter — see the note in LightPriceConsumer.ts
 * about how this was produced and what should replace it after
 * `npm run compile`.
 */
export const lightPriceSnapshotterAbi = [
  {
    type: "function",
    name: "checkUpkeep",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes" }],
    outputs: [
      { name: "upkeepNeeded", type: "bool" },
      { name: "performData", type: "bytes" },
    ],
  },
  {
    type: "function",
    name: "performUpkeep",
    stateMutability: "nonpayable",
    inputs: [{ name: "", type: "bytes" }],
    outputs: [],
  },
  { type: "function", name: "historyLength", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    type: "function",
    name: "snapshotAt",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "price", type: "int256" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "latestSnapshot",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "price", type: "int256" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  { type: "function", name: "lastSnapshotAt", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "interval", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  {
    type: "event",
    name: "SnapshotTaken",
    inputs: [
      { name: "price", type: "int256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
