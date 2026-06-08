/// <reference types="node" />
/// <reference lib="dom" />
import type { VercelRequest, VercelResponse } from "@vercel/node";

const LIFI_API = "https://li.quest/v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { fromChain, toChain, fromToken, toToken, fromAmount, fromAddress } = req.query;
  if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !fromAddress) {
    return res.status(400).json({ error: "Missing required query params" });
  }

  const params = new URLSearchParams({
    fromChain: String(fromChain),
    toChain: String(toChain),
    fromToken: String(fromToken),
    toToken: String(toToken),
    fromAmount: String(fromAmount),
    fromAddress: String(fromAddress),
    slippage: "0.005",
    order: "CHEAPEST",
    integrator: "hojswap",
  });

  const apiKey = process.env.LIFI_API_KEY ?? "";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-lifi-api-key"] = apiKey;

  try {
    const upstream = await fetch(`${LIFI_API}/quote?${params}`, { headers });
    const data = await upstream.json();
    res.setHeader("Cache-Control", "no-store");
    if (!upstream.ok) return res.status(upstream.status).json(data);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch bridge quote", message: err?.message });
  }
}
