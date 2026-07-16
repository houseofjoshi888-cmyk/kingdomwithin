"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { fallback, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { BASE_MAINNET_RPC_FALLBACK_URL, BASE_MAINNET_RPC_URL } from "../lib/network";

export const REOWN_PROJECT_ID = "919392f900531a3721df98547c9ff9e6";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || REOWN_PROJECT_ID;
const rpcUrls = Array.from(new Set([
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL?.trim(),
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_FALLBACK_URL?.trim(),
  BASE_MAINNET_RPC_URL,
  BASE_MAINNET_RPC_FALLBACK_URL,
].filter((url): url is string => Boolean(url))));

const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Kingdom Within" }),
    walletConnect({ projectId: walletConnectProjectId }),
  ],
  transports: {
    [base.id]: fallback(rpcUrls.map((url) => http(url, { retryCount: 2, timeout: 12_000 })), { rank: true }),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={base}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
