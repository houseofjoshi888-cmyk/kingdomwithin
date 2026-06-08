import { base, mainnet } from "wagmi/chains";
import { cronos } from "@/lib/chains";

export type LiFiFeeCost = {
  name: string;
  amount: string;
  token: { symbol: string; decimals: number };
};

export type LiFiQuote = {
  estimate: {
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    feeCosts?: LiFiFeeCost[];
    gasCosts?: Array<{ amount: string; token: { symbol: string; decimals: number } }>;
    executionDuration: number;
  };
  transactionRequest: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: string;
    gasLimit?: string;
    from: `0x${string}`;
    chainId: number;
  };
  approvalAddress?: `0x${string}`;
  action: {
    fromToken: { address: string; symbol: string; decimals: number };
    toToken: { address: string; symbol: string; decimals: number };
    fromAmount: string;
  };
};

export const LIFI_SUPPORTED_ROUTES: Array<{
  fromChainId: number;
  toChainId: number;
  tokens: string[];
}> = [
  { fromChainId: mainnet.id, toChainId: cronos.id, tokens: ["USDC", "USDT", "ETH"] },
  { fromChainId: cronos.id, toChainId: mainnet.id, tokens: ["USDC", "USDT", "ETH"] },
  { fromChainId: base.id, toChainId: cronos.id, tokens: ["USDC", "ETH"] },
  { fromChainId: cronos.id, toChainId: base.id, tokens: ["USDC", "ETH"] },
];

export const LIFI_TOKEN_ADDRESSES: Record<string, Partial<Record<number, string>>> = {
  USDC: {
    [mainnet.id]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    [cronos.id]: "0xc21223249CA28397B4B6541dfFaEEC539BfF0c59",
  },
  USDT: {
    [mainnet.id]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    [cronos.id]: "0x66e428c3f67a68767eb9ef128fda82a14f9061d3",
  },
  ETH: {
    [mainnet.id]: "0x0000000000000000000000000000000000000000",
    [base.id]: "0x0000000000000000000000000000000000000000",
    [cronos.id]: "0xe44Fd7fCb2b1581822D0c862B68222998a0c299a",
  },
};

export function getLiFiRouteTokens(fromChainId: number, toChainId: number): string[] {
  return (
    LIFI_SUPPORTED_ROUTES.find(
      (r) => r.fromChainId === fromChainId && r.toChainId === toChainId,
    )?.tokens ?? []
  );
}

export function getLiFiTokenAddress(token: string, chainId: number): string | null {
  return LIFI_TOKEN_ADDRESSES[token]?.[chainId] ?? null;
}

export function isLiFiNative(tokenAddress: string): boolean {
  return tokenAddress === "0x0000000000000000000000000000000000000000";
}
