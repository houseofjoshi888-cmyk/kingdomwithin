import { Router } from "express";

const router = Router();
const LIFI_API = "https://li.quest/v1";
const LIFI_API_KEY = process.env.LIFI_API_KEY ?? "";

router.get("/bridge/quote", async (req, res) => {
  try {
    const { fromChain, toChain, fromToken, toToken, fromAmount, fromAddress } = req.query;
    if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !fromAddress) {
      return res.status(400).json({ error: "Missing required query params" });
    }
    const params = new URLSearchParams({
      fromChain:   String(fromChain),
      toChain:     String(toChain),
      fromToken:   String(fromToken),
      toToken:     String(toToken),
      fromAmount:  String(fromAmount),
      fromAddress: String(fromAddress),
      slippage:    "0.005",
      order:       "CHEAPEST",
      integrator:  "hojswap",
    });
    const headers: Record<string, string> = { Accept: "application/json" };
    if (LIFI_API_KEY) headers["x-lifi-api-key"] = LIFI_API_KEY;

    const upstream = await fetch(`${LIFI_API}/quote?${params}`, { headers });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json(data);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch bridge quote", message: err?.message });
  }
});

export default router;
