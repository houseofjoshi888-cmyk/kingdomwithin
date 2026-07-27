"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, zeroAddress, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { BrandMark } from "../BrandMark";
import { SiteFooter } from "../SiteFooter";
import { WalletButton } from "../WalletButton";
import { MALKUTA_ENGINE_ABI } from "../../lib/contract";
import {
  BASE_MAINNET_CHAIN_ID,
  MALKUTA_ENGINE_ADDRESS,
  MALKUTA_ENGINE_DEPLOYMENT_BLOCK,
} from "../../lib/network";
import {
  ERC20_STAKING_ABI,
  ERC721_STAKING_ABI,
  KING_JOSHI_ADDRESS,
  MALKUTA_STAKING_ABI,
  MALKUTA_STAKING_ADDRESS,
  MALKUTA_STAKING_CONFIGURED,
} from "../../lib/staking";

const sameAddress = (a?: string, b?: string) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
const compactToken = (value: bigint) => {
  const text = value.toString();
  return text.length > 16 ? `${text.slice(0, 8)}…${text.slice(-6)}` : text;
};

function StakeCard({ tokenId, wallet, tokenDecimals }: { tokenId: bigint; wallet?: Address; tokenDecimals: number }) {
  const publicClient = usePublicClient();
  const [status, setStatus] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();
  const enabled = MALKUTA_STAKING_CONFIGURED && Boolean(wallet);

  const { data: ownerOf, refetch: refetchOwner } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: ERC721_STAKING_ABI,
    functionName: "ownerOf",
    args: [tokenId],
    chainId: BASE_MAINNET_CHAIN_ID,
  });
  const { data: approved, refetch: refetchApproval } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: ERC721_STAKING_ABI,
    functionName: "getApproved",
    args: [tokenId],
    chainId: BASE_MAINNET_CHAIN_ID,
  });
  const { data: stake, refetch: refetchStake } = useReadContract({
    address: MALKUTA_STAKING_ADDRESS,
    abi: MALKUTA_STAKING_ABI,
    functionName: "vault",
    args: [MALKUTA_ENGINE_ADDRESS, tokenId],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled },
  });
  const { data: rewards, refetch: refetchRewards } = useReadContract({
    address: MALKUTA_STAKING_ADDRESS,
    abi: MALKUTA_STAKING_ABI,
    functionName: "calculateRewards",
    args: [MALKUTA_ENGINE_ADDRESS, tokenId],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled },
  });
  const { data: multiplier } = useReadContract({
    address: MALKUTA_STAKING_ADDRESS,
    abi: MALKUTA_STAKING_ABI,
    functionName: "getMultiplier",
    args: [MALKUTA_ENGINE_ADDRESS, tokenId],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled },
  });

  const staker = stake?.[0];
  const isMine = sameAddress(ownerOf, wallet);
  const isStaked = sameAddress(staker, wallet);
  const isApproved = MALKUTA_STAKING_CONFIGURED && sameAddress(approved, MALKUTA_STAKING_ADDRESS);
  const stakedDate = stake?.[1] ? new Date(Number(stake[1]) * 1000).toLocaleDateString() : "—";

  async function transact(label: string, request: Parameters<typeof writeContractAsync>[0]) {
    if (!publicClient) return;
    try {
      setStatus(`CONFIRM ${label} IN YOUR WALLET…`);
      const hash = await writeContractAsync(request);
      setStatus(`${label} SUBMITTED · WAITING FOR BASE…`);
      await publicClient.waitForTransactionReceipt({ hash });
      await Promise.all([refetchOwner(), refetchApproval(), refetchStake(), refetchRewards()]);
      setStatus(`${label} COMPLETE`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message.split("\n")[0] : `${label} FAILED`);
    }
  }

  if (ownerOf && !isMine && !isStaked) return null;

  return (
    <article className={`stake-card ${isStaked ? "is-staked" : ""}`}>
      <div className="stake-sigil"><span>MK</span><i /><i /><i /></div>
      <div className="stake-card-copy">
        <div className="stake-card-title">
          <span>MALKUTA MANDALA</span>
          <b>#{compactToken(tokenId)}</b>
        </div>
        <dl>
          <div><dt>STATUS</dt><dd>{isStaked ? "STAKED" : isMine ? "READY" : "NOT IN WALLET"}</dd></div>
          <div><dt>STAKED SINCE</dt><dd>{stakedDate}</dd></div>
          <div><dt>CURRENT TIER</dt><dd>{multiplier ? `${Number(multiplier) / 100}×` : "1×"}</dd></div>
          <div><dt>CLAIMABLE</dt><dd>{rewards !== undefined ? `${Number(formatUnits(rewards, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })} KINGJOSHI` : "—"}</dd></div>
        </dl>
        <div className="stake-actions">
          {MALKUTA_STAKING_CONFIGURED && !isStaked && isMine && !isApproved && (
            <button disabled={isPending} onClick={() => transact("APPROVAL", {
              address: MALKUTA_ENGINE_ADDRESS,
              abi: ERC721_STAKING_ABI,
              functionName: "approve",
              args: [MALKUTA_STAKING_ADDRESS, tokenId],
              chainId: BASE_MAINNET_CHAIN_ID,
            })}>APPROVE NFT</button>
          )}
          {MALKUTA_STAKING_CONFIGURED && !isStaked && isMine && isApproved && (
            <button disabled={isPending} onClick={() => transact("STAKE", {
              address: MALKUTA_STAKING_ADDRESS,
              abi: MALKUTA_STAKING_ABI,
              functionName: "stake",
              args: [MALKUTA_ENGINE_ADDRESS, tokenId],
              chainId: BASE_MAINNET_CHAIN_ID,
            })}>STAKE NFT</button>
          )}
          {isStaked && (
            <>
              <button disabled={isPending || !rewards} onClick={() => transact("CLAIM", {
                address: MALKUTA_STAKING_ADDRESS,
                abi: MALKUTA_STAKING_ABI,
                functionName: "claimRewards",
                args: [MALKUTA_ENGINE_ADDRESS, tokenId],
                chainId: BASE_MAINNET_CHAIN_ID,
              })}>CLAIM REWARDS</button>
              <button className="secondary" disabled={isPending} onClick={() => transact("UNSTAKE", {
                address: MALKUTA_STAKING_ADDRESS,
                abi: MALKUTA_STAKING_ABI,
                functionName: "unstake",
                args: [MALKUTA_ENGINE_ADDRESS, tokenId],
                chainId: BASE_MAINNET_CHAIN_ID,
              })}>UNSTAKE</button>
            </>
          )}
        </div>
        {status && <output>{status}</output>}
      </div>
    </article>
  );
}

export default function StakingDashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [tokenIds, setTokenIds] = useState<bigint[]>([]);
  const [manualToken, setManualToken] = useState("");
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [status, setStatus] = useState("");
  const { writeContractAsync, isPending } = useWriteContract();
  const enabled = MALKUTA_STAKING_CONFIGURED;

  const { data: rate } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "rewardRatePerDay", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: totalStaked } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "totalStaked", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: unpaid, refetch: refetchUnpaid } = useReadContract({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "unpaidRewards", args: [address ?? zeroAddress], chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: enabled && Boolean(address) } });
  const { data: pool } = useReadContract({ address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "balanceOf", args: [MALKUTA_STAKING_ADDRESS], chainId: BASE_MAINNET_CHAIN_ID, query: { enabled } });
  const { data: decimals } = useReadContract({ address: KING_JOSHI_ADDRESS, abi: ERC20_STAKING_ABI, functionName: "decimals", chainId: BASE_MAINNET_CHAIN_ID });
  const tokenDecimals = Number(decimals ?? 18);

  useEffect(() => {
    if (!publicClient || !address) {
      setTokenIds([]);
      return;
    }
    let cancelled = false;
    setLoadingTokens(true);
    publicClient.getContractEvents({
      address: MALKUTA_ENGINE_ADDRESS,
      abi: MALKUTA_ENGINE_ABI,
      eventName: "MandalaMinted",
      fromBlock: BigInt(MALKUTA_ENGINE_DEPLOYMENT_BLOCK),
      toBlock: "latest",
    }).then((logs) => {
      if (cancelled) return;
      const ids = Array.from(new Set(logs.map((log) => log.args.tokenId?.toString()).filter(Boolean)))
        .map((id) => BigInt(id!));
      setTokenIds(ids);
    }).catch(() => {
      if (!cancelled) setStatus("THE COLLECTION INDEX IS TEMPORARILY UNAVAILABLE · ENTER A TOKEN ID BELOW");
    }).finally(() => {
      if (!cancelled) setLoadingTokens(false);
    });
    return () => { cancelled = true; };
  }, [address, publicClient]);

  const displayedTokens = useMemo(() => tokenIds.slice().reverse(), [tokenIds]);
  const onBase = chainId === BASE_MAINNET_CHAIN_ID;

  async function claimUnpaid() {
    if (!publicClient) return;
    try {
      setStatus("CONFIRM UNPAID REWARD CLAIM…");
      const hash = await writeContractAsync({ address: MALKUTA_STAKING_ADDRESS, abi: MALKUTA_STAKING_ABI, functionName: "claimUnpaidRewards", chainId: BASE_MAINNET_CHAIN_ID });
      await publicClient.waitForTransactionReceipt({ hash });
      await refetchUnpaid();
      setStatus("UNPAID REWARDS CLAIMED");
    } catch (error) {
      setStatus(error instanceof Error ? error.message.split("\n")[0] : "CLAIM FAILED");
    }
  }

  function addToken() {
    if (!/^\d+$/.test(manualToken)) return;
    const id = BigInt(manualToken);
    setTokenIds((current) => current.some((value) => value === id) ? current : [id, ...current]);
    setManualToken("");
  }

  const accessLabel = !MALKUTA_STAKING_CONFIGURED
    ? "STAKING CONTRACT AWAITS DEPLOYMENT"
    : !isConnected
      ? "CONNECT WALLET TO VIEW YOUR MALKUTA"
      : !onBase
        ? "SWITCH WALLET TO BASE"
        : "WALLET CONNECTED · BASE MAINNET";

  return (
    <main className="staking-page">
      <header className="topbar">
        <Link className="brand" href="/"><BrandMark priority /><span><strong>KINGDOM WITHIN</strong><small>STAKING SANCTUM</small></span></Link>
        <div className="top-actions"><Link href="/collection">COLLECTION</Link><WalletButton /></div>
      </header>

      <section className="staking-hero">
        <div className="staking-hero-title">
          <p className="eyebrow"><span>S</span> MALKUTA STAKING · BASE</p>
          <h1>Hold the signal.<br /><em>Deepen the reward.</em></h1>
        </div>
        <div className="staking-hero-copy">
          <p>Stake your Malkuta Mandalas and earn KINGJOSHI as their time in the sanctum compounds through four reward tiers.</p>
          <div className="admin-access"><span className={enabled && onBase ? "pulse" : ""} />{accessLabel}</div>
        </div>
      </section>

      <section className="staking-dashboard-shell">
        <aside className="staking-sidebar">
          <div className="sidebar-heading">
            <span>STAKING OVERVIEW</span>
            <i className={enabled && onBase ? "pulse" : ""} />
          </div>
          <div className="sidebar-metrics">
            <div><span>BASE REWARD / DAY</span><strong>{rate !== undefined ? Number(formatUnits(rate, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}</strong><small>KINGJOSHI · 1×</small></div>
            <div><span>TOTAL NFTS STAKED</span><strong>{totalStaked?.toString() ?? "—"}</strong><small>ACTIVE MANDALAS</small></div>
            <div><span>REWARD RESERVE</span><strong>{pool !== undefined ? Number(formatUnits(pool, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong><small>KINGJOSHI</small></div>
          </div>
          <div className="unpaid-card">
            <span>YOUR UNPAID REWARDS</span>
            <strong>{unpaid !== undefined ? Number(formatUnits(unpaid, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—"}</strong>
            <button disabled={isPending || !unpaid} onClick={claimUnpaid}>CLAIM BALANCE <b>→</b></button>
          </div>
          <div className="tier-ladder">
            <div className="tier-ladder-heading"><span>REWARD TIERS</span><small>TIME STAKED</small></div>
            <div><span>01</span><strong>1×</strong><p>0–30 DAYS</p></div>
            <div><span>02</span><strong>2×</strong><p>31–90 DAYS</p></div>
            <div><span>03</span><strong>2.5×</strong><p>91–180 DAYS</p></div>
            <div><span>04</span><strong>3×</strong><p>181+ DAYS</p></div>
          </div>
          <Link className="admin-panel-link" href="/staking/admin"><span>OWNER ACCESS</span><b>ADMIN PANEL →</b></Link>
        </aside>

        <div className="staking-vault">
          <div className="vault-heading">
            <div><p className="eyebrow"><span>V</span> YOUR VAULT</p><h2>Malkuta Mandalas</h2><small>{displayedTokens.length} TOKEN{displayedTokens.length === 1 ? "" : "S"} DISCOVERED</small></div>
            <div className="token-lookup">
              <label htmlFor="staking-token-id">ADD BY TOKEN ID</label>
              <span><input id="staking-token-id" inputMode="numeric" value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="Token ID" /><button onClick={addToken}>ADD →</button></span>
            </div>
          </div>
          <div className="vault-workspace">
            {!isConnected && <div className="staking-empty"><i /><h3>Connect your wallet to enter the vault.</h3><p>Your Malkuta Mandalas and active stakes will appear here.</p></div>}
            {isConnected && loadingTokens && <div className="staking-empty"><i /><h3>Reading your collection from Base…</h3></div>}
            {isConnected && !loadingTokens && displayedTokens.length === 0 && <div className="staking-empty"><i /><h3>No Malkuta Mandalas found.</h3><p>If you own one, enter its token ID above.</p></div>}
            <div className="stake-grid">
              {displayedTokens.map((tokenId) => <StakeCard key={tokenId.toString()} tokenId={tokenId} wallet={address} tokenDecimals={tokenDecimals} />)}
            </div>
          </div>
        </div>
      </section>
      {status && <output className="admin-global-status">{status}</output>}
      <SiteFooter tagline="TIME HELD WITH INTENTION BECOMES REWARD." />
    </main>
  );
}
