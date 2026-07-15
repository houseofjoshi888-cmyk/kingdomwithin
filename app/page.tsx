"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  analyzeVerse,
  canonicalProtocolPayload,
  createCanonicalManifest,
  manifestKeccak256,
  renderCanonicalSvg,
  sha256Hex,
  TEST_INPUTS,
  type MappingMode,
} from "../lib/protocol";

const VERSES = [
  { ref: "Genesis 1:1", hebrew: "בראשית ברא אלהים את השמים ואת הארץ" },
  { ref: "Exodus 3:14", hebrew: "אהיה אשר אהיה" },
  { ref: "Deuteronomy 6:4", hebrew: "שמע ישראל יהוה אלהינו יהוה אחד" },
  { ref: "Psalm 23:1", hebrew: "יהוה רעי לא אחסר" },
  { ref: "Psalm 119:105", hebrew: "נר לרגלי דברך ואור לנתיבתי" },
] as const;

type MandalaCapture = { captureCanonical: () => string | null };

const MandalaCanvas = forwardRef<MandalaCapture, { data: ReturnType<typeof analyzeVerse>; active: boolean }>(function MandalaCanvas({ data, active }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    const cx = rect.width / 2 + pointer.current.x * 10;
    const cy = rect.height / 2 + pointer.current.y * 10;
    const maxR = Math.min(rect.width, rect.height) * 0.39;

    const glow = context.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.35);
    glow.addColorStop(0, "rgba(212, 169, 94, .13)");
    glow.addColorStop(.55, "rgba(64, 171, 159, .035)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, rect.width, rect.height);

    if (!data.total) {
      context.strokeStyle = "rgba(212,169,94,.22)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(cx, cy, maxR * .52, 0, Math.PI * 2);
      context.stroke();
      return;
    }

    const phaseOffset = data.phase * Math.PI / 180;
    const pulse = active ? 1 + Math.sin(time * .0015 + phaseOffset) * data.scale * .025 : 1;
    const rotation = phaseOffset + (active ? time * .000035 : 0);
    const nodes = data.symmetry;
    const rings = 6;
    context.save();
    context.translate(cx, cy);
    context.rotate(rotation);
    context.globalCompositeOperation = "lighter";

    for (let ring = 1; ring <= rings; ring++) {
      const radialCurve = Math.pow(ring / rings, Math.max(.38, 1 - data.scale));
      const radius = maxR * radialCurve * pulse;
      const phase = (ring % 2 ? 1 : -1) * rotation * (ring * .36 + 1);
      context.strokeStyle = ring % 3 === 0 ? `hsla(${data.hue}, 72%, 62%, .42)` : `hsla(${(data.hue + 38) % 360}, 70%, 68%, .3)`;
      context.lineWidth = ring === rings ? 1.15 : .7;
      context.beginPath();
      for (let i = 0; i <= nodes; i++) {
        const angle = (i / nodes) * Math.PI * 2 + phase;
        const modulation = Math.sin(angle * nodes + phaseOffset + ring) * (radius * data.scale * .09);
        const x = Math.cos(angle) * (radius + modulation);
        const y = Math.sin(angle) * (radius + modulation);
        if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath();
      context.stroke();

      const skip = 2 + ((data.total + ring) % Math.max(2, Math.floor(nodes / 2)));
      context.beginPath();
      for (let i = 0; i < nodes; i++) {
        const a = (i / nodes) * Math.PI * 2 + phase;
        const b = (((i * skip) % nodes) / nodes) * Math.PI * 2 + phase;
        context.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
        context.lineTo(Math.cos(b) * radius, Math.sin(b) * radius);
      }
      context.stroke();
    }

    for (let i = 0; i < nodes; i++) {
      const angle = (i / nodes) * Math.PI * 2 - rotation * .4;
      const x = Math.cos(angle) * maxR;
      const y = Math.sin(angle) * maxR;
      context.fillStyle = i % 2 ? `hsla(${data.hue}, 78%, 68%, .82)` : `hsla(${(data.hue + 42) % 360}, 72%, 64%, .82)`;
      context.beginPath();
      context.arc(x, y, 1.4, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    context.strokeStyle = "rgba(218,176,99,.38)";
    context.lineWidth = .8;
    context.beginPath();
    context.arc(cx, cy, maxR * 1.08, 0, Math.PI * 2);
    context.stroke();
  }, [data, active]);

  useEffect(() => {
    let frame = 0;
    const loop = (time: number) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [draw]);

  useImperativeHandle(ref, () => ({
    captureCanonical: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const previousPointer = pointer.current;
      pointer.current = { x: 0, y: 0 };
      draw(0);
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      pointer.current = previousPointer;
      return dataUrl;
    },
  }), [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Deterministic mandala generated from ${data.total} mapped points`}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointer.current = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 };
      }}
      onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}
    />
  );
});

export default function Home() {
  const [verse, setVerse] = useState<string>(VERSES[0].hebrew);
  const [query, setQuery] = useState<string>(VERSES[0].ref);
  const [mode, setMode] = useState<MappingMode>("ancient");
  const [customMap, setCustomMap] = useState<Record<string, number>>({});
  const [customFile, setCustomFile] = useState("");
  const [customError, setCustomError] = useState("");
  const [active, setActive] = useState(true);
  const [tab, setTab] = useState<"audit" | "protocol">("audit");
  const [wallet, setWallet] = useState("");
  const [showMint, setShowMint] = useState(false);
  const [protocolSeal, setProtocolSeal] = useState("");
  const [artifactStatus, setArtifactStatus] = useState("READY FOR CANONICAL CAPTURE");
  const [manifestDigest, setManifestDigest] = useState("");
  const mandalaRef = useRef<MandalaCapture>(null);
  const analysis = useMemo(() => analyzeVerse(verse, mode, customMap), [verse, mode, customMap]);

  useEffect(() => {
    let current = true;
    const calculateSeal = async () => {
      const seal = analysis.total ? await sha256Hex(canonicalProtocolPayload(analysis)) : "";
      if (current) setProtocolSeal(seal);
    };
    void calculateSeal();
    return () => { current = false; };
  }, [analysis]);

  const downloadText = (filename: string, type: string, contents: string) => {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportSvg = () => {
    downloadText(`malkuta-${analysis.total}.svg`, "image/svg+xml", renderCanonicalSvg(analysis));
    setArtifactStatus("CANONICAL SVG CAPTURED · T=0");
  };

  const exportPng = () => {
    const dataUrl = mandalaRef.current?.captureCanonical();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `malkuta-${analysis.total}.png`;
    link.click();
    setArtifactStatus("PNG RENDITION CAPTURED · T=0");
  };

  const exportManifest = async () => {
    const manifest = await createCanonicalManifest(verse, "ipfs://IMAGE_CID_REQUIRED_BEFORE_MINT", analysis);
    setManifestDigest(manifestKeccak256(manifest));
    downloadText(`malkuta-${analysis.total}.manifest.draft.json`, "application/json", JSON.stringify(manifest, null, 2));
    setArtifactStatus("DRAFT MANIFEST · INSERT PINNED IMAGE CID");
  };

  const selectVerse = (index: number) => {
    setMode("ancient");
    setVerse(VERSES[index].hebrew);
    setQuery(VERSES[index].ref);
    setActive(true);
  };

  const changeMode = (nextMode: MappingMode) => {
    setMode(nextMode);
    setActive(false);
    setQuery("");
    if (nextMode === "latin") setVerse("IN THE BEGINNING");
    if (nextMode === "ancient") { setVerse(VERSES[0].hebrew); setQuery(VERSES[0].ref); }
    if (nextMode === "custom") setVerse("");
  };

  const uploadMap = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
      const entries = Object.entries(parsed);
      if (!entries.length || entries.some(([key, value]) => !key || typeof value !== "number" || !Number.isFinite(value) || value <= 0)) {
        throw new Error("Mapping values must be positive numbers.");
      }
      setCustomMap(Object.fromEntries(entries.map(([key, value]) => [key, value as number])));
      setCustomFile(file.name);
      setCustomError("");
      setActive(false);
    } catch (error) {
      setCustomMap({});
      setCustomFile("");
      setCustomError(error instanceof Error ? error.message : "Invalid mapping JSON.");
    }
  };

  const connectWallet = async () => {
    const eth = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!eth) { setWallet("Wallet not detected"); return; }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0] ? `${accounts[0].slice(0, 6)}…${accounts[0].slice(-4)}` : "Not connected");
    } catch { setWallet("Connection declined"); }
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#composer" aria-label="Kingdom Within home">
          <span className="brand-mark">K</span>
          <span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span>
        </a>
        <div className="status-line"><span className="pulse" /> PROTOCOL V1.0 <i /> BASE READY</div>
        <button className="wallet-button" onClick={connectWallet}>{wallet || "CONNECT WALLET"}<span>↗</span></button>
      </header>

      <section className="intro" id="composer">
        <div>
          <p className="eyebrow"><span>01</span> SCRIPTURE → SIGNAL → FORM</p>
          <h1>The kingdom,<br /><em>made visible.</em></h1>
        </div>
        <p className="intro-copy">A precision instrument that translates the root frequencies of human record—from proto-linguistic constants to codified scripture—into verifiable harmonic frequency and deterministic geometric form.</p>
      </section>

      <section className="instrument">
        <div className="input-panel panel">
          <div className="panel-heading"><span>01 / INPUT</span><small>SOURCE TEXT</small></div>
          <label htmlFor="mapping-mode">Mapping mode</label>
          <select id="mapping-mode" className="mode-select" value={mode} onChange={(event) => changeMode(event.target.value as MappingMode)}>
            <option value="ancient">A — Ancient Hebrew / Aramaic (Standard)</option>
            <option value="latin">B — Universal / Latin Alpha</option>
            <option value="custom">C — Custom JSON Mapping</option>
          </select>
          <div className={`mode-badge ${mode}`}><span>{mode === "ancient" ? "HISTORICAL BASELINE" : mode === "latin" ? "UNIVERSAL A–Z" : "USER-SUPPLIED PROTOCOL"}</span><b>{mode === "ancient" ? "22 GLYPHS · 1–400" : mode === "latin" ? "26 GLYPHS · 1–26" : `${analysis.mapEntries.length} GLYPHS`}</b></div>
          {mode === "latin" && <div className="test-inputs">
            <div className="test-label"><span>OFFICIAL TEST INPUTS</span><small>LATIN-ALPHA / LOCKED</small></div>
            {TEST_INPUTS.map((item) => {
              const expected = analyzeVerse(item.phrase, "latin", {});
              return <button key={item.phrase} className={verse === item.phrase ? "selected" : ""} onClick={() => { setVerse(item.phrase); setActive(true); }}>
                <span><b>{item.phrase}</b><small>{item.role}</small></span><em>Σ {expected.total}</em>
              </button>;
            })}
          </div>}
          {mode === "custom" && <div className="upload-box">
            <input id="map-upload" type="file" accept="application/json,.json" onChange={(event) => uploadMap(event.target.files?.[0])} />
            <label htmlFor="map-upload"><span>↑</span><b>{customFile || "UPLOAD MAPPING JSON"}</b><small>{customFile ? "Validated locally" : '{ "A": 1, "B": 2 }'}</small></label>
            {customError && <p>{customError}</p>}
          </div>}
          {mode === "ancient" && <>
          <label htmlFor="verse-search">Search canonical verses</label>
          <div className="search-wrap">
            <span>⌕</span>
            <input id="verse-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference…" />
          </div>
          <div className="verse-options" role="listbox" aria-label="Verse results">
            {VERSES.filter((item) => `${item.ref} ${item.hebrew}`.toLowerCase().includes(query.toLowerCase()) || query === VERSES[0].ref).slice(0, 4).map((item) => {
              const index = VERSES.findIndex((verseItem) => verseItem.ref === item.ref);
              return <button key={item.ref} className={verse === item.hebrew ? "selected" : ""} onClick={() => selectVerse(index)}><span>{item.ref}</span><b dir="rtl">{item.hebrew}</b></button>;
            })}
          </div>
          </>}
          <label htmlFor="verse-text">{mode === "ancient" ? "Hebrew source" : "Source text"}</label>
          <textarea id="verse-text" dir={mode === "ancient" ? "rtl" : "ltr"} value={verse} onChange={(e) => { setVerse(e.target.value); setActive(false); }} spellCheck={false} placeholder={mode === "custom" && !analysis.mapEntries.length ? "Upload a mapping, then enter source text…" : "Enter source text…"} />
          <div className="input-meta"><span>{analysis.letters.length} mapped glyphs</span><span>UTF–8 / HEB</span></div>
          <button className="generate" onClick={() => setActive(true)} disabled={!analysis.total}><span>GENERATE MANDALA</span><b>↗</b></button>
        </div>

        <div className="visual-panel panel">
          <div className="panel-heading"><span>02 / OUTPUT</span><small>LIVE GEOMETRY</small></div>
          <div className="canvas-stage">
            <div className="axis horizontal" /><div className="axis vertical" />
            <MandalaCanvas ref={mandalaRef} data={analysis} active={active} />
            <div className="canvas-index top-left">Σ {analysis.total.toLocaleString()}</div>
            <div className="canvas-index top-right">ΦK {analysis.scale.toFixed(5)}</div>
            <div className="canvas-index bottom-left">{analysis.symmetry || "—"} FOLD SYMMETRY</div>
            <div className="canvas-index bottom-right">LIVE / {active ? "RUNNING" : "HOLD"}</div>
            <div className="frequency-readout"><strong>{analysis.phase.toFixed(0)}°</strong><span>PHASE</span><small>RADIAL FREQUENCY</small></div>
          </div>
          <div className="visual-footer"><span>DRAG CURSOR TO INSPECT PARALLAX</span><button onClick={() => setActive(!active)}>{active ? "Ⅱ PAUSE" : "▶ RESUME"}</button></div>
          <div className="artifact-tools">
            <div><span>TRACK C / ARTIFACT</span><small>{artifactStatus}</small></div>
            <button onClick={exportSvg} disabled={!analysis.total}>EXPORT SVG</button>
            <button onClick={exportPng} disabled={!analysis.total}>PNG</button>
            <button onClick={exportManifest} disabled={!analysis.total}>MANIFEST</button>
          </div>
          {manifestDigest && <div className="manifest-digest"><span>DRAFT KECCAK–256</span><code>{manifestDigest}</code></div>}
        </div>

        <aside className="audit-panel panel">
          <div className="tabs">
            <button className={tab === "audit" ? "active" : ""} onClick={() => setTab("audit")}>AUDIT</button>
            <button className={tab === "protocol" ? "active" : ""} onClick={() => setTab("protocol")}>PROTOCOL</button>
          </div>
          {tab === "audit" ? <>
            <div className="audit-title"><span>03 / TRACE</span><small>DETERMINISTIC</small></div>
            <div className="glyph-strip" dir="rtl">
              {analysis.letters.map((item, index) => <div key={`${item.raw}-${index}`}><b>{item.raw}</b><span>{item.value}</span></div>)}
            </div>
            <div className="equation-block">
              <div><span>RAW SUM</span><b>{analysis.total.toLocaleString()}</b></div>
              <p>{analysis.letters.slice(0, 10).map(item => item.value).join(" + ")}{analysis.letters.length > 10 ? " + …" : ""}</p>
              <div><span>BASE SYMMETRY</span><b>{analysis.symmetry || "—"} <i>petals</i></b></div>
              <p>Σ mod 12 + 3 → {analysis.symmetry || "—"}</p>
              <div><span>RADIAL FREQUENCY</span><b>{analysis.phase.toFixed(0)}°</b></div>
              <p>Σ mod 360 → {analysis.phase.toFixed(0)}° phase</p>
              <div><span>COLOR FREQUENCY</span><b className="color-value"><i style={{ backgroundColor: `hsl(${analysis.hue}, 72%, 58%)` }} />{analysis.hue.toFixed(0)}° HSL</b></div>
              <p>Σ mod 360 → hue {analysis.hue.toFixed(0)}°</p>
              <div className="result-row"><span>GOLDEN SCALE (K)</span><b>{analysis.scale.toFixed(5)}</b></div>
              <p>(Σ ÷ {analysis.maxPossibleSum.toLocaleString() || "MAX"}) × 1.618</p>
            </div>
            <div className="verification"><span>✓</span><div><b>REPRODUCIBLE OUTPUT</b><small>Identical source + protocol = identical form.</small></div></div>
            {protocolSeal && <div className="seal"><span>SHA–256 PROTOCOL SEAL</span><code>{protocolSeal}</code></div>}
          </> : <>
            <div className="audit-title"><span>{mode === "ancient" ? "MASTER_MAP" : mode === "latin" ? "LATIN_ALPHA" : "CUSTOM_MAP"}</span><small>1–{analysis.maxMapValue || "—"}</small></div>
            <p className="protocol-copy">{mode === "ancient" ? "Standard Aramaic/Hebrew alphabetic numerals. Hardcoded and immutable in Composer Protocol v1. Final letterforms normalize to their base letter." : mode === "latin" ? "Universal alphabetic mapping. Latin letters normalize to uppercase and resolve from A=1 through Z=26." : "User-supplied mapping validated from local JSON. It is deterministic for this mapping file, but is not the Malkuta historical baseline."}</p>
            <div className="map-grid" dir={mode === "ancient" ? "rtl" : "ltr"}>{analysis.mapEntries.map(([letter, value]) => <div key={letter}><b>{letter}</b><span>{value}</span></div>)}</div>
            <div className="protocol-note"><b>UNIVERSAL HARMONIC BRIDGE</b><span>No random seed. Root-60 remains specification-pending until its exact character matrix and alignment formula are ratified.</span></div>
          </>}
        </aside>
      </section>

      <section className="epoch-section" id="epoch-dashboard">
        <div className="epoch-heading">
          <p className="eyebrow"><span>04</span> FREEDOM ENGINE / EPOCH 2026</p>
          <h2>A living archive of<br /><em>what humanity seeks.</em></h2>
          <p>Annual mint events become an auditable research layer. Token provenance remains locked while each epoch publishes its own versioned summary.</p>
        </div>
        <div className="epoch-grid">
          <div className="epoch-master">
            <div className="epoch-label"><span>MASTER MANDALA</span><small>AGGREGATE OVERLAY</small></div>
            <div className="epoch-orbit"><i /><i /><i /><strong>2026</strong><span>AWAITING INDEXER</span></div>
          </div>
          <div className="epoch-metric"><span>AGGREGATE FREQUENCY</span><b>—</b><small>Σ OF VERIFIED MINT EVENTS</small></div>
          <div className="epoch-metric"><span>DOMINANT HUE</span><b>—°</b><small>HSL DISTRIBUTION</small></div>
          <div className="epoch-list"><div className="epoch-label"><span>MOST MINTED SOURCES</span><small>ON-CHAIN ONLY</small></div><p>No Base Sepolia mint events indexed yet. Requires an event indexer and manifest resolver.</p></div>
          <div className="epoch-list"><div className="epoch-label"><span>FREQUENCY HEATMAP</span><small>PRIVACY-SAFE</small></div><div className="heatmap">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ opacity: .08 + (index % 5) * .035 }} />)}</div><p>Activates from verified mints; searches are not tracked.</p></div>
        </div>
      </section>

      <section className="anchor-section">
        <div className="anchor-heading"><p className="eyebrow"><span>05</span> ON-CHAIN ANCHOR</p><h2>Truth, made permanent.</h2></div>
        <div className="anchor-copy"><p>At mint, the content hash, protocol version, and mapping digest are written with the token. No owner setter exists, so its provenance cannot be replaced later.</p><button onClick={() => setShowMint(!showMint)}>INSPECT TRACK A <span>↗</span></button></div>
        <div className="chain-specs">
          <div><span>CONTRACT</span><b>MALKUTA ENGINE</b><small>ERC–721 / TRACK A</small></div>
          <div><span>PROVENANCE</span><b>IMMUTABLE</b><small>WRITTEN AT MINT</small></div>
          <div><span>PROTOCOL BINDING</span><b>VERSION + DIGEST</b><small>PER TOKEN</small></div>
          <div><span>SUPPLY MODEL</span><b>INFINITE</b><small>ANNUAL SEALED EPOCHS</small></div>
        </div>
        {showMint && <div className="mint-notice"><span>TRACK A STAGED</span><p>MalkutaEngine stores contentHash, protocolVersion, and mappingDigest during _safeMint. Add the audited deployment address and ABI to activate submissions.</p><button onClick={connectWallet}>{wallet || "CONNECT WALLET"}</button></div>}
      </section>

      <footer><div className="brand footer-brand"><span className="brand-mark">K</span><span><strong>KINGDOM WITHIN</strong><small>MALKUTA PROTOCOL</small></span></div><p>THE SCRIPTURE IS THE SEED.<br />THE PROTOCOL IS THE PROOF.</p><span>© 2026 HOUSE OF JOSHI</span></footer>
    </main>
  );
}
