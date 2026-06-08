export type ExplorerHistoryItem = {
  hash: string;
  chainId: number;
  timestamp: number;
  status: "success" | "failed";
  summary: string;
  kind: string;
};

export async function fetchExplorerHistory(
  chainId: number,
  address: string,
  source: "house" | "wallet" = "wallet",
): Promise<ExplorerHistoryItem[]> {
  try {
    const params = new URLSearchParams({
      chainId: String(chainId),
      source,
      ...(source === "wallet" ? { address } : {}),
    });
    const res = await fetch(`/api/transactions?${params}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: ExplorerHistoryItem[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}
