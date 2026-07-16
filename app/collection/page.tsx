"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "../SiteFooter";
import { WalletButton } from "../WalletButton";
import { BrandMark } from "../BrandMark";

type CollectionMint = {
  tokenId: string;
  owner: string;
  transactionHash: string;
  timestamp: number;
  sourceText: string;
  mappingMode: string;
  imageURI: string;
  numericalSignature: number;
  symmetry: number;
  rotation: number;
  scale: number;
  hue: number;
  epochId: string;
  protocolVersion: string;
  verificationStatus: "verified" | "metadata_unavailable";
};

type CollectionResponse = {
  status: "ready";
  indexedThroughBlock: string;
  epoch: { id: string; name: string; active: boolean };
  stats: { totalMinted: number };
  collectionTotal: number;
  contractTotalSupply: string;
  verifiedTotal: number;
  latestMints: CollectionMint[];
};

function ipfsUrl(uri: string) {
  return uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function CollectionPage() {
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/epoch?scope=all")
      .then(async (response) => {
        const result = await response.json() as CollectionResponse;
        if (!response.ok || result.status !== "ready") throw new Error("Index unavailable");
        if (active) { setData(result); setState("ready"); }
      })
      .catch(() => { if (active) setState("unavailable"); });
    return () => { active = false; };
  }, []);

  return (
    <main className="collection-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Kingdom Within home">
          <BrandMark priority />
          <span><strong>KINGDOM WITHIN</strong><small>SOVEREIGN COLLECTION</small></span>
        </Link>
        <div className="status-line"><span className="pulse" /> BASE MAINNET <i /> VERIFIED ARTIFACTS</div>
        <div className="top-actions"><Link href="/">COMPOSER</Link><Link href="/verify">VERIFY NFT</Link><WalletButton /></div>
      </header>

      <section className="collection-hero">
        <div>
          <p className="eyebrow"><span>∞</span> THE SOVEREIGN ARCHIVE</p>
          <h1>Every signal,<br /><em>held in form.</em></h1>
        </div>
        <div className="collection-summary">
          <p>Every Malkuta mint across every epoch, read from Base mainnet. Canonical artifacts are visibly distinguished from tokens whose public metadata is still unavailable.</p>
          <dl>
            <div><dt>INDEXED MINTS</dt><dd>{state === "loading" ? "…" : data?.collectionTotal ?? 0}</dd></div>
            <div><dt>CURRENT EPOCH</dt><dd>{data?.epoch.name ?? "GENESIS"}</dd></div>
            <div><dt>NETWORK</dt><dd>BASE</dd></div>
          </dl>
        </div>
      </section>

      <section className="collection-shell" aria-live="polite">
        <div className="collection-bar">
          <span>COMPLETE ON-CHAIN COLLECTION</span>
          <small>{data ? `INDEXED THROUGH BLOCK ${data.indexedThroughBlock}` : "READING THE ARCHIVE"}</small>
        </div>

        {state === "loading" && <div className="collection-state"><i /><p>READING VERIFIED MINTS FROM BASE MAINNET…</p></div>}
        {state === "unavailable" && <div className="collection-state"><i /><h2>The archive is temporarily unavailable.</h2><p>Try again shortly, or verify a token directly through its on-chain provenance.</p><Link href="/verify">OPEN VERIFIER ↗</Link></div>}
        {state === "ready" && !data?.latestMints.length && <div className="collection-state empty"><i /><h2>The Genesis field is open.</h2><p>The first verified Malkuta mandala will appear here after its canonical metadata is pinned and minted.</p><Link href="/">COMPOSE THE FIRST SIGNAL ↗</Link></div>}

        {!!data?.latestMints.length && <div className="collection-grid">
          {data.latestMints.map((mint) => (
            <article className="collection-card" key={mint.tokenId}>
              <div className="collection-art" style={{ "--mandala-hue": mint.hue } as React.CSSProperties}>
                {mint.imageURI ? <div className="collection-image" role="img" aria-label={`Canonical artwork for Malkuta Mandala ${mint.tokenId}`} style={{ backgroundImage: `url(${JSON.stringify(ipfsUrl(mint.imageURI)).slice(1, -1)})` }} /> : <div className="collection-fallback"><i /><i /><i /><b>{mint.symmetry}</b></div>}
                <span>#{mint.tokenId.padStart(3, "0")}</span>
                <small className={`collection-verification ${mint.verificationStatus}`}>{mint.verificationStatus === "verified" ? "✓ VERIFIED" : "METADATA PENDING"}</small>
              </div>
              <div className="collection-card-copy">
                <div><small>MALKUTA MANDALA</small><b>{mint.sourceText || `Signal ${mint.numericalSignature}`}</b></div>
                <dl>
                  <div><dt>SIGNATURE</dt><dd>Σ {mint.numericalSignature}</dd></div>
                  <div><dt>SYMMETRY</dt><dd>{mint.symmetry} PETALS</dd></div>
                  <div><dt>PHASE</dt><dd>{mint.rotation}°</dd></div>
                  <div><dt>HUE</dt><dd><i style={{ backgroundColor: `hsl(${mint.hue}, 72%, 58%)` }} />{mint.hue}°</dd></div>
                </dl>
                <div className="collection-owner"><span>MINTED TO {shortAddress(mint.owner)}</span><span>EPOCH {mint.epochId} · {mint.mappingMode || mint.protocolVersion}</span></div>
                <div className="collection-links"><Link href={`/verify?token=${mint.tokenId}`}>VERIFY</Link><a href={`https://basescan.org/tx/${mint.transactionHash}`} target="_blank" rel="noreferrer">TRANSACTION ↗</a></div>
              </div>
            </article>
          ))}
        </div>}
      </section>

      <SiteFooter tagline="EVERY SIGNAL IS TRACEABLE. EVERY FORM IS PROVABLE." />
    </main>
  );
}
