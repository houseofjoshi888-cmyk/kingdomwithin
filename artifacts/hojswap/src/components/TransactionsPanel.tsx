import { useEffect, useMemo, useState } from "react";
import { base, mainnet } from "wagmi/chains";
import { cronos, xrp, explorerTxUrl, explorerName, getChainName } from "@/lib/chains";
import type { ExplorerHistoryItem } from "@/lib/explorer-api";
import { loadTransactions, type SwapTransaction } from "@/lib/transactions";

type DisplayTx = {
  id: string;
  hash: string;
  chainId: number;
  chain: string;
  timestamp: number;
  status: "success" | "failed";
  sellLabel: string;
  buyLabel: string;
  source: "local" | "onchain";
  kind?: string;
};

function toDisplayFromLocal(tx: SwapTransaction): DisplayTx {
  return {
    id: `local-${tx.chainId}-${tx.hash}`,
    hash: tx.hash,
    chainId: tx.chainId,
    chain: tx.chain,
    timestamp: tx.timestamp,
    status: tx.status,
    sellLabel: `${tx.sellAmount} ${tx.sellToken}`,
    buyLabel: `${tx.buyAmount} ${tx.buyToken}`,
    source: "local",
  };
}

function toDisplayFromOnChain(item: ExplorerHistoryItem): DisplayTx {
  return {
    id: `chain-${item.chainId}-${item.hash}-${item.kind}`,
    hash: item.hash,
    chainId: item.chainId,
    chain: getChainName(item.chainId),
    timestamp: item.timestamp,
    status: item.status,
    sellLabel: item.kind === "fee" ? "House fee" : "Wallet tx",
    buyLabel: item.summary,
    source: "onchain",
    kind: item.kind,
  };
}

const CHAIN_FILTERS = [
  { id: 0, label: "All" },
  { id: base.id, label: "Base" },
  { id: mainnet.id, label: "Ethereum" },
  { id: cronos.id, label: "Cronos" },
  { id: xrp.id, label: "XRP" },
] as const;

const PAGE_SIZE = 50;

export function TransactionsPanel({
  walletAddress,
  selectedChainId,
}: {
  walletAddress?: string;
  selectedChainId?: number;
}) {
  const [localTxs] = useState<SwapTransaction[]>(() => loadTransactions());
  const [onChain, setOnChain] = useState<ExplorerHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<number>(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const chains = [base.id, mainnet.id, cronos.id, xrp.id] as const;
        const requests: Promise<Response>[] = [];
        for (const cid of chains) {
          requests.push(fetch(`/api/transactions?chainId=${cid}&source=house`));
          if (walletAddress) {
            requests.push(fetch(`/api/transactions?chainId=${cid}&source=wallet&address=${walletAddress}`));
          }
        }
        const responses = await Promise.all(requests);
        const items: ExplorerHistoryItem[] = [];
        for (const res of responses) {
          if (!res.ok) continue;
          const data = (await res.json()) as { items?: ExplorerHistoryItem[] };
          if (Array.isArray(data.items)) items.push(...data.items);
        }
        if (!cancelled) setOnChain(items);
      } catch {
        if (!cancelled)
          setLoadError("Could not load on-chain history. Your saved swaps are still shown below.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [walletAddress]);

  const allDisplayTxs = useMemo(() => {
    const byHash = new Map<string, DisplayTx>();
    for (const item of onChain) {
      const key = `${item.chainId}:${item.hash}:${item.kind}`;
      if (!byHash.has(key)) byHash.set(key, toDisplayFromOnChain(item));
    }
    for (const tx of localTxs) {
      if (tx.hash === "N/A") continue;
      const key = `${tx.chainId}:${tx.hash}:local`;
      byHash.set(key, toDisplayFromLocal(tx));
    }
    return [...byHash.values()].sort((a, b) => b.timestamp - a.timestamp);
  }, [localTxs, onChain]);

  const filtered = useMemo(
    () => (chainFilter === 0 ? allDisplayTxs : allDisplayTxs.filter((t) => t.chainId === chainFilter)),
    [allDisplayTxs, chainFilter],
  );

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const shortHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;

  return (
    <div className="hoj-panel rounded-3xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/55">
          {loading
            ? "Loading…"
            : `${filtered.length.toLocaleString()} transaction${filtered.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex flex-wrap gap-1">
          {CHAIN_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setChainFilter(id); setPage(1); }}
              className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                chainFilter === id
                  ? "bg-[rgba(212,175,55,0.9)] text-black"
                  : "bg-white/8 text-white/55 hover:bg-white/12"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-xs text-amber-200/90">
          ⚠ {loadError}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/50">
          {chainFilter === 0
            ? "No transactions found. Complete a swap to see history here."
            : `No transactions on ${CHAIN_FILTERS.find((c) => c.id === chainFilter)?.label ?? "this chain"}.`}
        </p>
      ) : (
        <>
          <div className="max-h-[min(520px,65vh)] space-y-2 overflow-y-auto pr-1">
            {paginated.map((tx) => (
              <div key={tx.id} className="hoj-surface rounded-2xl p-3">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        tx.status === "success"
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-red-400/15 text-red-300"
                      }`}
                    >
                      {tx.status === "success" ? "✓" : "✗"}{" "}
                      {tx.status === "success" ? "Success" : "Failed"}
                    </span>
                    {tx.kind === "fee" && (
                      <span className="rounded-full bg-[rgba(212,175,55,0.15)] px-2 py-0.5 text-[10px] font-semibold text-[rgba(212,175,55,0.8)]">
                        House Fee
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/40">{tx.chain}</span>
                </div>
                <div className="mb-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                  <span className="text-white/40">{tx.source === "local" ? "Sold" : "Type"}</span>
                  <span className="truncate text-white/80">{tx.sellLabel}</span>
                  <span className="text-white/40">{tx.source === "local" ? "Received" : "Amount"}</span>
                  <span className="truncate font-medium text-white/90">{tx.buyLabel}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-white/35">{formatDate(tx.timestamp)}</span>
                  <a
                    href={explorerTxUrl(tx.chainId, tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tx.hash}
                    className="flex items-center gap-1 text-[11px] text-[rgba(212,175,55,0.8)] hover:text-[rgba(212,175,55,1)] hover:underline transition"
                  >
                    {shortHash(tx.hash)} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="mt-3 w-full rounded-2xl border border-white/10 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 transition"
            >
              Load more ({filtered.length - paginated.length} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
