import Link from "next/link";
import { SiteFooter } from "../SiteFooter";
import { BrandMark } from "../BrandMark";

const steps = [
  ["Choose a mapping", "Use the immutable Aramaic/Hebrew Standard, the universal Root-60 sexagesimal bridge, or upload a validated custom JSON mapping."],
  ["Enter the source", "Paste the text or choose a test input. The instrument applies NFKD normalization, removes non-letter marks, and retains only mapped glyphs."],
  ["Audit the signature", "Read every mapped glyph and verify the Numerical Signature, symmetry, phase, golden scale, hue, and SHA-256 protocol seal."],
  ["Generate the form", "Select Generate Mandala. The live motion is an inspection layer; it does not change the underlying deterministic geometry."],
  ["Capture the heirloom", "Export SVG for the canonical resolution-independent artifact. PNG freezes the canvas at protocol time t=0 as a convenience rendition."],
  ["Package and mint", "Connect a Base mainnet wallet and select Mint Canonical NFT. Sign the artifact authorization, let the instrument pin the SVG and final manifest to public IPFS, then confirm the exact epoch price in your wallet."],
] as const;

export default function HowToUse() {
  return (
    <main className="guide-page">
      <header className="topbar">
        <Link className="brand" href="/#composer" aria-label="Kingdom Within composer">
          <BrandMark priority />
          <span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span>
        </Link>
        <div className="status-line"><span className="pulse" /> PROTOCOL V2.0 <i /> GUIDE</div>
        <Link className="guide-back" href="/#composer">OPEN INSTRUMENT <span>↗</span></Link>
      </header>

      <section className="guide-hero">
        <p className="eyebrow"><span>00</span> OPERATING MANUAL</p>
        <h1>How to use the<br /><em>frequency instrument.</em></h1>
        <p>Every output is an audit trail. Use the same source, mapping, and protocol version and you must arrive at the same signature, seal, and geometric artifact.</p>
      </section>

      <section className="guide-steps">
        {steps.map(([title, detail], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{title}</h2><p>{detail}</p></div>
          </article>
        ))}
      </section>

      <section className="guide-proof">
        <div><p className="eyebrow"><span>07</span> VERIFY THE PROOF</p><h2>What must match.</h2><Link className="guide-back" href="/verify">OPEN TOKEN VERIFIER <span>↗</span></Link></div>
        <dl>
          <div><dt>Normalized text</dt><dd>Exact mapped glyph stream</dd></div>
          <div><dt>Mapping mode</dt><dd>Explicit protocol identifier</dd></div>
          <div><dt>Geometry</dt><dd>Σ, petals, phase, scale, hue</dd></div>
          <div><dt>Protocol seal</dt><dd>SHA-256 of canonical inputs</dd></div>
          <div><dt>Mint seal</dt><dd>Keccak-256 of final manifest bytes</dd></div>
          <div><dt>On-chain record</dt><dd>Provenance equals mint submission</dd></div>
        </dl>
      </section>

      <SiteFooter tagline="THE SOURCE IS NORMALIZED. THE OUTPUT IS VERIFIABLE." />
    </main>
  );
}
