import { getAddress, isAddress, zeroAddress, type Address } from "viem";

const deployedStakingAddress = "0x210ee4eeD13bAFfdA5B9bddCbAE1Cc7f6440c106";
const configuredStakingAddress =
  process.env.NEXT_PUBLIC_MALKUTA_STAKING_ADDRESS?.trim() || deployedStakingAddress;

export const MALKUTA_STAKING_CONFIGURED = Boolean(
  configuredStakingAddress && isAddress(configuredStakingAddress) && configuredStakingAddress !== zeroAddress,
);
export const MALKUTA_STAKING_ADDRESS: Address = MALKUTA_STAKING_CONFIGURED
  ? getAddress(configuredStakingAddress!)
  : zeroAddress;
export const KING_JOSHI_ADDRESS: Address = getAddress("0x8A668278adb0638Df48411dc9971e1ad29516483");
export const STAKING_OWNER_ADDRESS: Address = getAddress("0x69Bf308E5e30158072Cf9d2c6DE7b86F5Ae2f9B4");

export const MALKUTA_STAKING_ABI = [
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "rewardToken", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "rewardRatePerDay", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalStaked", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalUnpaidRewards", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "allowedCollections", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "unpaidRewards", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "vault",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "stakedAt", type: "uint64" },
      { name: "lastClaimAt", type: "uint64" },
      { name: "rewardRatePerDay", type: "uint256" },
      { name: "rewardsClaimed", type: "uint256" },
    ],
  },
  { type: "function", name: "calculateRewards", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getMultiplier", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "stake", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "claimRewards", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "unstake", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "claimUnpaidRewards", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "setCollectionAllowed", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "bool" }], outputs: [] },
  { type: "function", name: "setRewardRatePerDay", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { type: "function", name: "pauseNewStakes", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "resumeNewStakes", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "withdrawRewardSurplus", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
] as const;

export const ERC721_STAKING_ABI = [
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "getApproved", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
] as const;

export const ERC20_STAKING_ABI = [
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;
