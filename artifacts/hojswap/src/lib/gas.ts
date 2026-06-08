import { useState, useEffect } from "react";
import { base, mainnet } from "wagmi/chains";
import { cronos } from "@/lib/chains";
import { formatCompactNumber } from "@/lib/format";
import { apiUrl } from "@/lib/api";

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const SELL_AMOUNT = "100000000000000000"; // 0.1 native token

const USDC_BY_CHAIN: Record<number, string> = {
  [mainnet.id]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [base.id]:    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [cronos.id]:  "0xc21223249CA28397B4B6541dfFaEEC539BfF0c59",
};

export function getNativeSymbol(chainId: number): string {
  if (chainId === cronos.id) return "CRO";
  return "ETH";
}

export function useNativeTokenPrice(chainId: number): number | null {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const usdcAddr = USDC_BY_CHAIN[chainId];
    if (!usdcAddr) { setPrice(null); return; }

    let cancelled = false;
    const doFetch = () => {
      fetch(apiUrl("/api/price"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellToken: NATIVE_ETH, buyToken: usdcAddr, sellAmount: SELL_AMOUNT, chainId }),
      })
        .then((r) => r.json())
        .then((data: any) => {
          if (cancelled || !data?.buyAmount) return;
          const usdc = Number(data.buyAmount) / 1e6; // USDC has 6 decimals
          setPrice(usdc / 0.1); // price per 1 native token
        })
        .catch(() => {});
    };

    doFetch();
    const id = setInterval(doFetch, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [chainId]);

  return price;
}

export type GasFeeDisplay = { eth: string; usd: string | null };

export function formatNetworkFee(
  totalNetworkFeeWei: string | null | undefined,
  gasWei: string | null | undefined,
  gasPriceWei: string | null | undefined,
  nativeUsdPrice: number | null,
  nativeSymbol: string,
): GasFeeDisplay | null {
  let wei: bigint | null = null;

  if (totalNetworkFeeWei) {
    try { wei = BigInt(totalNetworkFeeWei); } catch {}
  }
  if (!wei && gasWei && gasPriceWei) {
    try { wei = BigInt(gasWei) * BigInt(gasPriceWei); } catch {}
  }
  if (!wei || wei === 0n) return null;

  const native = Number(wei) / 1e18;
  const ethStr = native < 0.0001
    ? `<0.0001 ${nativeSymbol}`
    : `~${formatCompactNumber(native, native < 0.001 ? 6 : 5)} ${nativeSymbol}`;

  const usdStr = nativeUsdPrice != null
    ? native * nativeUsdPrice < 0.01 ? "<$0.01"
      : `~$${formatCompactNumber(native * nativeUsdPrice, native * nativeUsdPrice < 1 ? 3 : 2)}`
    : null;

  return { eth: ethStr, usd: usdStr };
}
