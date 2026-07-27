"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { BrandMark } from "../../BrandMark";
import { SiteFooter } from "../../SiteFooter";
import { WalletButton } from "../../WalletButton";
import { BASE_MAINNET_CHAIN_ID, MALKUTA_ENGINE_ADDRESS } from "../../../lib/network";
import {
  ERC20_STAKING_ABI,
  KING_JOSHI_ADDRESS,
  MALKUTA_STAKING_ABI,
  MALKUTA_STAKING_ADDRESS,
  MALKUTA_STAKING_CONFIGURED,
  STAKING_OWNER_ADDRESS,
} from "../../../lib/staking";

const sameAddress = (a?: string, b?: string) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());

export default function StakingAdmin() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [newRate, setNewRate] = useState("");
  const [status, setStatus] = useState("");
  const enabled = MALKUTA_STAKING_CONFIGURED;

  const { data: owner } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "owner", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: pool, refetch: refetchPool } = useReadContract({ address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "balanceOf", args: [MALKUTA_STAKING_ADDRESS], chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: walletBalance, refetch: refetchWallet } = useReadContract({ address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "balanceOf", args: [address ?? zeroAddress], chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: Boolean(address) } });
  const { data: decimals } = useReadContract({ address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "decimals", chainId: BASE_MAINNET_CHAIN_ID });
  const { data: symbol } = useReadContract({ address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "symbol", chainId: BASE_MAINNET_CHAIN_ID });
  const { data: rate, refetch: refetchRate } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "rewardRatePerDay", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: totalStaked } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "totalStaked", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: reserved } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "totalUnpaidRewards", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: paused, refetch: refetchPaused } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "paused", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: collectionAllowed, refetch: refetchAllowed } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "allowedCollections", args: [MALKUTA_ENGINE_ADDRESS], chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });

  const tokenDecimals = Number(decimals ?? 18);
  const onBase = chainId === BASE_MAINNET_CHAIN_ID;
  const isOwner = sameAddress(address, owner) || (!enabled && sameAddress(address, STAKING_OWNER_ADDRESS));
  const canAdmin = enabled && isConnected && onBase && sameAddress(address, owner) && !isPending;

  useEffect(() => {
    if (rate !== undefined && !newRate) setNewRate(formatUnits(rate, tokenDecimals));
  }, [newRate, rate, tokenDecimals]);

  async function transact(label: string, request: Parameters<typeof writeContractAsync>[0]) {
    if (!publicClient) return;
    try {
      setStatus(`CONFIRM ${label} IN THE OWNER WALLET…`);
      const hash = await writeContractAsync(request);
      setStatus(`${label} SUBMITTED · WAITING FOR BASE…`);
      await publicClient.waitForTransactionReceipt({ hash });
      await Promise.all([refetchPool(), refetchWallet(), refetchRate(), refetchPaused(), refetchAllowed()]);
      setStatus(`${label} COMPLETE`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message.split("\n")[0] : `${label} FAILED`);
    }
  }

  async function fund(event: FormEvent) {
    event.preventDefault();
    if (!canAdmin || !fundAmount) return;
    await transact("FUNDING", { address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "transfer", args: [MALKUTA_STAKING_ADDRESS, parseUnits(fundAmount, tokenDecimals)], chainId: BASE_MAINNET_CHAIN_ID });
    setFundAmount("");
  }

  async function withdraw(event: FormEvent) {
    event.preventDefault();
    if (!canAdmin || !withdrawAmount || !address) return;
    await transact("WITHDRAWAL", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "withdrawRewardSurplus", args: [address, parseUnits(withdrawAmount, tokenDecimals)], chainId: BASE_MAINNET_CHAIN_ID });
    setWithdrawAmount("");
  }

  const accessLabel = !enabled
    ? "STAKING CONTRACT MUST BE DEPLOYED FIRST"
    : !isConnected
      ? "CONNECT OWNER WALLET"
      : !onBase
        ? "SWITCH TO BASE MAINNET"
        : isOwner
          ? "OWNER VERIFIED"
          : "ACCESS DENIED · THIS WALLET IS NOT THE CONTRACT OWNER";

  return (
    <main className="staking-page staking-admin-page">
      <header className="topbar">
        <Link className="brand" href="/staking"><BrandMark priority /><span><strong>KINGDOM WITHIN</strong><small>STAKING ADMIN</small></span></Link>
        <div className="top-actions"><Link href="/staking">PUBLIC DASHBOARD</Link><WalletButton /></div>
      </header>

      <section className="staking-admin-hero">
        <div><p className="eyebrow"><span>A</span> OWNER CONTROL · BASE</p><h1>Guard the reserve.<br /><em>Fund the reward.</em></h1></div>
        <div className="admin-access"><span className={canAdmin ? "pulse" : ""} />{accessLabel}</div>
      </section>

      {!isOwner && (
        <section className="staking-lock">
          <div className="lock-glyph">◇</div>
          <h2>{isConnected ? "Owner access required." : "Connect the staking owner wallet."}</h2>
          <p>This panel reads the contract’s live <code>owner()</code> value. Transactions are also enforced by the contract itself.</p>
          <WalletButton />
        </section>
      )}

      {isOwner && (
        <>
          <section className="staking-metrics admin-metrics">
            <div><span>CONTRACT RESERVE</span><strong>{pool !== undefined ? Number(formatUnits(pool, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>{symbol ?? "KINGJOSHI"}</small></div>
            <div><span>OWNER WALLET</span><strong>{walletBalance !== undefined ? Number(formatUnits(walletBalance, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>{symbol ?? "KINGJOSHI"}</small></div>
            <div><span>ACTIVE STAKES</span><strong>{totalStaked?.toString() ?? "—"}</strong><small>{paused ? "NEW STAKES PAUSED" : "STAKING OPEN"}</small></div>
            <div><span>RESERVED USER DEBT</span><strong>{reserved !== undefined ? Number(formatUnits(reserved, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>CANNOT BE WITHDRAWN</small></div>
          </section>

          <section className="staking-admin-grid">
            <form onSubmit={fund}>
              <p className="eyebrow"><span>01</span> FUND RESERVE</p>
              <h2>Deposit KINGJOSHI.</h2>
              <p>Transfers reward tokens directly from the connected owner wallet into the staking contract.</p>
              <label htmlFor="fund-amount">AMOUNT · {symbol ?? "KINGJOSHI"}</label>
              <input id="fund-amount" inputMode="decimal" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} placeholder="0.00" />
              <button disabled={!canAdmin || !fundAmount}>FUND STAKING CONTRACT <span>→</span></button>
            </form>

            <form onSubmit={withdraw}>
              <p className="eyebrow"><span>02</span> WITHDRAW SURPLUS</p>
              <h2>Return unused tokens.</h2>
              <p>For user safety, withdrawal is available only when active stakes equal zero. Reserved unpaid rewards remain locked.</p>
              <label htmlFor="withdraw-amount">AMOUNT · {symbol ?? "KINGJOSHI"}</label>
              <input id="withdraw-amount" inputMode="decimal" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="0.00" />
              <button disabled={!canAdmin || !withdrawAmount || totalStaked !== BigInt(0)}>WITHDRAW TO OWNER WALLET <span>→</span></button>
            </form>

            <form onSubmit={(event) => {
              event.preventDefault();
              if (!canAdmin || !newRate) return;
              void transact("RATE UPDATE", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "setRewardRatePerDay", args: [parseUnits(newRate, tokenDecimals)], chainId: BASE_MAINNET_CHAIN_ID });
            }}>
              <p className="eyebrow"><span>03</span> REWARD RATE</p>
              <h2>Set the daily base.</h2>
              <p>The new rate applies only to NFTs staked after the update. Existing stakes keep their original rate.</p>
              <label htmlFor="new-rate">TOKENS PER NFT / DAY · 1×</label>
              <input id="new-rate" inputMode="decimal" value={newRate} onChange={(event) => setNewRate(event.target.value)} placeholder="0.00" />
              <button disabled={!canAdmin || !newRate}>UPDATE REWARD RATE <span>→</span></button>
            </form>

            <div className="staking-switchboard">
              <p className="eyebrow"><span>04</span> PROTOCOL STATE</p>
              <h2>Control admissions.</h2>
              <div><span>MALKUTA COLLECTION</span><b>{collectionAllowed ? "ALLOWED" : "NOT ALLOWED"}</b><button disabled={!canAdmin} onClick={() => void transact("COLLECTION UPDATE", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "setCollectionAllowed", args: [MALKUTA_ENGINE_ADDRESS, !collectionAllowed], chainId: BASE_MAINNET_CHAIN_ID })}>{collectionAllowed ? "DISABLE" : "ENABLE"}</button></div>
              <div><span>NEW STAKES</span><b>{paused ? "PAUSED" : "OPEN"}</b><button disabled={!canAdmin} onClick={() => void transact(paused ? "RESUME" : "PAUSE", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: paused ? "resumeNewStakes" : "pauseNewStakes", chainId: BASE_MAINNET_CHAIN_ID })}>{paused ? "RESUME" : "PAUSE"}</button></div>
            </div>
          </section>
        </>
      )}
      {status && <output className="admin-global-status">{status}</output>}
      <SiteFooter tagline="THE RESERVE IS GUARDED. USER REWARDS REMAIN SOVEREIGN." />
    </main>
  );
}

