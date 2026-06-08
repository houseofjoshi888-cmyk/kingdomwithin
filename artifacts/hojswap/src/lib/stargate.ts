import { padHex } from "viem";
import { base, mainnet } from "wagmi/chains";

export const STARGATE_EID: Record<number, number> = {
  [mainnet.id]: 30101,
  [base.id]: 30184,
};

export const STARGATE_POOLS: Record<string, Partial<Record<number, `0x${string}`>>> = {
  USDC: {
    [mainnet.id]: "0xc026395860Db2d07ee33e05fE50ed7bD583189C7",
    [base.id]: "0x27a16dc786820B16E5c9028b75B99F6f604b5d26",
  },
  USDT: {
    [mainnet.id]: "0x933597a323Eb81cAe705C5bC29985172fd5A3973",
  },
  ETH: {
    [mainnet.id]: "0x77b2043768d28E9C9aB44E1aBfC95944bcE57931",
    [base.id]: "0xdc181Bd607440bE6895cc657F9f8C0BB7cde8aCC",
  },
};

export const STARGATE_SUPPORTED_ROUTES: Array<{
  fromChainId: number;
  toChainId: number;
  tokens: string[];
}> = [
  { fromChainId: mainnet.id, toChainId: base.id, tokens: ["USDC", "ETH"] },
  { fromChainId: base.id, toChainId: mainnet.id, tokens: ["USDC", "ETH"] },
];

export function getStargatePool(token: string, chainId: number): `0x${string}` | null {
  return STARGATE_POOLS[token]?.[chainId] ?? null;
}

export function getStargateRouteTokens(fromChainId: number, toChainId: number): string[] {
  const route = STARGATE_SUPPORTED_ROUTES.find(
    (r) => r.fromChainId === fromChainId && r.toChainId === toChainId,
  );
  return route?.tokens ?? [];
}

export function addressToBytes32(address: `0x${string}`): `0x${string}` {
  return padHex(address, { size: 32 }) as `0x${string}`;
}

export const STARGATE_V2_ABI = [
  {
    name: "quoteSend",
    type: "function",
    stateMutability: "view",
    inputs: [
      {
        name: "_sendParam",
        type: "tuple",
        components: [
          { name: "dstEid", type: "uint32" },
          { name: "to", type: "bytes32" },
          { name: "amountLD", type: "uint256" },
          { name: "minAmountLD", type: "uint256" },
          { name: "extraOptions", type: "bytes" },
          { name: "composeMsg", type: "bytes" },
          { name: "oftCmd", type: "bytes" },
        ],
      },
      { name: "_payInLzToken", type: "bool" },
    ],
    outputs: [
      {
        name: "msgFee",
        type: "tuple",
        components: [
          { name: "nativeFee", type: "uint256" },
          { name: "lzTokenFee", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "send",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "_sendParam",
        type: "tuple",
        components: [
          { name: "dstEid", type: "uint32" },
          { name: "to", type: "bytes32" },
          { name: "amountLD", type: "uint256" },
          { name: "minAmountLD", type: "uint256" },
          { name: "extraOptions", type: "bytes" },
          { name: "composeMsg", type: "bytes" },
          { name: "oftCmd", type: "bytes" },
        ],
      },
      {
        name: "_fee",
        type: "tuple",
        components: [
          { name: "nativeFee", type: "uint256" },
          { name: "lzTokenFee", type: "uint256" },
        ],
      },
      { name: "_refundAddress", type: "address" },
    ],
    outputs: [],
  },
] as const;

export const SIMPLE_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
