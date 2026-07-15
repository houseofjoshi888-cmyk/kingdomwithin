export const MALKUTA_ENGINE_ABI = [
  { type: "function", name: "ADMIN_ROLE", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "hasRole", stateMutability: "view", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "currentEpochId", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "epochs", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "mintPrice", type: "uint256" }, { name: "isActive", type: "bool" }, { name: "name", type: "string" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  { type: "function", name: "tokenProvenance", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "contentHash", type: "bytes32" }, { name: "protocolVersion", type: "string" }, { name: "metadataURI", type: "string" }, { name: "epochId", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
  { type: "function", name: "mint", stateMutability: "payable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "contentHash", type: "bytes32" }, { name: "protocolVersion", type: "string" }, { name: "metadataURI", type: "string" }], outputs: [] },
  { type: "function", name: "airdrop", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "contentHash", type: "bytes32" }, { name: "protocolVersion", type: "string" }, { name: "metadataURI", type: "string" }], outputs: [] },
  { type: "function", name: "setEpoch", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }, { name: "price", type: "uint256" }, { name: "active", type: "bool" }, { name: "name", type: "string" }], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "event", name: "MandalaMinted", inputs: [{ name: "tokenId", type: "uint256", indexed: true }, { name: "epochId", type: "uint256", indexed: true }, { name: "recipient", type: "address", indexed: true }, { name: "operator", type: "address", indexed: false }, { name: "contentHash", type: "bytes32", indexed: false }, { name: "protocolVersion", type: "string", indexed: false }, { name: "metadataURI", type: "string", indexed: false }, { name: "price", type: "uint256", indexed: false }], anonymous: false },
] as const;
