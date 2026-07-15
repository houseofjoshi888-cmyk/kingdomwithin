"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { encodePacked, isAddress, keccak256, toBytes, zeroAddress } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { WalletButton } from "../WalletButton";
import { analyzeVerse, createCanonicalManifest, manifestKeccak256, PROTOCOL_VERSION, renderCanonicalSvg } from "../../lib/protocol";
import { BASE_MAINNET_CHAIN_ID, MALKUTA_AIRDROP_ENABLED, MALKUTA_ENGINE_ADDRESS } from "../../lib/network";

const ADMIN_ROLE = keccak256(toBytes("ADMIN_ROLE"));
const AIRDROP_ABI = [
  { type: "function", name: "hasRole", stateMutability: "view", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "airdrop", stateMutability: "nonpayable", inputs: [{ name: "recipient", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "contentHash", type: "bytes32" }, { name: "version", type: "string" }], outputs: [] },
] as const;

type PreparedAirdrop = { contentHash: `0x${string}`; tokenId: bigint };

export default function AdminDashboard() {
  const [recipient, setRecipient] = useState("");
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState("");
  const [prepared, setPrepared] = useState<PreparedAirdrop | null>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const analysis = useMemo(() => analyzeVerse(inputText, "root60", {}), [inputText]);

  const { data: isAdmin, isLoading: checkingRole } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: AIRDROP_ABI,
    functionName: "hasRole",
    args: [ADMIN_ROLE, address ?? zeroAddress],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled: isConnected && Boolean(address) },
  });

  const recipientValid = isAddress(recipient);
  const onBase = chainId === BASE_MAINNET_CHAIN_ID;
  const canExecute = MALKUTA_AIRDROP_ENABLED && isConnected && onBase && isAdmin === true && recipientValid && analysis.total > 0 && !isPending;

  async function executeAirdrop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canExecute || !publicClient || !isAddress(recipient)) return;
    try {
      setStatus("PREPARING ROOT-60 ARTIFACT…");
      const svg = renderCanonicalSvg(analysis);
      const imageUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      const manifest = await createCanonicalManifest(inputText, imageUri, analysis);
      const contentHash = manifestKeccak256(manifest);
      const tokenId = BigInt(keccak256(encodePacked(["address", "bytes32"], [recipient, contentHash])));
      setPrepared({ contentHash, tokenId });

      setStatus("CONFIRM AIRDROP IN ADMIN WALLET…");
      const transactionHash = await writeContractAsync({
        address: MALKUTA_ENGINE_ADDRESS,
        abi: AIRDROP_ABI,
        functionName: "airdrop",
        args: [recipient, tokenId, contentHash, PROTOCOL_VERSION],
        chainId: BASE_MAINNET_CHAIN_ID,
      });
      setStatus("AIRDROP SUBMITTED · WAITING FOR BASE MAINNET…");
      await publicClient.waitForTransactionReceipt({ hash: transactionHash });
      setStatus(`AIRDROP COMPLETE · ${transactionHash.slice(0, 10)}…${transactionHash.slice(-8)}`);
    } catch (error) {
      setStatus(error instanceof Error ? `AIRDROP FAILED · ${error.message.split("\n")[0]}` : "AIRDROP FAILED");
    }
  }

  const accessLabel = !isConnected ? "CONNECT THE ADMIN WALLET" : !onBase ? "SWITCH TO BASE MAINNET" : checkingRole ? "VERIFYING ADMIN ROLE" : isAdmin ? "ADMIN ROLE VERIFIED" : "CONNECTED WALLET IS NOT AN ADMIN";

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
          {!MALKUTA_AIRDROP_ENABLED && <p className="deployment-lock">DEPLOYMENT LOCK · The corrected airdrop contract must be deployed and verified on Base mainnet before this button can submit a transaction.</p>}
          {prepared && <div className="prepared-seal"><span>PREPARED TOKEN</span><code>#{prepared.tokenId.toString()} · {prepared.contentHash}</code></div>}
          {status && <output className="airdrop-status">{status}</output>}
        </form>
      </section>
    </main>
  );
}
