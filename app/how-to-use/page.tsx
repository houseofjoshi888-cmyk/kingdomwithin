import Link from "next/link";

const steps = [
  ["Choose a mapping", "Use the immutable Aramaic/Hebrew Standard, the current Latin bridge, or upload a validated custom JSON mapping. Root-60 will activate only after its exact matrix is ratified."],
  ["Enter the source", "Paste the text or choose a test input. The instrument applies NFKD normalization, removes non-letter marks, and retains only mapped glyphs."],
  ["Audit the signature", "Read every mapped glyph and verify the Numerical Signature, symmetry, phase, golden scale, hue, and SHA-256 protocol seal."],
  ["Generate the form", "Select Generate Mandala. The live motion is an inspection layer; it does not change the underlying deterministic geometry."],
  ["Capture the heirloom", "Export SVG for the canonical resolution-independent artifact. PNG freezes the canvas at protocol time t=0 as a convenience rendition."],
  ["Package and mint", "Pin the artifact, insert its final IPFS URI into the manifest, compute its Keccak-256 digest, then submit that digest with the protocol version and mapping digest."],
] as const;

const readiness = [
  { state: "ready", title: "Deterministic engine", detail: "NFKD normalization, mappings, geometry, color, SHA-256 seal, SVG/PNG capture, manifest packing, and Keccak digest." },
  { state: "ready", title: "Protocol constitution", detail: "PROTOCOL.md fixes canonical serialization, artifact rules, hashing order, mint sequence, and annual epochs." },
  { state: "review", title: "Root-60 specification", detail: "Needs the exact character-to-value matrix and alignment_constant formula with locked test vectors." },
  { state: "review", title: "Contract hardening", detail: "Current mint is public and free. Define authorization, token-ID allocation, duplicates, pricing, epoch authority, and manifest discovery before deployment." },
  { state: "review", title: "Storage and testnet", detail: "Choose an IPFS pinning provider, supply its server-side credentials, and provide a Base Sepolia deployer wallet with test ETH." },
  { state: "review", title: "Epoch data bridge", detail: "Expand the mint event or anchor a manifest URI, then index events with a subgraph so the dashboard can calculate real statistics." },
  { state: "review", title: "Independent audit", detail: "Compile and test with Foundry or Hardhat, verify provenance reads after mint, run a security review, and only then consider Base mainnet." },
] as const;

export default function HowToUse() {
  return (
    <main className="guide-page">
      <header className="topbar">
        <Link className="brand" href="/#composer" aria-label="Kingdom Within composer">
          <span className="brand-mark">K</span>
          <span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span>
        </Link>
        <div className="status-line"><span className="pulse" /> PROTOCOL V1.0 <i /> GUIDE</div>
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
        <div><p className="eyebrow"><span>07</span> VERIFY THE PROOF</p><h2>What must match.</h2></div>
        <dl>
          <div><dt>Normalized text</dt><dd>Exact mapped glyph stream</dd></div>
          <div><dt>Mapping mode</dt><dd>Explicit protocol identifier</dd></div>
          <div><dt>Geometry</dt><dd>Σ, petals, phase, scale, hue</dd></div>
          <div><dt>Protocol seal</dt><dd>SHA-256 of canonical inputs</dd></div>
          <div><dt>Mint seal</dt><dd>Keccak-256 of final manifest bytes</dd></div>
          <div><dt>On-chain record</dt><dd>Provenance equals mint submission</dd></div>
        </dl>
      </section>

      <section className="readiness-section">
        <div className="readiness-heading"><p className="eyebrow"><span>08</span> LAUNCH READINESS</p><h2>What it still needs<br />to fully work.</h2></div>
        <div className="readiness-list">
          {readiness.map((item) => <article key={item.title}><i className={item.state} /><div><h3>{item.title}</h3><p>{item.detail}</p></div><span>{item.state === "ready" ? "COMPLETE" : "REQUIRED"}</span></article>)}
        </div>
      </section>

      <section className="guide-warning"><span>DEPLOYMENT GATE</span><p>Do not deploy the current Track A contract yet. Its unrestricted mint function lets any address mint any unused token ID to any recipient for free.</p></section>

      <footer><div className="brand footer-brand"><span className="brand-mark">K</span><span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span></div><p>THE SOURCE IS NORMALIZED.<br />THE OUTPUT IS VERIFIABLE.</p><Link href="/#composer">RETURN TO COMPOSER ↗</Link></footer>
    </main>
  );
}
