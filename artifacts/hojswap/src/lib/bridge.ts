import { mainnet, base } from "wagmi/chains";
import { cronos, xrp } from "@/lib/chains";

export const HOUSE_WALLET = "0x6736d2eA9807297F0e56967361B9410854B86a5f";
export const BRIDGE_FEE_BPS = 100;

export const BRIDGE_CONFIG = {
    ROUTER: {
        ethereum: "0x45f1de6ba6a8ff2387e18fc4b00343f7241e2b6a",
        base: "0x45f1de6ba6a8ff2387e18fc4b00343f7241e2b6a",
        cronos: "0x45f1de6ba6a8ff2387e18fc4b00343f7241e2b6a",
        xrp: "0x45f1de6ba6a8ff2387e18fc4b00343f7241e2b6a",
    },
    STARGATE_CHAIN_IDS: {
        ethereum: 101,
        base: 184,
        cronos: 125,
        xrp: 20,
    },
    TOKENS: {
        USDC: {
            ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            base: "0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d",
            cronos: "0xc21223249CA28397B4B6541dfFaEEC539BfF0c59",
            xrp: "0x1DAbD6b54C27716E5BE8981E27152b97ac4d4e28",
            decimals: 6,
            poolId: 1,
        },
        USDT: {
            ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            base: "0xfde4C96c8593536E31F0ea4c8f34731f3b4c34df",
            cronos: "0x66e428c3f67a68767eb9ef128fda82a14f9061d3",
            xrp: "0xCbCdF9B50Ec8Ff61e1228C4c20Aeadb1D6D55e8D",
            decimals: 6,
            poolId: 2,
        },
        ETH: {
            ethereum: "native",
            base: "native",
            cronos: "0x5C7F8A570d578FD390EaF6086bafcaD319034e74",
            xrp: "0xD8Ca8d5f6dd4b2d88cd06f256aFD6038e7f94e08",
            decimals: 18,
            poolId: 0,
        },
    },
} as const;

export const BRIDGE_ROUTES = {
    ETH_TO_BASE: { fromChainId: mainnet.id, toChainId: base.id, name: "Ethereum → Base", supportedTokens: ["USDC", "USDT", "ETH"] },
    ETH_TO_CRONOS: { fromChainId: mainnet.id, toChainId: cronos.id, name: "Ethereum → Cronos", supportedTokens: ["USDC", "USDT", "ETH"] },
    ETH_TO_XRP: { fromChainId: mainnet.id, toChainId: xrp.id, name: "Ethereum → XRP", supportedTokens: ["USDC", "USDT", "ETH"] },
    BASE_TO_ETH: { fromChainId: base.id, toChainId: mainnet.id, name: "Base → Ethereum", supportedTokens: ["USDC", "USDT"] },
    BASE_TO_CRONOS: { fromChainId: base.id, toChainId: cronos.id, name: "Base → Cronos", supportedTokens: ["USDC", "USDT"] },
    BASE_TO_XRP: { fromChainId: base.id, toChainId: xrp.id, name: "Base → XRP", supportedTokens: ["USDC", "USDT"] },
    CRONOS_TO_BASE: { fromChainId: cronos.id, toChainId: base.id, name: "Cronos → Base", supportedTokens: ["USDC", "USDT"] },
    CRONOS_TO_ETH: { fromChainId: cronos.id, toChainId: mainnet.id, name: "Cronos → Ethereum", supportedTokens: ["USDC", "USDT"] },
    XRP_TO_BASE: { fromChainId: xrp.id, toChainId: base.id, name: "XRP → Base", supportedTokens: ["USDC", "USDT"] },
    XRP_TO_ETH: { fromChainId: xrp.id, toChainId: mainnet.id, name: "XRP → Ethereum", supportedTokens: ["USDC", "USDT"] },
} as const;

export function getSupportedBridgeTokens(fromChainId: number, toChainId: number): string[] {
    const route = Object.values(BRIDGE_ROUTES).find(
        (r) => r.fromChainId === fromChainId && r.toChainId === toChainId,
    );
    return route?.supportedTokens ? [...route.supportedTokens] : [];
}

export function getTokenAddressForChain(tokenSymbol: string, chainId: number): string | null {
    const tokenConfig = BRIDGE_CONFIG.TOKENS[tokenSymbol as keyof typeof BRIDGE_CONFIG.TOKENS];
    if (!tokenConfig) return null;
    let key: string | null = null;
    if (chainId === mainnet.id) key = "ethereum";
    else if (chainId === base.id) key = "base";
    else if (chainId === cronos.id) key = "cronos";
    else if (chainId === xrp.id) key = "xrp";
    if (!key) return null;
    const address = tokenConfig[key as keyof typeof tokenConfig] as string | undefined;
    if (!address) return null;
    if (address === "native" || address === "0x0000000000000000000000000000000000000000") return null;
    return address;
}
