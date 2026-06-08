import { QuoteDetailsRows } from "@/components/QuoteDetails";
import { SlippageSettings } from "@/components/SlippageSettings";
import { PriceResponse, QuoteResponse } from "@/lib/quote";
import { Token } from "@/lib/tokens";

export function SwapShowMore({
  slippageBps,
  onSlippageChange,
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
  slippageBps: number;
  onSlippageChange: (bps: number) => void;
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
  return (
    <details className="group hoj-panel rounded-2xl">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-white/55 [&::-webkit-details-marker]:hidden">
        <span>Show more</span>
        <span className="text-white/40 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-4 border-t border-white/10 px-4 py-3">
        <SlippageSettings embedded slippageBps={slippageBps} onChange={onSlippageChange} />
        <div className="border-t border-white/10 pt-3">
          <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/50">Quote details</div>
          <QuoteDetailsRows
            quote={quote}
            price={price}
            sellToken={sellToken}
            buyToken={buyToken}
            sellDecimals={sellDecimals}
            buyDecimals={buyDecimals}
            isQuoting={isQuoting}
            nativeUsdPrice={nativeUsdPrice}
            nativeSymbol={nativeSymbol}
          />
        </div>
        <p className="text-[11px] text-white/40">
          A 1% house fee is included in quotes and sent to The House of Joshi.
        </p>
      </div>
    </details>
  );
}
