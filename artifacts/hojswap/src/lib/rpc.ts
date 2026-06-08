import { base, mainnet } from "wagmi/chains";
import { cronos, xrp } from "@/lib/chains";
import { fallback, http } from "viem";

export const RPC_URLS: Record<number, readonly string[]> = {
  [base.id]: [
    "https://mainnet.base.org",
    "https://base-rpc.publicnode.com",
    "https://base.llamarpc.com",
  ],
  [mainnet.id]: [
    "https://ethereum-rpc.publicnode.com",
    "https://rpc.ankr.com/eth",
    "https://cloudflare-eth.com",
  ],
  [cronos.id]: [
    "https://mainnet.cronos.org",
    "https://cronos-rpc.publicnode.com",
  ],
  [xrp.id]: [
    "https://xrpl.ws",
    "https://xrplcluster.com",
  ],
};

export function getRpcUrl(chainId: number) {
  return RPC_URLS[chainId]?.[0] ?? RPC_URLS[base.id]![0];
}

export function getRpcTransport(chainId: number) {
  const urls = RPC_URLS[chainId] ?? RPC_URLS[base.id]!;
  return fallback(urls.map((url) => http(url, { timeout: 12_000 })));
}

export function getViemChain(chainId: number) {
  if (chainId === mainnet.id) return mainnet;
  if (chainId === cronos.id) return cronos as any;
  if (chainId === xrp.id) return xrp as any;
  return base;
}
