"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MASTER_MAP = [
  ["א", 1], ["ב", 2], ["ג", 3], ["ד", 4], ["ה", 5], ["ו", 6],
  ["ז", 7], ["ח", 8], ["ט", 9], ["י", 10], ["כ", 20], ["ל", 30],
  ["מ", 40], ["נ", 50], ["ס", 60], ["ע", 70], ["פ", 80], ["צ", 90],
  ["ק", 100], ["ר", 200], ["ש", 300], ["ת", 400],
] as const;

const VALUE_MAP = Object.fromEntries(MASTER_MAP) as Record<string, number>;
const LATIN_MAP = Object.fromEntries(Array.from({ length: 26 }, (_, index) => [String.fromCharCode(65 + index), index + 1])) as Record<string, number>;
const FINAL_FORMS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
type MappingMode = "ancient" | "latin" | "custom";

const VERSES = [
  { ref: "Genesis 1:1", hebrew: "בראשית ברא אלהים את השמים ואת הארץ" },
  { ref: "Exodus 3:14", hebrew: "אהיה אשר אהיה" },
  { ref: "Deuteronomy 6:4", hebrew: "שמע ישראל יהוה אלהינו יהוה אחד" },
  { ref: "Psalm 23:1", hebrew: "יהוה רעי לא אחסר" },
  { ref: "Psalm 119:105", hebrew: "נר לרגלי דברך ואור לנתיבתי" },
] as const;

function analyzeVerse(text: string, mode: MappingMode, customMap: Record<string, number>) {
  const activeMap = mode === "ancient" ? VALUE_MAP : mode === "latin" ? LATIN_MAP : customMap;
  const letters = Array.from(text).flatMap((raw) => {
    const normalized = mode === "ancient" ? (FINAL_FORMS[raw] ?? raw) : mode === "latin" ? raw.toUpperCase() : raw;
    const value = activeMap[normalized];
    return value ? [{ raw, normalized, value }] : [];
  });
  const ignored = Array.from(text).filter((char) => {
    const normalized = mode === "ancient" ? (FINAL_FORMS[char] ?? char) : mode === "latin" ? char.toUpperCase() : char;
    return !activeMap[normalized] && !/\s|[\u0591-\u05C7]|[.,;:!?—–\-'"()]/u.test(char);
  });
  const total = letters.reduce((sum, item) => sum + item.value, 0);
  const maxMapValue = Math.max(0, ...Object.values(activeMap));
  const maxPossibleSum = letters.length * maxMapValue;
  const symmetry = total ? (total % 12) + 3 : 0;
  const phase = total ? total % 360 : 0;
  const scale = maxPossibleSum ? (total / maxPossibleSum) * 1.618 : 0;
  const mapEntries = Object.entries(activeMap);
  return { letters, ignored, total, maxPossibleSum, maxMapValue, symmetry, phase, scale, hue: phase, mapEntries };
}

function MandalaCanvas({ data, active }: { data: ReturnType<typeof analyzeVerse>; active: boolean }) {
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
}

export default function Home() {
  const [verse, setVerse] = useState(VERSES[0].hebrew);
  const [query, setQuery] = useState(VERSES[0].ref);
  const [mode, setMode] = useState<MappingMode>("ancient");
  const [customMap, setCustomMap] = useState<Record<string, number>>({});
  const [customFile, setCustomFile] = useState("");
  const [customError, setCustomError] = useState("");
  const [active, setActive] = useState(true);
  const [tab, setTab] = useState<"audit" | "protocol">("audit");
  const [wallet, setWallet] = useState("");
  const [showMint, setShowMint] = useState(false);
  const analysis = useMemo(() => analyzeVerse(verse, mode, customMap), [verse, mode, customMap]);

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
        <a className="brand" href="#composer" aria-label="Malkuta home">
          <span className="brand-mark">M</span>
          <span><strong>MALKUTA</strong><small>FREQUENCY COMPOSER</small></span>
        </a>
        <div className="status-line"><span className="pulse" /> PROTOCOL V1.0 <i /> BASE READY</div>
        <button className="wallet-button" onClick={connectWallet}>{wallet || "CONNECT WALLET"}<span>↗</span></button>
      </header>

      <section className="intro" id="composer">
        <div>
          <p className="eyebrow"><span>01</span> SCRIPTURE → SIGNAL → FORM</p>
          <h1>Sacred text,<br /><em>made measurable.</em></h1>
        </div>
        <p className="intro-copy">A precision instrument that translates Hebrew scripture into verifiable harmonic frequency and deterministic geometric form.</p>
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
            <MandalaCanvas data={analysis} active={active} />
            <div className="canvas-index top-left">Σ {analysis.total.toLocaleString()}</div>
            <div className="canvas-index top-right">ΦK {analysis.scale.toFixed(5)}</div>
            <div className="canvas-index bottom-left">{analysis.symmetry || "—"} FOLD SYMMETRY</div>
            <div className="canvas-index bottom-right">LIVE / {active ? "RUNNING" : "HOLD"}</div>
            <div className="frequency-readout"><strong>{analysis.phase.toFixed(0)}°</strong><span>PHASE</span><small>RADIAL FREQUENCY</small></div>
          </div>
          <div className="visual-footer"><span>DRAG CURSOR TO INSPECT PARALLAX</span><button onClick={() => setActive(!active)}>{active ? "Ⅱ PAUSE" : "▶ RESUME"}</button></div>
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
          </> : <>
            <div className="audit-title"><span>{mode === "ancient" ? "MASTER_MAP" : mode === "latin" ? "LATIN_ALPHA" : "CUSTOM_MAP"}</span><small>1–{analysis.maxMapValue || "—"}</small></div>
            <p className="protocol-copy">{mode === "ancient" ? "Standard Aramaic/Hebrew alphabetic numerals. Hardcoded and immutable in Composer Protocol v1. Final letterforms normalize to their base letter." : mode === "latin" ? "Universal alphabetic mapping. Latin letters normalize to uppercase and resolve from A=1 through Z=26." : "User-supplied mapping validated from local JSON. It is deterministic for this mapping file, but is not the Malkuta historical baseline."}</p>
            <div className="map-grid" dir={mode === "ancient" ? "rtl" : "ltr"}>{analysis.mapEntries.map(([letter, value]) => <div key={letter}><b>{letter}</b><span>{value}</span></div>)}</div>
            <div className="protocol-note"><b>NO RANDOM SEED</b><span>Geometry is derived only from the audited values.</span></div>
          </>}
        </aside>
      </section>

      <section className="anchor-section">
        <div className="anchor-heading"><p className="eyebrow"><span>04</span> ON-CHAIN ANCHOR</p><h2>Truth, made permanent.</h2></div>
        <div className="anchor-copy"><p>When minted, the exact source text is hashed and anchored to its token on Base. The artwork can be recreated; the provenance cannot be altered.</p><button onClick={() => setShowMint(!showMint)}>PREPARE MINT <span>↗</span></button></div>
        <div className="chain-specs">
          <div><span>CONTRACT</span><b>JOSHI HOUSE</b><small>ERC–721</small></div>
          <div><span>NETWORK</span><b>BASE</b><small>CHAIN ID 8453</small></div>
          <div><span>MAX SUPPLY</span><b>5,664</b><small>FIXED</small></div>
          <div><span>MINT PRICE</span><b>0.01 ETH</b><small>PER TOKEN</small></div>
        </div>
        {showMint && <div className="mint-notice"><span>CONTRACT READY</span><p>Wallet connection is available. Add the deployed JoshiHouse contract address to activate on-chain mint submission.</p><button onClick={connectWallet}>{wallet || "CONNECT WALLET"}</button></div>}
      </section>

      <footer><div className="brand footer-brand"><span className="brand-mark">M</span><span><strong>MALKUTA</strong><small>FREQUENCY COMPOSER</small></span></div><p>THE SCRIPTURE IS THE SEED.<br />THE PROTOCOL IS THE PROOF.</p><span>© 2026 HOUSE OF JOSHI</span></footer>
    </main>
  );
}
