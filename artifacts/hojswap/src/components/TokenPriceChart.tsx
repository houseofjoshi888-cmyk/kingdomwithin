import { useEffect, useRef, useState } from "react";
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { coingeckoId, fetchCurrentPrice, fetchPriceHistory, type PricePoint } from "@/lib/coingecko";
import type { Token } from "@/lib/tokens";

type Range = 1 | 7 | 30;
const RANGES: { label: string; value: Range }[] = [
  { label: "1D", value: 1 },
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
];

function formatPrice(p: number): string {
  if (p < 0.0001) return `$${p.toExponential(2)}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  if (p < 1000) return `$${p.toFixed(2)}`;
  return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatDate(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === 1) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, range }: { active?: boolean; payload?: { payload: PricePoint }[]; range: Range }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]!.payload;
  return (
    <div className="rounded-xl border border-[rgba(212,175,55,0.2)] bg-[#0b0b0d]/95 px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium text-[rgba(212,175,55,0.9)]">{formatPrice(pt.price)}</div>
      <div className="text-white/40">{formatDate(pt.time, range)}</div>
    </div>
  );
}

export function TokenPriceChart({ token }: { token: Token }) {
  const cgId = coingeckoId(token.symbol);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>(7);
  const [points, setPoints] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || !cgId) return;

    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    Promise.all([
      fetchPriceHistory(cgId, range),
      fetchCurrentPrice(cgId),
    ])
      .then(([pts, cur]) => {
        if (ctrl.signal.aborted) return;
        setPoints(pts);
        if (cur) {
          setCurrentPrice(cur.price);
          setChange24h(cur.change24h);
        }
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [open, cgId, range]);

  const positive = (change24h ?? 0) >= 0;
  const minPrice = points.length ? Math.min(...points.map((p) => p.price)) : 0;
  const maxPrice = points.length ? Math.max(...points.map((p) => p.price)) : 1;
  const domain: [number, number] = [minPrice * 0.999, maxPrice * 1.001];

  return (
    <details
      className="group hoj-panel rounded-2xl"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-white/55 [&::-webkit-details-marker]:hidden">
        <span>Price Chart</span>
        <div className="flex items-center gap-2">
          {currentPrice !== null && open && (
            <>
              <span className="font-medium text-white/80">{formatPrice(currentPrice)}</span>
              {change24h !== null && (
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {positive ? "+" : ""}{change24h.toFixed(2)}%
                </span>
              )}
            </>
          )}
          <span className="text-white/40 transition-transform group-open:rotate-180">▾</span>
        </div>
      </summary>

      <div className="border-t border-white/10 px-4 pb-4 pt-3">
        {!cgId ? (
          <p className="py-4 text-center text-xs text-white/35">
            No price data for {token.symbol}
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div>
                {currentPrice !== null ? (
                  <span className="text-lg font-semibold text-white/90">{formatPrice(currentPrice)}</span>
                ) : (
                  <span className="text-sm text-white/40">{token.symbol}</span>
                )}
                {change24h !== null && (
                  <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${positive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {positive ? "▲" : "▼"} {Math.abs(change24h).toFixed(2)}% 24h
                  </span>
                )}
              </div>
              <div className="flex rounded-xl border border-white/10 bg-black/20 p-0.5">
                {RANGES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRange(value)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                      range === value
                        ? "bg-[rgba(212,175,55,0.18)] text-[rgba(212,175,55,0.95)]"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(212,175,55,0.3)] border-t-[rgba(212,175,55,0.9)]" />
              </div>
            ) : error ? (
              <p className="py-4 text-center text-xs text-red-400/70">{error}</p>
            ) : points.length > 0 ? (
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hojGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={domain} hide />
                  <Tooltip content={<CustomTooltip range={range} />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#d4af37"
                    strokeWidth={1.5}
                    fill="url(#hojGold)"
                    dot={false}
                    activeDot={{ r: 3, fill: "#d4af37", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}
