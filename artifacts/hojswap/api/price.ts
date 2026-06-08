

const ZEROX_BASE_URL = "https://api.0x.org";
const ZEROX_API_KEY = process.env.ZEROX_API_KEY ?? "";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ZEROX_API_KEY) {
    return res.status(503).json({ error: "api_key_missing" });
  }
  try {
    const { sellToken, buyToken, sellAmount, chainId, slippageBps, taker } = req.body as {
      sellToken: string; buyToken: string; sellAmount: string;
      chainId: number; slippageBps?: number; taker?: string;
    };
    const params = new URLSearchParams({
      chainId: String(chainId), sellToken, buyToken, sellAmount,
      slippageBps: String(slippageBps ?? 100),
    });
    if (taker) params.set("taker", taker);
    const upstream = await fetch(`${ZEROX_BASE_URL}/swap/permit2/price?${params}`, {
      headers: { "Content-Type": "application/json", "0x-api-key": ZEROX_API_KEY, "0x-version": "v2" },
    });
    const data = await upstream.json();
    if (upstream.status === 401 || upstream.status === 403) {
      return res.status(503).json({ error: "api_key_invalid" });
    }
    return res.status(upstream.status).json(data);
  } catch {
    return res.status(500).json({ error: "Failed to fetch price" });
  }
}
