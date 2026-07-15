import Link from "next/link";

const steps = [
  ["Choose a mapping", "Use the immutable Aramaic/Hebrew Standard, the current Latin bridge, or upload a validated custom JSON mapping. Root-60 will activate only after its exact matrix is ratified."],
  ["Enter the source", "Paste the text or choose a test input. The instrument applies NFKD normalization, removes non-letter marks, and retains only mapped glyphs."],
  ["Audit the signature", "Read every mapped glyph and verify the Numerical Signature, symmetry, phase, golden scale, hue, and SHA-256 protocol seal."],
  ["Generate the form", "Select Generate Mandala. The live motion is an inspection layer; it does not change the underlying deterministic geometry."],
  ["Capture the heirloom", "Export SVG for the canonical resolution-independent artifact. PNG freezes the canvas at protocol time t=0 as a convenience rendition."],
  ["Package and mint", "Pin the artifact, insert its final IPFS URI into the manifest, compute its Keccak-256 digest, then submit that digest with the protocol version and mapping digest."],
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

      <footer><div className="brand footer-brand"><span className="brand-mark">K</span><span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span></div><p>THE SOURCE IS NORMALIZED.<br />THE OUTPUT IS VERIFIABLE.</p><Link href="/#composer">RETURN TO COMPOSER ↗</Link></footer>
    </main>
  );
}
