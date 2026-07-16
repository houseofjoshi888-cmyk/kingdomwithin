"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { WalletButton } from "../WalletButton";
import { MALKUTA_ENGINE_ABI } from "../../lib/contract";
import { BASE_MAINNET_CHAIN_ID, MALKUTA_ENGINE_ADDRESS, MALKUTA_ENGINE_CONFIGURED } from "../../lib/network";
import { SiteFooter } from "../SiteFooter";
import { BrandMark } from "../BrandMark";

function VerifyContent() {
  const searchParams = useSearchParams();
  const requestedToken = searchParams.get("token") ?? "";
  const [tokenInput, setTokenInput] = useState(/^\d+$/.test(requestedToken) ? requestedToken : "");
  const tokenId = /^\d+$/.test(tokenInput) ? BigInt(tokenInput) : undefined;
  const { data: provenance, isLoading, error } = useReadContract({
    address: MALKUTA_ENGINE_ADDRESS,
    abi: MALKUTA_ENGINE_ABI,
    functionName: "tokenProvenance",
    args: [tokenId ?? BigInt(0)],
    chainId: BASE_MAINNET_CHAIN_ID,
    query: { enabled: MALKUTA_ENGINE_CONFIGURED && tokenId !== undefined },
  });
  const exists = provenance && provenance[0] !== `0x${"0".repeat(64)}`;

  return (
    <main className="verify-page">
      <header className="topbar">
        <Link className="brand" href="/"><BrandMark priority /><span><strong>KINGDOM WITHIN</strong><small>PROVENANCE VERIFIER</small></span></Link>
        <div className="top-actions"><Link href="/">RETURN TO COMPOSER</Link><WalletButton /></div>
      </header>
      <section className="verify-shell">
        <div>
          <p className="eyebrow"><span>V</span> ON-CHAIN VERIFICATION</p>
          <h1>Trust the proof,<br /><em>not the claim.</em></h1>
          <p className="verify-copy">Enter any Malkuta token ID to read its immutable Base mainnet provenance directly from the contract.</p>
        </div>
        <div className="verify-instrument">
          <label htmlFor="token-id">TOKEN ID</label>
          <div className="verify-search"><input id="token-id" inputMode="numeric" value={tokenInput} onChange={(event) => setTokenInput(event.target.value.trim())} placeholder="Enter token number" /><span>⌕</span></div>
          {!MALKUTA_ENGINE_CONFIGURED && <p className="verify-message">VERIFIER CURRENTLY UNAVAILABLE</p>}
          {isLoading && <p className="verify-message">READING BASE MAINNET…</p>}
          {error && <p className="verify-message error">TOKEN LOOKUP FAILED</p>}
          {tokenId !== undefined && provenance && !exists && <p className="verify-message">NO MALKUTA PROVENANCE FOUND FOR THIS TOKEN</p>}
          {exists && provenance && <dl className="provenance-grid">
            <div><dt>TOKEN ID</dt><dd>{tokenId?.toString()}</dd></div>
            <div><dt>PROTOCOL</dt><dd>{provenance[1]}</dd></div>
            <div><dt>EPOCH</dt><dd>{provenance[3].toString()}</dd></div>
            <div><dt>MINTED</dt><dd>{new Date(Number(provenance[4]) * 1000).toLocaleString()}</dd></div>
            <div className="wide"><dt>CONTENT HASH</dt><dd><code>{provenance[0]}</code></dd></div>
            <div className="wide"><dt>IMMUTABLE METADATA</dt><dd><a href={provenance[2].replace("ipfs://", "https://ipfs.io/ipfs/")} target="_blank" rel="noreferrer">{provenance[2]} ↗</a></dd></div>
          </dl>}
        </div>
      </section>
      <SiteFooter tagline="TRUST THE PROOF. PRESERVE THE RECORD." />
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
