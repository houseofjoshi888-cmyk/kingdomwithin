import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useAccount,
    useBalance,
    useChainId,
    useSendTransaction,
    useSwitchChain,
    useWaitForTransactionReceipt,
    useWriteContract,
} from "wagmi";
import { parseUnits, maxUint256, formatUnits } from "viem";
import { base, mainnet } from "wagmi/chains";
import { cronos, xrp, getChainName } from "@/lib/chains";
import { clampToDecimals, formatSwapAmountDisplay, isValidNumberInput } from "@/lib/format";
import { tokenTo0xParam, type QuoteResponse, type PriceResponse } from "@/lib/quote";
import { erc20Abi } from "@/lib/erc20";
import { defaultBuyForChain, defaultSellForChain, isNative, tokenDecimals, tokensForChain, type Token } from "@/lib/tokens";
import { effectiveSlippageBps, isSameToken, otherToken } from "@/lib/swap-utils";
import { loadSlippageBps } from "@/components/SlippageSettings";
import { SwapShowMore } from "@/components/SwapShowMore";
import { TokenBalance } from "@/components/TokenBalance";
import { TokenSelect } from "@/components/TokenSelect";
import { TransactionsPanel } from "@/components/TransactionsPanel";
import { BridgeTab } from "@/components/BridgeTab";
import { useToast } from "@/components/Toast";
import { saveTransaction } from "@/lib/transactions";
import { useNativeTokenPrice, getNativeSymbol, formatNetworkFee } from "@/lib/gas";

const DEBOUNCE_MS = 750;
type ActiveTab = "swap" | "bridge" | "transactions";
type ApiKeyError = "api_key_missing" | "api_key_invalid" | null;

export function SwapCard() {
    const { showToast } = useToast();
    const chainId = useChainId();
    const { address, isConnected } = useAccount();
    const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

    const [selectedChainId, setSelectedChainId] = useState<number>(base.id);
    const [activeTab, setActiveTab] = useState<ActiveTab>("swap");
    const [apiKeyError, setApiKeyError] = useState<ApiKeyError>(null);

    const availableTokens = useMemo(() => tokensForChain(selectedChainId), [selectedChainId]);

    const [sellToken, setSellToken] = useState<Token>(() => defaultSellForChain(base.id));
    const [buyToken, setBuyToken] = useState<Token>(() => defaultBuyForChain(base.id));
    const [slippageBps, setSlippageBps] = useState<number>(loadSlippageBps);
    const [sellAmountInput, setSellAmountInput] = useState<string>("");

    const [quote, setQuote] = useState<QuoteResponse | null>(null);
    const [price, setPrice] = useState<PriceResponse | null>(null);
    const [isQuoting, setIsQuoting] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    const [sellDecimals, setSellDecimals] = useState<number | null>(null);
    const [buyDecimals, setBuyDecimals] = useState<number | null>(null);
    const [txHistoryVersion, setTxHistoryVersion] = useState(0);

    const quoteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const quoteAbort = useRef<AbortController | null>(null);

    const walletOnSelectedChain = chainId === selectedChainId;
    const needsCorrectChain = isConnected && !walletOnSelectedChain;
    const selectedChainName = getChainName(selectedChainId);

    function pickChain(newChainId: number) {
        setSelectedChainId(newChainId);
        setSellToken(defaultSellForChain(newChainId));
        setBuyToken(defaultBuyForChain(newChainId));
        setSellAmountInput("");
        setQuote(null);
        setPrice(null);
        setQuoteError(null);
    }

    const onSellTokenChange = useCallback(
        (next: Token) => {
            setSellToken(next);
            if (isSameToken(next, buyToken)) setBuyToken(otherToken(next, buyToken, availableTokens));
            setSellAmountInput("");
            setQuote(null);
            setPrice(null);
            setQuoteError(null);
        },
        [buyToken, availableTokens],
    );

    const onBuyTokenChange = useCallback(
        (next: Token) => {
            setBuyToken(next);
            if (isSameToken(next, sellToken)) setSellToken(otherToken(next, sellToken, availableTokens));
            setQuote(null);
            setPrice(null);
            setQuoteError(null);
        },
        [sellToken, availableTokens],
    );

    function flipTokens() {
        setSellToken(buyToken);
        setBuyToken(sellToken);
        setSellAmountInput("");
        setQuote(null);
        setPrice(null);
        setQuoteError(null);
    }

    const { data: sellBalanceData } = useBalance({
        address,
        token: isNative(sellToken) ? undefined : sellToken.address,
        chainId: selectedChainId,
        query: { enabled: isConnected && !!address && walletOnSelectedChain, refetchInterval: 12_000 },
    });

    function setMaxAmount() {
        if (!sellBalanceData) return;
        const maxRaw = sellBalanceData.value;
        if (maxRaw === 0n) return;
        const dec = sellBalanceData.decimals;
        const str = (Number(maxRaw) / 10 ** dec).toFixed(dec > 8 ? 8 : dec);
        setSellAmountInput(str);
    }

    const insufficientBalance = useMemo(() => {
        if (!sellAmountInput || !sellBalanceData || !walletOnSelectedChain) return false;
        const dec = sellBalanceData.decimals;
        try {
            const input = parseUnits(sellAmountInput, dec);
            return input > sellBalanceData.value;
        } catch {
            return false;
        }
    }, [sellAmountInput, sellBalanceData, walletOnSelectedChain]);

    async function fetchDecimals(token: Token): Promise<number | null> {
        if (isNative(token)) return 18;
        if (token.decimals != null) return token.decimals;
        try {
            const res = await fetch("/api/token-decimals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokenAddress: token.address, chainId: token.chainId }),
            });
            if (!res.ok) return null;
            const data = (await res.json()) as { decimals: number };
            return data.decimals ?? null;
        } catch {
            return null;
        }
    }

    useEffect(() => {
        let cancelled = false;
        fetchDecimals(sellToken).then((d) => { if (!cancelled) setSellDecimals(d); });
        fetchDecimals(buyToken).then((d) => { if (!cancelled) setBuyDecimals(d); });
        return () => { cancelled = true; };
    }, [sellToken, buyToken]);

    useEffect(() => {
        if (quoteDebounce.current) clearTimeout(quoteDebounce.current);
        if (!sellAmountInput || Number(sellAmountInput) === 0) {
            setQuote(null);
            setPrice(null);
            setIsQuoting(false);
            setQuoteError(null);
            return;
        }
        setIsQuoting(true);
        quoteDebounce.current = setTimeout(async () => {
            if (quoteAbort.current) quoteAbort.current.abort();
            quoteAbort.current = new AbortController();
            const signal = quoteAbort.current.signal;
            setQuoteError(null);
            setApiKeyError(null);
            const dec = sellDecimals ?? tokenDecimals(sellToken);
            let sellAmountBig: bigint;
            try {
                sellAmountBig = parseUnits(sellAmountInput, dec);
            } catch {
                setIsQuoting(false);
                setQuoteError("Invalid amount");
                return;
            }
            const effectiveBps = effectiveSlippageBps(sellToken, buyToken, slippageBps);
            const body = {
                sellToken: tokenTo0xParam(sellToken),
                buyToken: tokenTo0xParam(buyToken),
                sellAmount: sellAmountBig.toString(),
                chainId: selectedChainId,
                slippageBps: effectiveBps,
                taker: isConnected ? address : undefined,
            };
            try {
                const fetchOpts = (b: object) => ({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(b),
                    signal,
                });

                if (!isConnected) {
                    const priceRes = await fetch("/api/price", fetchOpts(body));
                    const priceData = await priceRes.json().catch(() => null) as PriceResponse | null;
                    setApiKeyError(null);
                    setQuote(null);
                    if (priceRes.status === 503) {
                        const err = (priceData as any)?.error as string;
                        if (err === "api_key_missing") setApiKeyError("api_key_missing");
                        else if (err === "api_key_invalid") setApiKeyError("api_key_invalid");
                        setPrice(null);
                    } else if (!priceRes.ok || !priceData) {
                        setQuoteError((priceData as any)?.reason ?? (priceData as any)?.error ?? "Failed to fetch price");
                        setPrice(null);
                    } else {
                        setQuoteError(null);
                        setPrice(priceData);
                    }
                } else {
                    const [quoteRes, priceRes] = await Promise.all([
                        fetch("/api/quote", fetchOpts(body)),
                        fetch("/api/price", fetchOpts(body)),
                    ]);

                    const [quoteData, priceData] = (await Promise.all([
                        quoteRes.json().catch(() => null),
                        priceRes.json().catch(() => null),
                    ])) as [QuoteResponse & { error?: string; reason?: string } | null, PriceResponse | null];

                    if (quoteRes.status === 503) {
                        const err = (quoteData as any)?.error as string;
                        if (err === "api_key_missing") setApiKeyError("api_key_missing");
                        else if (err === "api_key_invalid") setApiKeyError("api_key_invalid");
                        setQuoteError(null);
                        setQuote(null);
                        setPrice(null);
                    } else if (!quoteRes.ok) {
                        setApiKeyError(null);
                        setQuoteError(
                            (quoteData as any)?.reason ?? (quoteData as any)?.error ?? quoteRes.statusText ?? "Failed to fetch quote",
                        );
                        setQuote(null);
                        setPrice(null);
                    } else if (!quoteData) {
                        setApiKeyError(null);
                        setQuoteError("Failed to parse quote response");
                        setQuote(null);
                        setPrice(null);
                    } else {
                        setApiKeyError(null);
                        setQuote(quoteData);
                        setQuoteError(null);
                        setPrice(priceRes.ok ? priceData : null);
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === "AbortError") return;
                console.error("Quote fetch error:", err);
                setQuoteError("Network error — please try again");
                setQuote(null);
                setPrice(null);
            } finally {
                setIsQuoting(false);
            }
        }, DEBOUNCE_MS);
        return () => { if (quoteDebounce.current) clearTimeout(quoteDebounce.current); };
    }, [sellAmountInput, sellToken, buyToken, selectedChainId, slippageBps, sellDecimals, isConnected, address]);

    const buyAmountRaw = useMemo(() => {
        const raw = quote?.buyAmount ?? price?.buyAmount;
        if (raw == null || raw === "") return null;
        try {
            const decimals = buyDecimals ?? tokenDecimals(buyToken);
            return formatUnits(BigInt(String(raw)), decimals);
        } catch {
            return null;
        }
    }, [quote?.buyAmount, price?.buyAmount, buyToken, buyDecimals]);

    const buyAmountFormatted = useMemo(() => {
        if (buyAmountRaw == null || buyAmountRaw === "") return null;
        try {
            return formatSwapAmountDisplay(buyAmountRaw);
        } catch {
            return buyAmountRaw;
        }
    }, [buyAmountRaw]);

    const minBuyFormatted = useMemo(() => {
        if (!quote?.minBuyAmount) return null;

        try {
            const decimals = buyDecimals ?? tokenDecimals(buyToken);

            const formatted = formatUnits(
                BigInt(String(quote.minBuyAmount)),
                decimals
            );

            return `${formatSwapAmountDisplay(formatted)} ${buyToken.symbol}`;
        } catch (error) {
            console.error("[DEBUG] Failed to format minBuyAmount:", error);
            return null;
        }
    }, [quote?.minBuyAmount, buyToken, buyDecimals]);

    const needsApproval = useMemo(() => {
        if (!quote?.issues?.allowance || isNative(sellToken)) return false;
        try {
            const { actual, expected } = quote.issues.allowance;
            return BigInt(actual) < BigInt(expected);
        } catch {
            return false;
        }
    }, [quote?.issues?.allowance, sellToken]);

    const spender = quote?.issues?.allowance?.spender;
    const { writeContractAsync: approveAsync } = useWriteContract();
    const { sendTransactionAsync } = useSendTransaction();
    const [swapTxHash, setSwapTxHash] = useState<`0x${string}` | undefined>();
    const [isSwapping, setIsSwapping] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const { data: txReceipt } = useWaitForTransactionReceipt({
        hash: swapTxHash,
        query: { enabled: !!swapTxHash },
    });

    useEffect(() => {
        if (!txReceipt) return;
        const success = txReceipt.status === "success";
        showToast({
            kind: success ? "success" : "error",
            title: success ? "Swap complete!" : "Swap reverted",
            txHash: txReceipt.transactionHash,
            chainId: selectedChainId,
        });
        saveTransaction({
            hash: txReceipt.transactionHash,
            chainId: selectedChainId,
            chain: getChainName(selectedChainId),
            sellToken: sellToken.symbol,
            buyToken: buyToken.symbol,
            sellAmount: sellAmountInput,
            buyAmount: buyAmountRaw ?? "?",
            status: success ? "success" : "failed",
            timestamp: Date.now(),
        });
        if (success) {
            setTxHistoryVersion((v) => v + 1);
            setSellAmountInput("");
            setQuote(null);
            setPrice(null);
        }
        setSwapTxHash(undefined);
    }, [txReceipt]);

    async function approve() {
        if (!sellToken.address || !spender) return;
        setIsApproving(true);
        try {
            await approveAsync({
                address: sellToken.address,
                abi: erc20Abi,
                functionName: "approve",
                args: [spender, maxUint256],
                chainId: selectedChainId,
            });
            showToast({ kind: "success", title: "Approval sent", message: "Now you can swap." });
        } catch (e: any) {
            if (!e?.message?.includes("User rejected"))
                showToast({ kind: "error", title: "Approval failed", message: e?.shortMessage ?? e?.message ?? String(e) });
        } finally {
            setIsApproving(false);
        }
    }

    async function swap() {
        if (!quote?.transaction) return;
        setIsSwapping(true);
        try {
            const { to, data, value, gas } = quote.transaction;
            const txHash = await sendTransactionAsync({
                to,
                data,
                value: value ? BigInt(value) : 0n,
                gas: gas ? BigInt(gas) : undefined,
                chainId: selectedChainId,
            });
            setSwapTxHash(txHash);
            showToast({ kind: "info", title: "Swap submitted", message: "Waiting for confirmation…", txHash, chainId: selectedChainId });
        } catch (e: any) {
            if (!e?.message?.includes("User rejected"))
                showToast({ kind: "error", title: "Swap failed", message: e?.shortMessage ?? e?.message ?? String(e) });
        } finally {
            setIsSwapping(false);
        }
    }

    const primaryLabel = useMemo(() => {
        if (!sellAmountInput || Number(sellAmountInput) === 0) return "Enter amount";
        if (isQuoting) return "Getting quote…";
        if (isApproving) return "Approving…";
        if (isSwapping || swapTxHash) return "Swapping…";
        if (needsApproval) return `Approve ${sellToken.symbol}`;
        if (!quote?.transaction) return "Enter amount";
        return `Swap ${sellToken.symbol} → ${buyToken.symbol}`;
    }, [sellAmountInput, isQuoting, isApproving, isSwapping, swapTxHash, needsApproval, sellToken.symbol, buyToken.symbol, quote?.transaction]);

    const primaryDisabled =
        !sellAmountInput || Number(sellAmountInput) === 0 ||
        isQuoting || isApproving || isSwapping || !!swapTxHash ||
        insufficientBalance || (!needsApproval && !quote?.transaction);

    const nativeUsdPrice = useNativeTokenPrice(selectedChainId);
    const nativeSymbol = getNativeSymbol(selectedChainId);
    const gasDisplay = useMemo(() => formatNetworkFee(
        quote?.totalNetworkFee ?? price?.totalNetworkFee,
        quote?.transaction?.gas,
        quote?.transaction?.gasPrice,
        nativeUsdPrice,
        nativeSymbol,
    ), [quote, price, nativeUsdPrice, nativeSymbol]);

    const CHAINS = [
        { id: base.id, label: "Base" },
        { id: mainnet.id, label: "Ethereum" },
        { id: cronos.id, label: "Cronos" },
        { id: xrp.id, label: "XRP" },
    ];

    const TABS: { id: ActiveTab; label: string }[] = [
        { id: "swap", label: "Swap" },
        { id: "bridge", label: "Bridge" },
        { id: "transactions", label: "Transactions" },
    ];

    return (
        <div className="flex flex-col items-center px-4 py-8 sm:py-12">
            <div className="w-full max-w-[480px]">
                <div className="mb-4 text-center">
                    <p className="text-[13px] text-white/50 leading-relaxed">
                        Swap and bridge HOJ community tokens across Ethereum, Base, Cronos, and XRP EVM —
                        best rates from <strong>0x</strong> + <strong>Stargate</strong>.
                    </p>
                    <div className="mt-3 flex justify-center gap-6 text-[11px]">
                        {[
                            { value: "4", label: "Chains" },
                            { value: "10+", label: "Tokens" },
                            { value: "1%", label: "House Fee" },
                            { value: "0x / SG", label: "Powered By" },
                        ].map(({ value, label }) => (
                            <div key={label} className="flex flex-col items-center gap-0.5">
                                <span className="text-base font-bold text-[rgba(212,175,55,0.9)]">{value}</span>
                                <span className="text-white/35">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {apiKeyError && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                        <span className="mt-0.5 shrink-0 text-amber-300">⚠</span>
                        <div className="text-xs leading-relaxed text-amber-200/90">
                            {apiKeyError === "api_key_missing" ? (
                                <>
                                    <strong className="block text-amber-200">0x API key not configured.</strong>
                                    Set the <code className="rounded bg-black/30 px-1">ZEROX_API_KEY</code> environment variable.{" "}
                                    <a href="https://dashboard.0x.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">
                                        Get a free key →
                                    </a>
                                </>
                            ) : (
                                <>
                                    <strong className="block text-amber-200">0x API key invalid or quota exceeded.</strong>
                                    Check your key at{" "}
                                    <a href="https://dashboard.0x.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-100">
                                        dashboard.0x.org
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="hoj-card space-y-3 rounded-3xl p-4 sm:p-6">
                    {/* Chain selector */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {CHAINS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => pickChain(id)}
                                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${selectedChainId === id
                                    ? "bg-[rgba(212,175,55,0.95)] text-black"
                                    : "bg-white/5 text-white/70 hover:bg-white/10"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab selector */}
                    <div className="flex gap-1 rounded-3xl border border-white/10 bg-black/20 p-1">
                        {TABS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                className={`flex-1 rounded-2xl px-3 py-3 text-sm font-semibold capitalize transition ${activeTab === id
                                    ? "bg-[rgba(212,175,55,0.95)] text-black"
                                    : "bg-transparent text-white/70 hover:bg-white/5"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "swap" ? (
                        <>
                            {/* Sell panel */}
                            <div className="hoj-panel rounded-3xl p-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11.875rem] sm:items-start">
                                    <div className="min-w-0 overflow-hidden">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">You pay</div>
                                        <input
                                            inputMode="decimal"
                                            placeholder="0.0"
                                            value={sellAmountInput}
                                            onChange={(e) => {
                                                const nextRaw = e.target.value.replaceAll(",", ".");
                                                if (!isValidNumberInput(nextRaw)) return;
                                                const next = sellDecimals != null ? clampToDecimals(nextRaw, sellDecimals) : nextRaw;
                                                setSellAmountInput(next);
                                            }}
                                            className="hoj-input mt-2 w-full min-w-0 bg-transparent text-2xl text-white outline-none placeholder:text-white/25"
                                        />
                                    </div>
                                    <div className="min-w-0 sm:w-[11.875rem]">
                                        <div className="text-left text-[11px] uppercase tracking-[0.18em] text-white/55">Token</div>
                                        <div className="mt-2">
                                            <TokenSelect tokens={availableTokens} value={sellToken} onChange={onSellTokenChange} />
                                        </div>
                                        <TokenBalance token={sellToken} chainId={selectedChainId} isConnected={isConnected} walletChainId={chainId} onMax={walletOnSelectedChain ? setMaxAmount : undefined} />
                                    </div>
                                </div>
                            </div>

                            {/* Flip */}
                            <button
                                type="button"
                                onClick={flipTokens}
                                className="mx-auto -my-1 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(212,175,55,0.25)] bg-black/35 text-[rgba(212,175,55,0.9)] hover:border-[rgba(212,175,55,0.5)] transition"
                                aria-label="Flip tokens"
                            >
                                ⇅
                            </button>

                            {/* Buy panel */}
                            <div className="hoj-panel rounded-3xl p-4">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11.875rem] sm:items-start">
                                    <div className="min-w-0 overflow-hidden">
                                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">You receive</div>
                                        <div className="mt-2 truncate text-xl font-medium tabular-nums text-white/90 sm:text-2xl" title={buyAmountRaw ?? undefined}>
                                            {(() => {
                                                if (isQuoting) return "…";
                                                if (!sellAmountInput) return "—";
                                                if (Number(sellAmountInput) === 0) return "0";
                                                if ((quote as any)?.liquidityAvailable === false) return "No liquidity";
                                                return buyAmountFormatted ?? "—";
                                            })()}
                                        </div>
                                        {minBuyFormatted && (
                                            <div className="mt-1 truncate text-xs text-white/45" title={minBuyFormatted}>
                                                Min: {minBuyFormatted}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 sm:w-[11.875rem]">
                                        <div className="text-left text-[11px] uppercase tracking-[0.18em] text-white/55">Token</div>
                                        <div className="mt-2">
                                            <TokenSelect tokens={availableTokens} value={buyToken} onChange={onBuyTokenChange} />
                                        </div>
                                        <TokenBalance token={buyToken} chainId={selectedChainId} isConnected={isConnected} walletChainId={chainId} />
                                    </div>
                                </div>
                            </div>

                            {/* Gas estimate row — visible before confirming */}
                            {gasDisplay && (
                                <div className="flex items-center justify-between px-1 text-[11px] text-white/45">
                                    <span>Est. network fee</span>
                                    <span className="font-mono tabular-nums">
                                        {gasDisplay.usd
                                            ? <>{gasDisplay.usd} <span className="text-white/25">({gasDisplay.eth})</span></>
                                            : gasDisplay.eth}
                                    </span>
                                </div>
                            )}

                            <SwapShowMore
                                slippageBps={slippageBps} onSlippageChange={setSlippageBps}
                                quote={quote} price={price}
                                sellToken={sellToken} buyToken={buyToken}
                                sellDecimals={sellDecimals} buyDecimals={buyDecimals}
                                isQuoting={isQuoting}
                                nativeUsdPrice={nativeUsdPrice}
                                nativeSymbol={nativeSymbol}
                            />

                            {!isConnected ? (
                                <div className="hoj-panel rounded-2xl px-4 py-3 text-sm text-white/70">
                                    Connect your wallet to begin.
                                </div>
                            ) : needsCorrectChain ? (
                                <button
                                    type="button"
                                    onClick={() => switchChainAsync({ chainId: selectedChainId })}
                                    disabled={isSwitching}
                                    className="w-full rounded-2xl bg-[rgba(212,175,55,0.95)] px-4 py-3 text-sm font-semibold text-black hover:bg-[rgba(212,175,55,0.85)] disabled:opacity-60 transition"
                                >
                                    {isSwitching ? "Switching…" : `Switch to ${selectedChainName}`}
                                </button>
                            ) : quoteError ? (
                                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {quoteError}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={needsApproval ? approve : swap}
                                    disabled={primaryDisabled}
                                    className="w-full rounded-2xl bg-[rgba(255,222,85,0.98)] px-4 py-3 text-sm font-semibold text-black shadow-[0_12px_25px_-12px_rgba(255,222,85,0.9)] hover:bg-[rgba(255,210,65,0.98)] disabled:opacity-60 transition"
                                >
                                    {primaryLabel}
                                </button>
                            )}

                            {insufficientBalance && walletOnSelectedChain && (
                                <div className="text-center text-xs text-red-300/90">
                                    Amount exceeds your {sellToken.symbol} balance.
                                </div>
                            )}
                        </>
                    ) : activeTab === "bridge" ? (
                        <BridgeTab selectedChainId={selectedChainId} onChainChange={pickChain} />
                    ) : (
                        <TransactionsPanel key={txHistoryVersion} walletAddress={address} selectedChainId={selectedChainId} />
                    )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    {[
                        { icon: "⚡", label: "Best Price", desc: "0x aggregates DEX liquidity for the best rate every time" },
                        { icon: "🛡️", label: "Non-Custodial", desc: "Your wallet, your keys — we never hold your funds" },
                        { icon: "🌐", label: "Multi-Chain", desc: "Swap on Base, Ethereum, Cronos & XRP in one place" },
                    ].map(({ icon, label, desc }) => (
                        <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4 flex flex-col items-center gap-1.5">
                            <span className="text-xl">{icon}</span>
                            <span className="text-[11px] font-semibold text-[rgba(212,175,55,0.9)]">{label}</span>
                            <span className="text-[10px] leading-relaxed text-white/40">{desc}</span>
                        </div>
                    ))}
                </div>

                <p className="mt-4 border-t border-white/8 pt-4 text-center text-[10px] leading-relaxed text-white/35 sm:text-[11px]">
                    Powered by{" "}
                    <a href="https://0x.org" target="_blank" rel="noopener noreferrer" className="text-[rgba(212,175,55,0.6)] hover:text-[rgba(212,175,55,0.9)] transition">
                        0x Protocol
                    </a>
                    {" "}· A 1% house fee applies to all swaps ·{" "}
                    <a href="https://thehouseofjoshi.com/contact" target="_blank" rel="noopener noreferrer" className="text-[rgba(212,175,55,0.6)] hover:text-[rgba(212,175,55,0.9)] transition">
                        Contact
                    </a>
                </p>
            </div>
        </div>
    );
}
