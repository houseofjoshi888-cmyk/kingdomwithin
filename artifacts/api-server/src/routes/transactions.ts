import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY ?? "";
const HOUSE_WALLET = "0x6736d2eA9807297F0e56967361B9410854B86a5f";

const XRP_EVM_CHAIN_ID = 1440002;

function getEtherscanApiUrl(chainId: number): string | null {
  if (chainId === 8453) return "https://api.basescan.org/api";
  if (chainId === 1) return "https://api.etherscan.io/api";
  if (chainId === 25) return "https://api.cronoscan.com/api";
  if (chainId === XRP_EVM_CHAIN_ID) return null; // No Etherscan-compatible API for XRP EVM
  return null;
}

async function fetchEtherscanTxns(
  baseUrl: string,
  address: string,
  apiKey: string,
  action: "tokentx" | "txlist",
  offset = 1000,
): Promise<any[]> {
  const url = new URL(baseUrl);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", action);
  url.searchParams.set("address", address);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "desc");
  url.searchParams.set("apikey", apiKey || "YourApiKeyToken");

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const data = (await response.json()) as { status: string; result: any[] };
  if (data.status !== "1" || !Array.isArray(data.result)) return [];
  return data.result;
}

router.get("/transactions", async (req, res) => {
  try {
    const chainId = Number(req.query.chainId ?? 8453);
    const source = String(req.query.source ?? "house");
    const address = String(req.query.address ?? "");

    const walletAddress = source === "house" ? HOUSE_WALLET : address;
    if (!walletAddress) {
      res.json({ items: [] });
      return;
    }

    const apiUrl = getEtherscanApiUrl(chainId);
    if (!apiUrl) {
      // Chain has no Etherscan-compatible API (e.g. XRP EVM)
      res.json({ items: [], total: 0 });
      return;
    }

    const [tokenTxns, ethTxns] = await Promise.all([
      fetchEtherscanTxns(apiUrl, walletAddress, ETHERSCAN_KEY, "tokentx", 1000),
      fetchEtherscanTxns(apiUrl, walletAddress, ETHERSCAN_KEY, "txlist", 500),
    ]);

    const seen = new Set<string>();

    const mapToken = (tx: any) => {
      const key = `${tx.hash}-token-${tx.tokenSymbol}`;
      if (seen.has(key)) return null;
      seen.add(key);
      const decimals = Number(tx.tokenDecimal) || 18;
      const amount = Number(tx.value) / 10 ** decimals;
      const amtStr =
        amount === 0 ? "0"
        : amount < 0.000001 ? "<0.000001"
        : amount.toLocaleString(undefined, { maximumFractionDigits: 6 });
      const kind = tx.to.toLowerCase() === HOUSE_WALLET.toLowerCase() ? "fee" : "wallet";
      return {
        hash: tx.hash,
        chainId,
        timestamp: Number(tx.timeStamp) * 1000,
        status: tx.isError === "1" ? "failed" : "success",
        kind,
        type: "token",
        summary: `${amtStr} ${tx.tokenSymbol}`,
        from: tx.from,
        to: tx.to,
        tokenSymbol: tx.tokenSymbol,
        amount: amtStr,
      };
    };

    const mapEth = (tx: any) => {
      if (tx.input === "0x") return null;
      const key = `${tx.hash}-eth`;
      if (seen.has(key)) return null;
      seen.add(key);
      const ethVal = Number(tx.value) / 1e18;
      const amtStr =
        ethVal === 0 ? "0"
        : ethVal < 0.0001 ? "<0.0001"
        : ethVal.toLocaleString(undefined, { maximumFractionDigits: 6 });
      const kind = tx.to?.toLowerCase() === HOUSE_WALLET.toLowerCase() ? "fee" : "wallet";
      return {
        hash: tx.hash,
        chainId,
        timestamp: Number(tx.timeStamp) * 1000,
        status: tx.isError === "1" ? "failed" : "success",
        kind,
        type: "eth",
        summary: `${amtStr} ETH`,
        from: tx.from,
        to: tx.to,
        tokenSymbol: "ETH",
        amount: amtStr,
      };
    };

    const items = [
      ...tokenTxns.map(mapToken).filter(Boolean),
      ...ethTxns.map(mapEth).filter(Boolean),
    ].sort((a: any, b: any) => b.timestamp - a.timestamp);

    res.json({ items, total: items.length });
  } catch (err) {
    req.log.error(err, "Error fetching transactions");
    res.json({ items: [], total: 0 });
  }
});

export default router;
