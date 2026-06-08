import { base, mainnet } from "wagmi/chains";

export const cronos = {
  id: 25,
  name: "Cronos",
  network: "cronos",
  nativeCurrency: { name: "Cronos", symbol: "CRO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.cronos.org"] },
    public: { http: ["https://mainnet.cronos.org"] },
  },
  blockExplorers: { default: { name: "Cronoscan", url: "https://cronoscan.com" } },
  testnet: false,
} as const;

export const xrp = {
  id: 1440002,
  name: "XRP EVM",
  network: "xrp-evm",
  nativeCurrency: { name: "XRP", symbol: "XRP", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evm-sidechain.xrpl.org/"] },
    public: { http: ["https://evm-sidechain.xrpl.org/"] },
  },
  blockExplorers: { default: { name: "XRP Explorer", url: "https://evm-sidechain.xrpl.org/" } },
  testnet: false,
} as const;

export const SUPPORTED_CHAIN_IDS = [base.id, mainnet.id, cronos.id, xrp.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function getChainName(chainId: number) {
  if (chainId === mainnet.id) return "Ethereum";
  if (chainId === base.id) return "Base";
  if (chainId === cronos.id) return "Cronos";
  if (chainId === xrp.id) return "XRP Ledger";
  return "Unknown";
}

export function explorerName(chainId: number) {
  if (chainId === mainnet.id) return "Etherscan";
  if (chainId === base.id) return "Basescan";
  if (chainId === cronos.id) return "Cronoscan";
  if (chainId === xrp.id) return "XRPScan";
  return "Explorer";
}

export function explorerTxUrl(chainId: number, hash: string) {
  if (chainId === mainnet.id) return `https://etherscan.io/tx/${hash}`;
  if (chainId === base.id) return `https://basescan.org/tx/${hash}`;
  if (chainId === cronos.id) return `https://cronoscan.com/tx/${hash}`;
  if (chainId === xrp.id) return `https://xrpscan.com/tx/${hash}`;
  return `https://basescan.org/tx/${hash}`;
}

export function explorerAddressUrl(chainId: number, address: string) {
  if (chainId === mainnet.id) return `https://etherscan.io/address/${address}`;
  if (chainId === base.id) return `https://basescan.org/address/${address}`;
  if (chainId === cronos.id) return `https://cronoscan.com/address/${address}`;
  if (chainId === xrp.id) return `https://xrpscan.com/account/${address}`;
  return `https://basescan.org/address/${address}`;
}
