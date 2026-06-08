

const ZEROX_BASE_URL = "https://api.0x.org";
// Use environment API key when available. For local development allow a fallback.
const ZEROX_API_KEY = process.env.ZEROX_API_KEY ?? process.env.ZEROX_API_KEY_FALLBACK ?? "";
const HOUSE_WALLET = "0x6736d2eA9807297F0e56967361B9410854B86a5f";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ZEROX_API_KEY) {
    // In production, require an API key. For local development, return a mock quote
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({ error: "api_key_missing", reason: "Set ZEROX_API_KEY in Vercel environment variables." });
    }
    console.log("[QUOTE API] ZEROX_API_KEY missing — returning mock quote for development");
    try {
      const { sellToken, buyToken, sellAmount, chainId } = req.body as any;
      const buyAmount = sellAmount; // 1:1 mock
      const mock = {
        buyAmount,
        sellAmount,
        buyToken,
        sellToken,
        minBuyAmount: buyAmount,
        liquidityAvailable: true,
        transaction: { to: HOUSE_WALLET, data: "0x", value: "0" },
      } as any;
      return res.status(200).json(mock);
    } catch (e) {
      return res.status(500).json({ error: "mock_quote_failed" });
    }
  }
  try {
    const { sellToken, buyToken, sellAmount, chainId, slippageBps, taker } = req.body as {
      sellToken: string; buyToken: string; sellAmount: string;
      chainId: number; slippageBps?: number; taker?: string;
    };
    const params = new URLSearchParams({
      chainId: String(chainId), sellToken, buyToken, sellAmount,
      slippageBps: String(slippageBps ?? 100),
      integratorFee: "100", integratorFeeRecipient: HOUSE_WALLET,
    });
    if (taker) params.set("taker", taker);
    console.log("[QUOTE API] params:", params.toString());
    const upstream = await fetch(`${ZEROX_BASE_URL}/swap/permit2/quote?${params}`, {
      headers: { "Content-Type": "application/json", "0x-api-key": ZEROX_API_KEY, "0x-version": "v2" },
    });

    let data: any;
    try {
      data = await upstream.json();
    } catch (err) {
      // upstream returned non-JSON (HTML, text, or empty) — capture text for debugging
      try {
        data = await upstream.text();
      } catch (e) {
        data = String(err ?? e ?? "Unknown upstream response");
      }
    }

    console.log("[QUOTE API] upstream status:", upstream.status);

    if (upstream.status === 401 || upstream.status === 403) {
      return res.status(503).json({ error: "api_key_invalid", reason: "The 0x API key is invalid." });
    }

    return res.status(upstream.status).json(data);
  } catch {
    // Log the error on the server for debugging
    console.error("[QUOTE API] unexpected error while fetching quote", arguments);
    return res.status(500).json({ error: "Failed to fetch quote" });
  }
}
