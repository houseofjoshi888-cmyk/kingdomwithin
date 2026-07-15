"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { encodePacked, formatEther, isAddress, keccak256, parseEther, toBytes, zeroAddress } from "viem";
import { useAccount, useBalance, useChainId, usePublicClient, useReadContract, useSignMessage, useWriteContract } from "wagmi";
import { WalletButton } from "../WalletButton";
import { analyzeVerse, PROTOCOL_VERSION } from "../../lib/protocol";
import { BASE_MAINNET_CHAIN_ID, MALKUTA_ENGINE_ADDRESS, MALKUTA_ENGINE_CONFIGURED } from "../../lib/network";
import { MALKUTA_ENGINE_ABI } from "../../lib/contract";
import { pinCanonicalArtifact } from "../../lib/pinning";

const ADMIN_ROLE = keccak256(toBytes("ADMIN_ROLE"));

type PreparedAirdrop = { contentHash: `0x${string}`; tokenId: bigint };

export default function AdminDashboard() {
  const [recipient, setRecipient] = useState("");
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState("");
  const [prepared, setPrepared] = useState<PreparedAirdrop | null>(null);
  const [epochIdInput, setEpochIdInput] = useState("1");
  const [epochName, setEpochName] = useState("Epoch 2026");
  const [epochPrice, setEpochPrice] = useState("0.01");
  const [epochActive, setEpochActive] = useState(true);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync, isPending } = useWriteContract();
  const analysis = useMemo(() => analyzeVerse(inputText, "root60", {}), [inputText]);

  const { data: isAdmin, isLoading: checkingRole } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: MALKUTA_ENGINE_ABI,
    functionName: "hasRole",
    args: [ADMIN_ROLE, address ?? zeroAddress],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled: MALKUTA_ENGINE_CONFIGURED && isConnected && Boolean(address) },
  });
  const { data: currentEpochId } = useReadContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "currentEpochId", chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: MALKUTA_ENGINE_CONFIGURED } });
  const { data: currentEpoch } = useReadContract({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "epochs", args: [currentEpochId ?? BigInt(0)], chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: MALKUTA_ENGINE_CONFIGURED && currentEpochId !== undefined } });
  const { data: treasury } = useBalance({ address: MALKUTA_ENGINE_ADDRESS, chainId: BASE_MAINNET_CHAIN_ID, query: { enabled: MALKUTA_ENGINE_CONFIGURED } });

  const recipientValid = isAddress(recipient);
  const onBase = chainId === BASE_MAINNET_CHAIN_ID;
  const canExecute = MALKUTA_ENGINE_CONFIGURED && isConnected && onBase && isAdmin === true && recipientValid && analysis.total > 0 && !isPending;

  async function executeAirdrop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canExecute || !publicClient || !isAddress(recipient)) return;
    try {
      setStatus("PINNING CANONICAL ARTIFACT TO IPFS…");
      if (!address) return;
      const artifact = await pinCanonicalArtifact(inputText, analysis, "root60", address, (message) => signMessageAsync({ message }));
      const tokenId = BigInt(keccak256(encodePacked(["address", "bytes32"], [recipient, artifact.contentHash])));
      setPrepared({ contentHash: artifact.contentHash, tokenId });

      setStatus("CONFIRM AIRDROP IN ADMIN WALLET…");
      const transactionHash = await writeContractAsync({
        address: MALKUTA_ENGINE_ADDRESS,
        abi: MALKUTA_ENGINE_ABI,
        functionName: "airdrop",
        args: [recipient, tokenId, artifact.contentHash, PROTOCOL_VERSION, artifact.metadataURI],
        chainId: BASE_MAINNET_CHAIN_ID,
      });
      setStatus("AIRDROP SUBMITTED · WAITING FOR BASE MAINNET…");
      await publicClient.waitForTransactionReceipt({ hash: transactionHash });
      setStatus(`AIRDROP COMPLETE · ${transactionHash.slice(0, 10)}…${transactionHash.slice(-8)}`);
    } catch (error) {
      setStatus(error instanceof Error ? `AIRDROP FAILED · ${error.message.split("\n")[0]}` : "AIRDROP FAILED");
    }
  }

  async function configureEpoch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAdmin || !publicClient || !/^\d+$/.test(epochIdInput) || !epochName.trim()) return;
    try {
      setStatus("CONFIRM EPOCH CONFIGURATION…");
      const hash = await writeContractAsync({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "setEpoch", args: [BigInt(epochIdInput), parseEther(epochPrice), epochActive, epochName.trim()], chainId: BASE_MAINNET_CHAIN_ID });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`EPOCH UPDATED · ${hash.slice(0, 10)}…${hash.slice(-8)}`);
    } catch (error) {
      setStatus(error instanceof Error ? `EPOCH UPDATE FAILED · ${error.message.split("\n")[0]}` : "EPOCH UPDATE FAILED");
    }
  }

  async function withdrawTreasury() {
    if (!canAdmin || !publicClient) return;
    try {
      setStatus("CONFIRM HOUSE WALLET WITHDRAWAL…");
      const hash = await writeContractAsync({ address: MALKUTA_ENGINE_ADDRESS, abi: MALKUTA_ENGINE_ABI, functionName: "withdraw", chainId: BASE_MAINNET_CHAIN_ID });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`PROCEEDS SENT TO HOUSE WALLET · ${hash.slice(0, 10)}…${hash.slice(-8)}`);
    } catch (error) {
      setStatus(error instanceof Error ? `WITHDRAWAL FAILED · ${error.message.split("\n")[0]}` : "WITHDRAWAL FAILED");
    }
  }

  const accessLabel = !MALKUTA_ENGINE_CONFIGURED ? "CONTRACT ADDRESS REQUIRED" : !isConnected ? "CONNECT THE ADMIN WALLET" : !onBase ? "SWITCH TO BASE MAINNET" : checkingRole ? "VERIFYING ADMIN ROLE" : isAdmin ? "ADMIN ROLE VERIFIED" : "CONNECTED WALLET IS NOT AN ADMIN";
  const canAdmin = MALKUTA_ENGINE_CONFIGURED && isConnected && onBase && isAdmin === true && !isPending;

  return (
    <main className="admin-page">
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">K</span><span><strong>KINGDOM WITHIN</strong><small>INTERNAL ADMIN</small></span></Link>
        <div className="top-actions"><Link href="/">RETURN TO COMPOSER</Link><WalletButton /></div>
      </header>
      <section className="admin-shell">
        <div className="admin-intro">
          <p className="eyebrow"><span>A</span> ADMIN DASHBOARD</p>
          <h1>Direct sovereign<br /><em>airdrop.</em></h1>
          <p>Enter a recipient and source text. The instrument runs the immutable Root‑60 protocol, seals the artifact, and prepares one admin-sponsored mint.</p>
        </div>
        <form className="airdrop-form" onSubmit={executeAirdrop}>
          <div className="admin-access"><span className={isAdmin ? "pulse" : ""} />{accessLabel}</div>
          <label htmlFor="recipient">01 · RECIPIENT WALLET ADDRESS</label>
          <input id="recipient" value={recipient} onChange={(event) => { setRecipient(event.target.value.trim()); setPrepared(null); }} placeholder="0x…" autoComplete="off" spellCheck={false} />
          {recipient && !recipientValid && <small className="field-error">ENTER A VALID EVM WALLET ADDRESS</small>}
          <label htmlFor="airdrop-text">02 · INPUT TEXT · ROOT-60</label>
          <textarea id="airdrop-text" value={inputText} onChange={(event) => { setInputText(event.target.value); setPrepared(null); }} placeholder="Enter the source text…" />
          <div className="airdrop-audit">
            <div><span>NUMERICAL SIGNATURE</span><b>{analysis.total || "—"}</b></div>
            <div><span>SYMMETRY</span><b>{analysis.symmetry ? `${analysis.symmetry} PETALS` : "—"}</b></div>
            <div><span>ROTATION / HUE</span><b>{analysis.total ? `${analysis.phase}°` : "—"}</b></div>
            <div><span>ALIGNMENT</span><b>{analysis.alignmentConstant ?? "—"}</b></div>
          </div>
          <button className="execute-airdrop" type="submit" disabled={!canExecute}>{isPending ? "EXECUTING…" : "EXECUTE AIRDROP"}<span>→</span></button>
          {prepared && <div className="prepared-seal"><span>PREPARED TOKEN</span><code>#{prepared.tokenId.toString()} · {prepared.contentHash}</code></div>}
        </form>
      </section>
      <section className="admin-controls">
        <form onSubmit={configureEpoch}>
          <p className="eyebrow"><span>E</span> EPOCH CONTROL</p>
          <h2>Configure the active archive.</h2>
          <div className="admin-current">CURRENT · #{currentEpochId?.toString() ?? "—"} · {currentEpoch?.[2] ?? "—"} · {currentEpoch?.[0] !== undefined ? `${formatEther(currentEpoch[0])} ETH` : "—"}</div>
          <label htmlFor="epoch-id">EPOCH ID</label><input id="epoch-id" inputMode="numeric" value={epochIdInput} onChange={(event) => setEpochIdInput(event.target.value)} />
          <label htmlFor="epoch-name">EPOCH NAME</label><input id="epoch-name" value={epochName} onChange={(event) => setEpochName(event.target.value)} />
          <label htmlFor="epoch-price">MINT PRICE · ETH</label><input id="epoch-price" inputMode="decimal" value={epochPrice} onChange={(event) => setEpochPrice(event.target.value)} />
          <label className="epoch-toggle"><input type="checkbox" checked={epochActive} onChange={(event) => setEpochActive(event.target.checked)} /><span>SET EPOCH ACTIVE</span></label>
          <button type="submit" disabled={!canAdmin}>UPDATE EPOCH <span>→</span></button>
        </form>
        <div>
          <p className="eyebrow"><span>T</span> TREASURY</p>
          <h2>House wallet proceeds.</h2>
          <strong>{treasury ? `${formatEther(treasury.value)} ETH` : "— ETH"}</strong>
          <p>All accumulated public mint payments are sent only to the immutable House wallet.</p>
          <code>0x6736d2eA9807297F0e56967361B9410854B86a5f</code>
          <button type="button" onClick={withdrawTreasury} disabled={!canAdmin || !treasury?.value}>WITHDRAW TO HOUSE WALLET <span>→</span></button>
        </div>
      </section>
      {status && <output className="admin-global-status">{status}</output>}
    </main>
  );
}
