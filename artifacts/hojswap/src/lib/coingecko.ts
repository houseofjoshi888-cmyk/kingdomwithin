const COINGECKO_IDS: Record<string, string> = {
  ETH: "ethereum",
  USDC: "usd-coin",
  USDT: "tether",
  SHIB: "shiba-inu",
  BONE: "bone-shibaswap",
  TREAT: "treat",
  OSCAR: "oscar-token",
  CRO: "crypto-com-chain",
  XRP: "ripple",
};

export function coingeckoId(symbol: string): string | null {
  return COINGECKO_IDS[symbol] ?? null;
}

export type PricePoint = { time: number; price: number };

type CacheEntry = { data: PricePoint[]; expiresAt: number };
const chartCache = new Map<string, CacheEntry>();

type PriceEntry = { price: number; change24h: number; expiresAt: number };
const priceCache = new Map<string, PriceEntry>();

const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchPriceHistory(coinId: string, days: number): Promise<PricePoint[]> {
  const key = `${coinId}:${days}`;
  const cached = chartCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
  );
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = await res.json() as { prices: [number, number][] };
  const data: PricePoint[] = json.prices.map(([time, price]) => ({ time, price }));
  chartCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function fetchCurrentPrice(coinId: string): Promise<{ price: number; change24h: number } | null> {
  const cached = priceCache.get(coinId);
  if (cached && cached.expiresAt > Date.now()) return { price: cached.price, change24h: cached.change24h };

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
  );
  if (!res.ok) return null;
  const json = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
  const entry = json[coinId];
  if (!entry) return null;
  priceCache.set(coinId, { price: entry.usd, change24h: entry.usd_24h_change, expiresAt: Date.now() + CACHE_TTL_MS });
  return { price: entry.usd, change24h: entry.usd_24h_change };
}
