import { useMemo } from "react";
import {
  QuoteResponse,
  PriceResponse,
  calcPriceImpactPercent,
  formatFeeAmount,
  formatGasCostEth,
  NATIVE_ETH_ADDRESS,
} from "@/lib/quote";
import { formatCompactNumber, formatUsdDisplay } from "@/lib/format";
import { Token, isUsdStableToken, tokensForChain } from "@/lib/tokens";
import { formatNetworkFee, type GasFeeDisplay } from "@/lib/gas";

export function QuoteDetailsRows({
  quote,
  price,
  sellToken,
  buyToken,
  sellDecimals,
  buyDecimals,
  isQuoting,
  nativeUsdPrice,
  nativeSymbol,
}: {
  quote: QuoteResponse | null;
  price: PriceResponse | null;
  sellToken: Token;
  buyToken: Token;
  sellDecimals: number | null;
  buyDecimals: number | null;
  isQuoting: boolean;
  nativeUsdPrice?: number | null;
  nativeSymbol?: string;
}) {
  const chainTokens = useMemo(
    () => tokensForChain(sellToken.chainId),
    [sellToken.chainId],
  );

  const decimalsByAddress = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of chainTokens) {
      if (t.address && t.decimals != null) m.set(t.address.toLowerCase(), t.decimals);
    }
    if (sellToken.address && sellDecimals != null)
      m.set(sellToken.address.toLowerCase(), sellDecimals);
    if (buyToken.address && buyDecimals != null)
      m.set(buyToken.address.toLowerCase(), buyDecimals);
    m.set(NATIVE_ETH_ADDRESS.toLowerCase(), 18);
    return m;
  }, [chainTokens, sellToken, buyToken, sellDecimals, buyDecimals]);

  const symbolByAddress = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of chainTokens) {
      if (t.address) m.set(t.address.toLowerCase(), t.symbol);
    }
    m.set(NATIVE_ETH_ADDRESS.toLowerCase(), "ETH");
    return m;
  }, [chainTokens]);

  const priceImpact = quote && price ? calcPriceImpactPercent(quote, price) : null;
  const gasEth = quote ? formatGasCostEth(quote.transaction) : null;

  const sym = nativeSymbol ?? "ETH";
  const gasDisplay: GasFeeDisplay | null = useMemo(() => {
    const totalFee = quote?.totalNetworkFee ?? price?.totalNetworkFee;
    return formatNetworkFee(
      totalFee,
      quote?.transaction?.gas,
      quote?.transaction?.gasPrice,
      nativeUsdPrice ?? null,
      sym,
    );
  }, [quote, price, nativeUsdPrice, sym]);

  const exchangeRate = useMemo(() => {
    if (quote?.sellAmount == null || quote?.buyAmount == null || sellDecimals == null || buyDecimals == null)
      return null;
    try {
      const sell = Number(quote.sellAmount) / 10 ** sellDecimals;
      const buy = Number(quote.buyAmount) / 10 ** buyDecimals;
      if (sell === 0) return null;
      if (isUsdStableToken(buyToken)) {
        return `1 ${sellToken.symbol} ≈ ${formatUsdDisplay(buy / sell)}`;
      }
      if (isUsdStableToken(sellToken)) {
        return `1 ${buyToken.symbol} ≈ ${formatUsdDisplay(sell / buy)}`;
      }
      return `1 ${sellToken.symbol} ≈ ${formatCompactNumber(buy / sell, 6)} ${buyToken.symbol}`;
    } catch {
      return null;
    }
  }, [quote, sellDecimals, buyDecimals, sellToken, buyToken]);

  const routeLabel = useMemo(() => {
    const fills = quote?.route?.fills;
    if (!fills?.length) return null;
    return [...new Set(fills.map((f) => f.source))].join(" → ");
  }, [quote?.route?.fills]);

  const houseFee = quote?.fees?.integratorFee ?? quote?.fees?.integratorFees?.[0] ?? null;
  const zeroExFee = quote?.fees?.zeroExFee ?? null;

  const houseFeeStr = formatFeeAmount(houseFee, decimalsByAddress, symbolByAddress);
  const zeroExFeeStr = formatFeeAmount(zeroExFee, decimalsByAddress, symbolByAddress);

  if (!quote && !isQuoting) {
    return (
      <p className="text-[11px] text-white/45">
        Enter an amount to see rate, route, and fees.
      </p>
    );
  }

  if (isQuoting) {
    return <div className="text-[11px] text-white/50">Updating quote…</div>;
  }

  return (
    <div className="space-y-2 text-[11px] text-white/65">
      {exchangeRate ? <Row label="Rate" value={exchangeRate} /> : null}
      {priceImpact != null ? (
        <Row
          label="Price impact"
          value={`${priceImpact >= 0 ? "" : "−"}${Math.abs(priceImpact).toFixed(2)}%`}
          highlight={Math.abs(priceImpact) >= 3 ? "warn" : undefined}
        />
      ) : null}
      {routeLabel ? <Row label="Route" value={routeLabel} /> : null}
      {gasDisplay ? (
        <Row
          label="Est. network fee"
          value={gasDisplay.usd
            ? `${gasDisplay.usd} (${gasDisplay.eth})`
            : gasDisplay.eth}
        />
      ) : gasEth ? (
        <Row label="Est. network fee" value={`~${gasEth} ${sym}`} />
      ) : null}
      {houseFeeStr ? <Row label="House fee (1%)" value={houseFeeStr} /> : null}
      {zeroExFeeStr ? <Row label="0x fee" value={zeroExFeeStr} /> : null}
      {quote?.issues?.simulationIncomplete ? (
        <div className="text-amber-200/80">
          Simulation incomplete — confirm in wallet before swapping.
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: "warn" }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-white/45">{label}</span>
      <span className={`min-w-0 text-right break-words ${highlight === "warn" ? "text-amber-200/90" : "text-white/85"}`}>
        {value}
      </span>
    </div>
  );
}
