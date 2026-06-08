const TX_KEY = "hoj_swap_transactions";

export type SwapTransaction = {
  hash: string;
  chainId: number;
  chain: string;
  timestamp: number;
  status: "success" | "failed";
  sellAmount: string;
  sellToken: string;
  buyAmount: string;
  buyToken: string;
};

export function loadTransactions(): SwapTransaction[] {
  try {
    const raw = localStorage.getItem(TX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SwapTransaction[];
  } catch {
    return [];
  }
}

export function saveTransaction(tx: SwapTransaction): void {
  const txs = loadTransactions();
  const updated = [tx, ...txs.filter((t) => t.hash !== tx.hash)].slice(0, 200);
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(updated));
  } catch {
    // storage full — ignore
  }
}
