import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits, maxUint256 } from "viem";
import { base, mainnet } from "wagmi/chains";
import { cronos, getChainName } from "@/lib/chains";
import { clampToDecimals, formatCompactNumber, isValidNumberInput } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { SIMPLE_TRANSFER_ABI } from "@/lib/stargate";
import { type LiFiQuote } from "@/lib/lifi";
import { apiUrl } from "@/lib/api";
import { HOUSE_WALLET } from "@/lib/tokens";
import { saveTransaction } from "@/lib/transactions";

const BRIDGE_FEE_BPS = 100;
const DUMMY_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

type XToken = { symbol: string; address: string; decimals: number };

const TOKENS_BY_CHAIN: Record<number, XToken[]> = {
  [mainnet.id]: [
    { symbol: "ETH",  address: "0x0000000000000000000000000000000000000000", decimals: 18 },
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    { symbol: "DAI",  address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
    { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
    { symbol: "SHIB", address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18 },
  ],
  [base.id]: [
    { symbol: "ETH",  address: "0x0000000000000000000000000000000000000000", decimals: 18 },
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "USDT", address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6 },
    { symbol: "DAI",  address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
    { symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
  ],
  [cronos.id]: [
    { symbol: "CRO",  address: "0x0000000000000000000000000000000000000000", decimals: 18 },
    { symbol: "USDC", address: "0xc21223249CA28397B4B6541dfFaEEC539BfF0c59", decimals: 6 },
    { symbol: "USDT", address: "0x66e428c3f67a68767eb9ef128fda82a14f9061d3", decimals: 6 },
    { symbol: "WETH", address: "0xe44Fd7fCb2b1581822D0c862B68222998a0c299a", decimals: 18 },
  ],
};

const ALL_CHAINS = [
  { id: base.id,    name: "Base" },
  { id: mainnet.id, name: "Ethereum" },
  { id: cronos.id,  name: "Cronos" },
];

function isNativeToken(address: string) {
  return address === "0x0000000000000000000000000000000000000000";
}

export function CrossChainTab() {
  const { showToast } = useToast();
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [fromChainId, setFromChainId] = useState<number>(base.id);
  const [toChainId, setToChainId] = useState<number>(mainnet.id);

  const fromTokens = TOKENS_BY_CHAIN[fromChainId] ?? [];
  const toTokens = TOKENS_BY_CHAIN[toChainId] ?? [];

  const [fromToken, setFromToken] = useState<XToken>(() => fromTokens[0]!);
  const [toToken, setToToken] = useState<XToken>(() => {
    return TOKENS_BY_CHAIN[mainnet.id]?.find((t) => t.symbol === "USDC") ?? TOKENS_BY_CHAIN[mainnet.id]![0]!;
  });
  const [amount, setAmount] = useState<string>("");

  const [lifiQuote, setLifiQuote] = useState<LiFiQuote | null>(null);
  const [lifiLoading, setLifiLoading] = useState(false);
  const [lifiError, setLifiError] = useState<string | null>(null);
  const [lifiAllowance, setLifiAllowance] = useState<bigint | null>(null);

  const [step, setStep] = useState<"idle" | "approving" | "sending_fee" | "waiting_fee" | "bridging" | "waiting_bridge">("idle");
  const [feeTxHash, setFeeTxHash] = useState<`0x${string}` | undefined>();
  const [bridgeTxHash, setBridgeTxHash] = useState<`0x${string}` | undefined>();
  const bridgeExecRef = useRef<(() => Promise<void>) | null>(null);

  const publicClient = usePublicClient({ chainId: fromChainId });

  const { data: feeTxReceipt }   = useWaitForTransactionReceipt({ hash: feeTxHash,   query: { enabled: !!feeTxHash   } });
  const { data: bridgeTxReceipt } = useWaitForTransactionReceipt({ hash: bridgeTxHash, query: { enabled: !!bridgeTxHash } });

  // ── Reset tokens when chains change ──────────────────────────────────────
  useEffect(() => {
    const tokens = TOKENS_BY_CHAIN[fromChainId] ?? [];
    setFromToken(tokens[0]!);
  }, [fromChainId]);

  useEffect(() => {
    const tokens = TOKENS_BY_CHAIN[toChainId] ?? [];
    setToToken(tokens.find((t) => t.symbol === "USDC") ?? tokens[0]!);
    setLifiQuote(null);
    setLifiError(null);
  }, [toChainId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const amountBig = useMemo(() => {
    if (!amount || Number(amount) === 0) return null;
    try { return parseUnits(amount, fromToken.decimals); } catch { return null; }
  }, [amount, fromToken.decimals]);

  const houseFeeAmountBig = amountBig != null ? amountBig / 100n : null;
  const bridgeAmountBig   = amountBig != null && houseFeeAmountBig != null ? amountBig - houseFeeAmountBig : null;
  const houseFeeDisplay   = amountBig ? formatCompactNumber(parseFloat(formatUnits(houseFeeAmountBig!, fromToken.decimals)), 6) : null;

  const fromContractAddress = useMemo((): `0x${string}` | undefined =>
    !isNativeToken(fromToken.address) ? fromToken.address as `0x${string}` : undefined
  , [fromToken.address]);

  // ── Balance ───────────────────────────────────────────────────────────────
  const { data: tokenBalance } = useBalance({
    address,
    chainId: fromChainId,
    token: fromContractAddress,
    query: { enabled: isConnected && !!address, refetchInterval: 12_000 },
  });

  const insufficientBalance = amountBig != null && tokenBalance != null && amountBig > tokenBalance.value;

  // ── LiFi quote ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bridgeAmountBig || fromChainId === toChainId) {
      setLifiQuote(null);
      setLifiError(null);
      return;
    }
    const quoteAddr = address ?? DUMMY_ADDRESS;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLifiLoading(true);
      setLifiError(null);
      const params = new URLSearchParams({
        fromChain:   String(fromChainId),
        toChain:     String(toChainId),
        fromToken:   fromToken.address,
        toToken:     toToken.address,
        fromAmount:  bridgeAmountBig.toString(),
        fromAddress: quoteAddr,
      });
      fetch(apiUrl(`/api/bridge/quote?${params}`))
        .then((r) => r.json())
        .then((data: any) => {
          if (cancelled) return;
          if (data?.transactionRequest) {
            setLifiQuote(data as LiFiQuote);
            setLifiError(null);
          } else {
            setLifiError(data?.message ?? "No route found for this pair");
            setLifiQuote(null);
          }
        })
        .catch(() => { if (!cancelled) setLifiError("Failed to fetch quote"); })
        .finally(() => { if (!cancelled) setLifiLoading(false); });
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [bridgeAmountBig?.toString(), fromChainId, toChainId, fromToken.address, toToken.address, address]);

  // ── Allowance check ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!lifiQuote?.approvalAddress || !address || !fromContractAddress || !publicClient) {
      setLifiAllowance(null);
      return;
    }
    publicClient
      .readContract({ address: fromContractAddress, abi: SIMPLE_TRANSFER_ABI, functionName: "allowance", args: [address, lifiQuote.approvalAddress] })
      .then((v) => setLifiAllowance(v as bigint))
      .catch(() => setLifiAllowance(null));
  }, [lifiQuote?.approvalAddress, address, fromContractAddress, publicClient]);

  // ── Tx receipts ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!feeTxReceipt) return;
    if (feeTxReceipt.status === "success") {
      const exec = bridgeExecRef.current;
      setStep("bridging");
      if (exec) exec().catch(() => setStep("idle"));
    } else {
      showToast({ kind: "error", title: "Fee transfer failed" });
      setStep("idle");
    }
    setFeeTxHash(undefined);
  }, [feeTxReceipt]);

  useEffect(() => {
    if (!bridgeTxReceipt) return;
    if (bridgeTxReceipt.status === "success") {
      showToast({
        kind: "success",
        title: "Swap submitted!",
        message: `Swapping ${fromToken.symbol} on ${getChainName(fromChainId)} → ${toToken.symbol} on ${getChainName(toChainId)}. Usually 1–5 min.`,
        txHash: bridgeTxReceipt.transactionHash,
        chainId: fromChainId,
      });
      const toAmt = lifiQuote ? formatCompactNumber(parseFloat(formatUnits(BigInt(lifiQuote.estimate.toAmount), toToken.decimals)), 6) : "?";
      saveTransaction({
        hash: bridgeTxReceipt.transactionHash,
        chainId: fromChainId,
        chain: getChainName(fromChainId),
        sellToken: fromToken.symbol,
        buyToken: toToken.symbol,
        sellAmount: amount,
        buyAmount: toAmt,
        status: "success",
        timestamp: Date.now(),
      });
      setAmount("");
    } else {
      showToast({ kind: "error", title: "Cross-chain swap failed" });
    }
    setStep("idle");
    setBridgeTxHash(undefined);
  }, [bridgeTxReceipt]);

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!fromContractAddress || !lifiQuote?.approvalAddress || !publicClient || !address) return;
    setStep("approving");
    try {
      await writeContractAsync({ address: fromContractAddress, abi: SIMPLE_TRANSFER_ABI, functionName: "approve", args: [lifiQuote.approvalAddress, maxUint256], chainId: fromChainId });
      showToast({ kind: "success", title: "Approved!", message: "Now click Swap to continue." });
      const val = await publicClient.readContract({ address: fromContractAddress, abi: SIMPLE_TRANSFER_ABI, functionName: "allowance", args: [address, lifiQuote.approvalAddress] }) as bigint;
      setLifiAllowance(val);
    } catch (e: any) {
      if (!e?.message?.includes("User rejected")) showToast({ kind: "error", title: "Approval failed", message: e?.shortMessage ?? String(e) });
    } finally { setStep("idle"); }
  }, [fromContractAddress, lifiQuote, publicClient, address, fromChainId, writeContractAsync, showToast]);

  // ── Execute LiFi tx ──────────────────────────────────────────────────────
  const executeLiFi = useCallback(async () => {
    if (!lifiQuote || !address) return;
    const { to, data, value, gasLimit } = lifiQuote.transactionRequest;
    try {
      const hash = await sendTransactionAsync({ to, data, value: value ? BigInt(value) : 0n, gas: gasLimit ? BigInt(gasLimit) : undefined, chainId: fromChainId });
      setBridgeTxHash(hash);
      setStep("waiting_bridge");
      showToast({ kind: "info", title: "Swap tx submitted", message: "Confirming on-chain…", txHash: hash, chainId: fromChainId });
    } catch (e: any) {
      if (!e?.message?.includes("User rejected")) showToast({ kind: "error", title: "Swap failed", message: e?.shortMessage ?? String(e) });
      setStep("idle");
    }
  }, [lifiQuote, address, fromChainId, sendTransactionAsync, showToast]);

  // ── Main handler ─────────────────────────────────────────────────────────
  const handleSwap = useCallback(async () => {
    if (!address || !bridgeAmountBig || !houseFeeAmountBig) return;
    bridgeExecRef.current = executeLiFi;
    try {
      if (isNativeToken(fromToken.address)) {
        setStep("sending_fee");
        const feeHash = await sendTransactionAsync({ to: HOUSE_WALLET, value: houseFeeAmountBig, chainId: fromChainId });
        setFeeTxHash(feeHash);
        setStep("waiting_fee");
        showToast({ kind: "info", title: "Step 1/2: Fee sent", message: "Waiting for confirmation…", txHash: feeHash, chainId: fromChainId });
      } else {
        if (!fromContractAddress) return;
        setStep("sending_fee");
        const feeHash = await writeContractAsync({ address: fromContractAddress, abi: SIMPLE_TRANSFER_ABI, functionName: "transfer", args: [HOUSE_WALLET, houseFeeAmountBig], chainId: fromChainId });
        setFeeTxHash(feeHash);
        setStep("waiting_fee");
        showToast({ kind: "info", title: "Step 1/2: Fee sent", message: "Waiting for confirmation…", txHash: feeHash, chainId: fromChainId });
      }
    } catch (e: any) {
      if (!e?.message?.includes("User rejected")) showToast({ kind: "error", title: "Fee transfer failed", message: e?.shortMessage ?? String(e) });
      setStep("idle");
    }
  }, [address, bridgeAmountBig, houseFeeAmountBig, fromToken.address, fromContractAddress, fromChainId, executeLiFi, sendTransactionAsync, writeContractAsync, showToast]);

  // ── Derived UI flags ─────────────────────────────────────────────────────
  const isBusy = step !== "idle";
  const walletOnCorrectChain = chainId === fromChainId;
  const needsApproval = !isNativeToken(fromToken.address) && !!lifiQuote?.approvalAddress && lifiAllowance != null && bridgeAmountBig != null && lifiAllowance < bridgeAmountBig;
  const quoteReady = !!lifiQuote;
  const sameChain = fromChainId === toChainId;

  const toAmountDisplay = useMemo(() => {
    if (!lifiQuote) return null;
    const { toAmount, toAmountMin } = lifiQuote.estimate;
    return {
      out: formatCompactNumber(parseFloat(formatUnits(BigInt(toAmount), toToken.decimals)), 6),
      min: formatCompactNumber(parseFloat(formatUnits(BigInt(toAmountMin), toToken.decimals)), 6),
    };
  }, [lifiQuote, toToken.decimals]);

  const lifiTotalFee = useMemo(() => {
    if (!lifiQuote?.estimate.feeCosts?.length) return null;
    return lifiQuote.estimate.feeCosts.map((f) => `${formatCompactNumber(parseFloat(formatUnits(BigInt(f.amount), f.token.decimals)), 4)} ${f.token.symbol}`).join(" + ");
  }, [lifiQuote]);

  const lifiGasCosts = useMemo(() => {
    if (!lifiQuote?.estimate.gasCosts?.length) return null;
    return lifiQuote.estimate.gasCosts
      .map((g) => `~${formatCompactNumber(parseFloat(formatUnits(BigInt(g.amount), g.token.decimals)), 5)} ${g.token.symbol}`)
      .join(" + ");
  }, [lifiQuote]);

  const lifiDuration = lifiQuote ? Math.ceil(lifiQuote.estimate.executionDuration / 60) : null;

  const btnLabel = useMemo(() => {
    if (!isConnected) return "Connect wallet";
    if (!walletOnCorrectChain) return `Switch to ${getChainName(fromChainId)}`;
    if (!amountBig || Number(amount) === 0) return "Enter amount";
    if (sameChain) return "Select different chains";
    if (insufficientBalance) return "Insufficient balance";
    if (lifiLoading) return "Getting quote…";
    if (lifiError) return "No route found";
    if (!quoteReady) return "Waiting for quote…";
    if (isBusy) {
      if (step === "approving") return `Approving ${fromToken.symbol}…`;
      if (step === "sending_fee" || step === "waiting_fee") return "Step 1/2: Fee transfer…";
      return "Step 2/2: Swapping…";
    }
    if (needsApproval) return `Approve ${fromToken.symbol}`;
    return `Swap ${fromToken.symbol} → ${toToken.symbol}`;
  }, [isConnected, walletOnCorrectChain, amountBig, amount, sameChain, insufficientBalance, lifiLoading, lifiError, quoteReady, isBusy, step, needsApproval, fromToken.symbol, toToken.symbol, fromChainId]);

  const btnDisabled =
    !isConnected || !walletOnCorrectChain || !amountBig || sameChain ||
    insufficientBalance || lifiLoading || !!lifiError || (!quoteReady && !needsApproval) ||
    isBusy;

  const handleClick = () => {
    if (!isConnected) return;
    if (!walletOnCorrectChain) { switchChainAsync({ chainId: fromChainId }).catch(() => {}); return; }
    if (needsApproval) { handleApprove(); return; }
    handleSwap();
  };

  // ── Flip chains/tokens ────────────────────────────────────────────────────
  const handleFlip = () => {
    const prevFrom = fromChainId, prevTo = toChainId;
    const prevFromTok = fromToken, prevToTok = toToken;
    setFromChainId(prevTo);
    setToChainId(prevFrom);
    const newFromTokens = TOKENS_BY_CHAIN[prevTo] ?? [];
    const matched = newFromTokens.find((t) => t.symbol === prevToTok.symbol);
    setFromToken(matched ?? newFromTokens[0]!);
    const newToTokens = TOKENS_BY_CHAIN[prevFrom] ?? [];
    const matchedTo = newToTokens.find((t) => t.symbol === prevFromTok.symbol);
    setToToken(matchedTo ?? newToTokens[0]!);
    setLifiQuote(null);
    setLifiError(null);
  };

  return (
    <div className="space-y-3">
      {/* ── From ────────────────────────────────────────────────────── */}
      <div className="hoj-panel rounded-3xl p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">From chain</p>
        <div className="flex flex-wrap gap-2">
          {ALL_CHAINS.map((c) => (
            <button key={c.id} type="button" onClick={() => setFromChainId(c.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${fromChainId === c.id ? "bg-[rgba(212,175,55,0.95)] text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_11.875rem] gap-3 items-start">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">You pay</div>
            <input
              inputMode="decimal" placeholder="0.0" value={amount}
              onChange={(e) => {
                const v = e.target.value.replaceAll(",", ".");
                if (!isValidNumberInput(v)) return;
                setAmount(clampToDecimals(v, fromToken.decimals));
              }}
              className="hoj-input mt-2 w-full min-w-0 bg-transparent text-2xl text-white outline-none placeholder:text-white/25"
            />
            {tokenBalance && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-white/45">
                <span>Balance: {formatCompactNumber(parseFloat(formatUnits(tokenBalance.value, tokenBalance.decimals)), 6)} {fromToken.symbol}</span>
                {tokenBalance.value > 0n && (
                  <>{" · "}<button type="button"
                    onClick={() => setAmount(clampToDecimals(formatUnits(tokenBalance.value, tokenBalance.decimals), fromToken.decimals))}
                    className="font-semibold uppercase tracking-wider text-[rgba(212,175,55,0.95)] underline-offset-2 hover:underline">
                    Max
                  </button></>
                )}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">Token</div>
            <div className="relative mt-2 w-full">
              <select
                className="w-full appearance-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 pr-10 text-sm text-white outline-none hover:border-[rgba(212,175,55,0.25)] focus:border-[rgba(212,175,55,0.45)]"
                value={fromToken.symbol}
                onChange={(e) => {
                  const t = fromTokens.find((x) => x.symbol === e.target.value);
                  if (t) { setFromToken(t); setLifiQuote(null); }
                }}
              >
                {fromTokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">▾</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flip button ─────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <button type="button" onClick={handleFlip}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,175,55,0.25)] bg-black/40 text-[rgba(212,175,55,0.8)] transition hover:bg-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.5)]">
          ⇅
        </button>
      </div>

      {/* ── To ──────────────────────────────────────────────────────── */}
      <div className="hoj-panel rounded-3xl p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">To chain</p>
        <div className="flex flex-wrap gap-2">
          {ALL_CHAINS.map((c) => (
            <button key={c.id} type="button" onClick={() => setToChainId(c.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${toChainId === c.id ? "bg-[rgba(212,175,55,0.95)] text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_11.875rem] gap-3 items-start">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">You receive</div>
            <div className="mt-2 min-h-[2.75rem] flex items-center">
              {lifiLoading ? (
                <span className="text-2xl text-white/25 animate-pulse">—</span>
              ) : toAmountDisplay ? (
                <span className="text-2xl font-semibold text-white">{toAmountDisplay.out}</span>
              ) : (
                <span className="text-2xl text-white/25">—</span>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">Token</div>
            <div className="relative mt-2 w-full">
              <select
                className="w-full appearance-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 pr-10 text-sm text-white outline-none hover:border-[rgba(212,175,55,0.25)] focus:border-[rgba(212,175,55,0.45)]"
                value={toToken.symbol}
                onChange={(e) => {
                  const t = toTokens.find((x) => x.symbol === e.target.value);
                  if (t) { setToToken(t); setLifiQuote(null); }
                }}
              >
                {toTokens.map((t) => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">▾</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quote breakdown ─────────────────────────────────────────── */}
      {Number(amount) > 0 && (
        <div className="hoj-panel rounded-2xl p-4 space-y-2 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-white/50">You send</span>
            <span className="font-mono text-white/90">{amount} {fromToken.symbol}</span>
          </div>
          <div className="flex items-center justify-between text-amber-200/80">
            <span>House fee (1%)</span>
            <span className="font-mono">−{houseFeeDisplay} {fromToken.symbol}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-white/70 font-medium">
            <span>Route</span>
            <span className="font-mono text-white/50">
              {getChainName(fromChainId)} → {getChainName(toChainId)}
            </span>
          </div>

          {lifiLoading && (
            <div className="flex items-center justify-between text-white/40">
              <span>Quote</span><span>finding best route…</span>
            </div>
          )}
          {lifiError && !lifiLoading && (
            <div className="text-red-300/80 text-[11px] pt-1">{lifiError}</div>
          )}
          {toAmountDisplay && !lifiLoading && (
            <>
              <div className="flex items-center justify-between text-[rgba(212,175,55,0.9)] font-semibold">
                <span>You receive on {getChainName(toChainId)}</span>
                <span className="font-mono">~{toAmountDisplay.out} {toToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between text-white/40 text-[11px]">
                <span>Minimum received</span>
                <span className="font-mono">{toAmountDisplay.min} {toToken.symbol}</span>
              </div>
              {lifiGasCosts && (
                <div className="flex items-center justify-between text-white/40 text-[11px]">
                  <span>Est. network fee</span><span className="font-mono">{lifiGasCosts}</span>
                </div>
              )}
              {lifiTotalFee && (
                <div className="flex items-center justify-between text-white/40 text-[11px]">
                  <span>Bridge fee</span><span className="font-mono">{lifiTotalFee}</span>
                </div>
              )}
              {lifiDuration && (
                <div className="flex items-center justify-between text-white/35 text-[11px]">
                  <span>Est. arrival</span><span>~{lifiDuration} min</span>
                </div>
              )}
              <div className="flex items-center justify-between text-white/30 text-[11px]">
                <span>Powered by</span><span>Li.Fi</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-white/30 text-[11px]">
            <span>Slippage tolerance</span><span>0.5%</span>
          </div>
        </div>
      )}

      {/* ── Same chain warning ──────────────────────────────────────── */}
      {sameChain && (
        <div className="hoj-panel rounded-2xl p-4 text-[12px] text-amber-200/70">
          Select different source and destination chains for cross-chain swap. Use the <strong className="text-amber-200">Swap</strong> tab for same-chain token swaps.
        </div>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <button
        type="button"
        disabled={btnDisabled}
        onClick={handleClick}
        className="w-full rounded-3xl py-4 text-base font-bold transition disabled:opacity-40 disabled:cursor-not-allowed bg-[rgba(212,175,55,0.95)] text-black hover:bg-[rgba(212,175,55,1)] disabled:bg-white/10 disabled:text-white/40"
      >
        {btnLabel}
      </button>
    </div>
  );
}
