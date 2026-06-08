import { getAddress } from "viem";
import { base, mainnet } from "wagmi/chains";
import { cronos, xrp } from "@/lib/chains";

export type Token = {
  symbol: string;
  name: string;
  address?: `0x${string}`;
  decimals?: number;
  chainId: number;
};

export const HOUSE_WALLET: `0x${string}` = getAddress(
  "0x6736d2eA9807297F0e56967361B9410854B86a5f",
);

export const USDC_BASE: `0x${string}` = getAddress(
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
);

export const USDC_ETHEREUM: `0x${string}` = getAddress(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
);

export const USDT_ETHEREUM: `0x${string}` = getAddress(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
);

export const SHIB_ETHEREUM: `0x${string}` = getAddress(
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
);

export const TOKENS: Token[] = [
  // ─── Base ────────────────────────────────────────────────
  {
    symbol: "ETH",
    name: "Ether",
    chainId: base.id,
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: USDC_BASE,
    chainId: base.id,
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: getAddress("0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"),
    chainId: base.id,
    decimals: 6,
  },
  {
    symbol: "QUEENJOSHI",
    name: "Queen Joshi",
    address: getAddress("0x1f2f727f043e5f92371f853084242a3584c70aa5"),
    chainId: base.id,
    decimals: 18,
  },
  {
    symbol: "KINGJOSHI",
    name: "King Joshi",
    address: getAddress("0x8a668278adb0638df48411dc9971e1ad29516483"),
    chainId: base.id,
    decimals: 18,
  },
  {
    symbol: "SHIB",
    name: "SchismaticShib",
    address: getAddress("0xFCa95aeb5bF44aE355806A5ad14659c940dC6BF7"),
    chainId: base.id,
    decimals: 9,
  },

  // ─── Ethereum mainnet ────────────────────────────────────
  {
    symbol: "ETH",
    name: "Ether",
    chainId: mainnet.id,
    decimals: 18,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: USDT_ETHEREUM,
    chainId: mainnet.id,
    decimals: 6,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: USDC_ETHEREUM,
    chainId: mainnet.id,
    decimals: 6,
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    address: SHIB_ETHEREUM,
    chainId: mainnet.id,
    decimals: 18,
  },
  {
    symbol: "BONE",
    name: "Bone",
    address: getAddress("0x9813037ee2218799597d83D4a5B6F3b6778218d9"),
    chainId: mainnet.id,
    decimals: 18,
  },
  {
    symbol: "TREAT",
    name: "Treat",
    address: getAddress("0xfbd5fd3f85e9f4c5e8b40eec9f8b8ab1caaa146b"),
    chainId: mainnet.id,
    decimals: 18,
  },
  {
    symbol: "OSCAR",
    name: "Oscar",
    address: getAddress("0xeBb66a88cEdd12bfE3a289df6DFEe377F2963F12"),
    chainId: mainnet.id,
    decimals: 9,
  },

  // ─── Cronos ─────────────────────────────────────────────
  {
    symbol: "CRO",
    name: "Cronos",
    chainId: cronos.id,
    decimals: 18,
  },
  {
    symbol: "ETH",
    name: "Ethereum (Cronos)",
    address: getAddress("0xe44Fd7fCb2b1581822D0c862B68222998a0c299a"),
    chainId: cronos.id,
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin (Cronos)",
    address: getAddress("0xc21223249CA28397B4B6541dfFaEcC539BfF0c59"),
    chainId: cronos.id,
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD (Cronos)",
    address: getAddress("0x66e428c3f67a68878562e79A0234c1F83c208770"),
    chainId: cronos.id,
    decimals: 6,
  },
  {
    symbol: "KIND",
    name: "Kindred",
    address: getAddress("0xb65E00EA8A113a819628A240d4c1702dB5cc7aaE"),
    chainId: cronos.id,
    decimals: 18,
  },
  {
    symbol: "NBAA",
    name: "NBAA",
    address: getAddress("0x190Fd3e5172a41F8048D3F9D82e2ee2b2f8a29DD"),
    chainId: cronos.id,
    decimals: 18,
  },

  // ─── XRP Ledger EVM Sidechain ────────────────────────────
  {
    symbol: "XRP",
    name: "XRP",
    chainId: xrp.id,
    decimals: 6,
  },
  {
    symbol: "ETH",
    name: "Ethereum (XRP EVM)",
    address: getAddress("0x6b175474e89094c44da98b954eedeac495271d0f"),
    chainId: xrp.id,
    decimals: 18,
  },
  {
    symbol: "USDC",
    name: "USD Coin (XRP EVM)",
    address: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    chainId: xrp.id,
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether USD (XRP EVM)",
    address: getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"),
    chainId: xrp.id,
    decimals: 6,
  },
];

export function tokensForChain(chainId: number) {
  return TOKENS.filter((t) => t.chainId === chainId);
}

export function defaultSellForChain(chainId: number) {
  const list = tokensForChain(chainId);
  if (chainId === mainnet.id) return list.find((t) => t.symbol === "ETH") ?? list[0]!;
  if (chainId === cronos.id) return list.find((t) => t.symbol === "CRO") ?? list[0]!;
  if (chainId === xrp.id) return list.find((t) => t.symbol === "XRP") ?? list[0]!;
  return list.find((t) => t.symbol === "ETH") ?? list[0]!;
}

export function defaultBuyForChain(chainId: number) {
  const list = tokensForChain(chainId);
  if (chainId === mainnet.id) return list.find((t) => t.symbol === "BONE") ?? list[1] ?? list[0]!;
  if (chainId === cronos.id) return list.find((t) => t.symbol === "USDC") ?? list[1] ?? list[0]!;
  if (chainId === xrp.id) return list.find((t) => t.symbol === "USDC") ?? list[1] ?? list[0]!;
  return list.find((t) => t.symbol === "USDC") ?? list[1] ?? list[0]!;
}

export const DEFAULT_SELL = defaultSellForChain(base.id);
export const DEFAULT_BUY = defaultBuyForChain(base.id);

export function tokenId(t: Token) {
  return `${t.chainId}:${t.address?.toLowerCase() ?? "native"}`;
}

export function isNative(t: Token) {
  return !t.address;
}

export function tokenDecimals(t: Token): number {
  return isNative(t) ? 18 : (t.decimals ?? 18);
}

export function isUsdStableToken(t: Token) {
  return t.symbol === "USDC" || t.symbol === "USDT" || t.symbol === "DAI";
}
