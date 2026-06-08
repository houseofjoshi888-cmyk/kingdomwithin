

const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY ?? "";
const HOUSE_WALLET = "0x6736d2eA9807297F0e56967361B9410854B86a5f";

function getExplorerApiUrl(chainId: number) {
  if (chainId === 8453) return "https://api.basescan.org/api";
  if (chainId === 25) return "https://api.cronoscan.com/api";
  return "https://api.etherscan.io/api";
}

async function fetchTxns(baseUrl: string, address: string, action: "tokentx" | "txlist"): Promise<any[]> {
  const url = new URL(baseUrl);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", action);
  url.searchParams.set("address", address);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", "500");
  url.searchParams.set("sort", "desc");
  url.searchParams.set("apikey", ETHERSCAN_KEY || "YourApiKeyToken");
  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const data = await response.json() as { status: string; result: any[] };
  if (data.status !== "1" || !Array.isArray(data.result)) return [];
  return data.result;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const chainId = Number(req.query.chainId ?? 8453);
    const source = String(req.query.source ?? "house");
    const address = String(req.query.address ?? "");
    const walletAddress = source === "house" ? HOUSE_WALLET : address;
    if (!walletAddress) return res.json({ items: [] });

    const baseUrl = getExplorerApiUrl(chainId);
    const [tokenTxns, ethTxns] = await Promise.all([
      fetchTxns(baseUrl, walletAddress, "tokentx"),
      fetchTxns(baseUrl, walletAddress, "txlist"),
    ]);
    const seen = new Set<string>();
    const items = [
      ...tokenTxns.map((tx: any) => {
        const key = `${tx.hash}-token-${tx.tokenSymbol}`;
        if (seen.has(key)) return null;
        seen.add(key);
        const amount = Number(tx.value) / 10 ** (Number(tx.tokenDecimal) || 18);
        return {
          hash: tx.hash, chainId,
          timestamp: Number(tx.timeStamp) * 1000,
          status: tx.isError === "1" ? "failed" : "success",
          kind: tx.to.toLowerCase() === HOUSE_WALLET.toLowerCase() ? "fee" : "wallet",
          type: "token",
          summary: `${amount < 0.000001 ? "<0.000001" : amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${tx.tokenSymbol}`,
          from: tx.from, to: tx.to,
        };
      }),
      ...ethTxns.map((tx: any) => {
        if (tx.input === "0x") return null;
        const key = `${tx.hash}-eth`;
        if (seen.has(key)) return null;
        seen.add(key);
        const ethVal = Number(tx.value) / 1e18;
        return {
          hash: tx.hash, chainId,
          timestamp: Number(tx.timeStamp) * 1000,
          status: tx.isError === "1" ? "failed" : "success",
          kind: tx.to?.toLowerCase() === HOUSE_WALLET.toLowerCase() ? "fee" : "wallet",
          type: "eth",
          summary: `${ethVal < 0.0001 ? "<0.0001" : ethVal.toLocaleString(undefined, { maximumFractionDigits: 6 })} ETH`,
          from: tx.from, to: tx.to,
        };
      }),
    ].filter(Boolean).sort((a: any, b: any) => b.timestamp - a.timestamp);

    return res.json({ items, total: items.length });
  } catch {
    return res.json({ items: [], total: 0 });
  }
}
