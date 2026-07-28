"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { BASE_MAINNET_CHAIN_ID, MALKUTA_ENGINE_ADDRESS } from "../../lib/network";
import {
  ERC20_STAKING_ABI,
  KING_JOSHI_ADDRESS,
  MALKUTA_STAKING_ABI,
  MALKUTA_STAKING_ADDRESS,
  MALKUTA_STAKING_CONFIGURED,
} from "../../lib/staking";

const sameAddress = (a?: string, b?: string) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());

export function StakingAdminControls() {
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
  const isOwner = enabled && sameAddress(address, owner);
  const canAdmin = isOwner && isConnected && onBase && !isPending;

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
    ? "DEPLOY THE STAKING CONTRACT TO ACTIVATE THESE CONTROLS"
    : !isConnected
      ? "CONNECT THE STAKING OWNER WALLET"
      : !onBase
        ? "SWITCH TO BASE MAINNET"
        : isOwner
          ? "STAKING OWNER VERIFIED"
          : "CONNECTED WALLET IS NOT THE STAKING OWNER";

  return (
    <section className="staking-admin-section">
      <div className="staking-admin-title">
        <div>
          <p className="eyebrow"><span>S</span> STAKING CONTROL</p>
          <h2>Guard the reserve.<br /><em>Fund the reward.</em></h2>
        </div>
        <div className="admin-access"><span className={canAdmin ? "pulse" : ""} />{accessLabel}</div>
      </div>

      <div className="staking-admin-summary">
        <div><span>CONTRACT RESERVE</span><strong>{pool !== undefined ? Number(formatUnits(pool, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>{symbol ?? "KINGJOSHI"}</small></div>
        <div><span>OWNER WALLET</span><strong>{walletBalance !== undefined ? Number(formatUnits(walletBalance, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>{symbol ?? "KINGJOSHI"}</small></div>
        <div><span>ACTIVE STAKES</span><strong>{totalStaked?.toString() ?? "—"}</strong><small>{paused ? "NEW STAKES PAUSED" : "STAKING OPEN"}</small></div>
        <div><span>USER REWARD DEBT</span><strong>{reserved !== undefined ? Number(formatUnits(reserved, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>PROTECTED BALANCE</small></div>
      </div>

      {!isOwner && <div className="staking-owner-lock">Only the staking contract’s live <code>owner()</code> wallet can use the controls below. The contract independently enforces every owner-only action.</div>}

      <div className="staking-control-grid">
        <form onSubmit={fund}>
          <span>01 · FUND RESERVE</span><h3>Deposit KINGJOSHI.</h3>
          <p>Transfer reward tokens from the owner wallet into the staking reserve.</p>
          <label htmlFor="admin-staking-fund">AMOUNT · {symbol ?? "KINGJOSHI"}</label>
          <input id="admin-staking-fund" inputMode="decimal" value={fundAmount} onChange={(event) => setFundAmount(event.target.value)} placeholder="0.00" />
          <button disabled={!canAdmin || !fundAmount}>FUND CONTRACT <b>→</b></button>
        </form>

        <form onSubmit={withdraw}>
          <span>02 · WITHDRAW SURPLUS</span><h3>Return unused tokens.</h3>
          <p>Available only with zero active stakes. Unpaid user rewards remain protected.</p>
          <label htmlFor="admin-staking-withdraw">AMOUNT · {symbol ?? "KINGJOSHI"}</label>
          <input id="admin-staking-withdraw" inputMode="decimal" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="0.00" />
          <button disabled={!canAdmin || !withdrawAmount || totalStaked !== BigInt(0)}>WITHDRAW SURPLUS <b>→</b></button>
        </form>

        <form onSubmit={(event) => {
          event.preventDefault();
          if (!canAdmin || !newRate) return;
          void transact("RATE UPDATE", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "setRewardRatePerDay", args: [parseUnits(newRate, tokenDecimals)], chainId: BASE_MAINNET_CHAIN_ID });
        }}>
          <span>03 · REWARD RATE</span><h3>Set the daily base.</h3>
          <p>The new rate applies to future stakes. Existing positions retain their stored rate.</p>
          <label htmlFor="admin-staking-rate">TOKENS PER NFT / DAY · 1×</label>
          <input id="admin-staking-rate" inputMode="decimal" value={newRate} onChange={(event) => setNewRate(event.target.value)} placeholder="0.00" />
          <button disabled={!canAdmin || !newRate}>UPDATE RATE <b>→</b></button>
        </form>

        <div className="staking-state-control">
          <span>04 · PROTOCOL STATE</span><h3>Control admissions.</h3>
          <div><p>MALKUTA COLLECTION <small>{collectionAllowed ? "ALLOWED" : "NOT ALLOWED"}</small></p><button disabled={!canAdmin} onClick={() => void transact("COLLECTION UPDATE", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "setCollectionAllowed", args: [MALKUTA_ENGINE_ADDRESS, !collectionAllowed], chainId: BASE_MAINNET_CHAIN_ID })}>{collectionAllowed ? "DISABLE" : "ENABLE"}</button></div>
          <div><p>NEW STAKES <small>{paused ? "PAUSED" : "OPEN"}</small></p><button disabled={!canAdmin} onClick={() => void transact(paused ? "RESUME" : "PAUSE", { address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: paused ? "resumeNewStakes" : "pauseNewStakes", chainId: BASE_MAINNET_CHAIN_ID })}>{paused ? "RESUME" : "PAUSE"}</button></div>
        </div>
      </div>
      {status && <output className="staking-control-status">{status}</output>}
    </section>
  );
}
