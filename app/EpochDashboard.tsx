"use client";

import { useEffect, useRef, useState } from "react";

type EpochData = {
  status: "ready";
  indexedThroughBlock: string;
  epoch: { id: string; name: string; active: boolean };
  stats: {
    totalMinted: number;
    aggregateFrequency: number;
    dominantHue: number | null;
    averageScale: number;
    averageSymmetry: number;
    topSources: Array<{ source: string; count: number }>;
    topSignatures: Array<{ signature: number; count: number }>;
    hueDistribution: number[];
    frequencyDistribution: number[];
    masterMandala: Array<{ tokenId: string; symmetry: number; rotation: number; scale: number; hue: number }>;
  };
};

function MasterMandala({ forms }: { forms: EpochData["stats"]["masterMandala"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * ratio;
    canvas.height = size * ratio;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, size, size);
    const center = size / 2;
    forms.forEach((form, formIndex) => {
      const petals = Math.max(3, Math.round(form.symmetry));
      const radius = size * (.2 + (formIndex % 6) * .045);
      const rotation = form.rotation * Math.PI / 180;
      context.beginPath();
      for (let point = 0; point <= petals; point++) {
        const angle = point / petals * Math.PI * 2 + rotation;
        const modulation = Math.sin(angle * petals) * radius * Math.min(form.scale, 1.618) * .08;
        const x = center + Math.cos(angle) * (radius + modulation);
        const y = center + Math.sin(angle) * (radius + modulation);
        if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.strokeStyle = `hsla(${form.hue}, 68%, 62%, ${Math.max(.1, .5 - forms.length * .006)})`;
      context.lineWidth = .8;
      context.stroke();
    });
  }, [forms]);
  return <canvas ref={ref} aria-label={`Aggregate overlay of ${forms.length} verified mandalas`} />;
}

export function EpochDashboard() {
  const [data, setData] = useState<EpochData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/epoch");
        const result = await response.json() as EpochData;
        if (active && response.ok && result.status === "ready") { setData(result); setState("ready"); }
        else if (active) setState("unavailable");
      } catch { if (active) setState("unavailable"); }
    };
    load();
    const interval = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const maxFrequency = Math.max(1, ...(data?.stats.frequencyDistribution ?? [1]));
  const epochTitle = data ? `${data.epoch.name} / EPOCH ${data.epoch.id}` : "FREEDOM ENGINE / CURRENT EPOCH";
  return (
    <section className="epoch-section" id="epoch-dashboard">
      <div className="epoch-heading">
        <p className="eyebrow"><span>04</span> {epochTitle}</p>
        <h2>A living archive of<br /><em>what humanity seeks.</em></h2>
        <p>Verified Base mint events form an auditable research layer. Only manifests matching their immutable on-chain hash enter the aggregate.</p>
      </div>
      <div className="epoch-grid">
        <div className="epoch-master">
          <div className="epoch-label"><span>MASTER MANDALA</span><small>VERIFIED AGGREGATE</small></div>
          <div className="epoch-orbit">
            {data?.stats.masterMandala.length ? <MasterMandala forms={data.stats.masterMandala} /> : <><i /><i /><i /></>}
            <strong>{state === "loading" ? "…" : data?.stats.totalMinted ?? "0"}</strong>
            <span>{state === "ready" ? "VERIFIED MANDALAS" : state === "loading" ? "READING BASE MAINNET" : "INDEXER TEMPORARILY UNAVAILABLE"}</span>
          </div>
        </div>
        <div className="epoch-metric"><span>AGGREGATE FREQUENCY</span><b>{data?.stats.aggregateFrequency.toLocaleString() ?? "—"}</b><small>Σ OF VERIFIED SIGNATURES</small></div>
        <div className="epoch-metric"><span>DOMINANT HUE</span><b>{data?.stats.dominantHue === null || !data ? "—°" : `${data.stats.dominantHue}°`}</b><small>30° HSL DISTRIBUTION</small></div>
        <div className="epoch-list"><div className="epoch-label"><span>MOST MINTED SOURCES</span><small>ON-CHAIN VERIFIED</small></div>{data?.stats.topSources.length ? <ol>{data.stats.topSources.map((item) => <li key={item.source}><span>{item.source}</span><b>×{item.count}</b></li>)}</ol> : <p>{state === "unavailable" ? "Mint statistics are unavailable until the Base index reconnects." : "No verified mints in this epoch yet."}</p>}</div>
        <div className="epoch-list"><div className="epoch-label"><span>FREQUENCY DISTRIBUTION</span><small>Σ MOD 28</small></div><div className="heatmap">{Array.from({ length: 28 }, (_, index) => <i key={index} title={`Bucket ${index}: ${data?.stats.frequencyDistribution[index] ?? 0}`} style={{ opacity: data ? .1 + (data.stats.frequencyDistribution[index] / maxFrequency) * .9 : .08 }} />)}</div><p>{data?.stats.topSignatures.length ? `Leading signatures: ${data.stats.topSignatures.slice(0, 4).map((item) => `${item.signature} ×${item.count}`).join(" · ")}` : "The distribution activates from verified mints."}</p></div>
      </div>
      {data && <div className="epoch-proof"><span>BASE MAINNET · BLOCK {data.indexedThroughBlock}</span><span>AVG SYMMETRY {data.stats.averageSymmetry.toFixed(2)} · AVG SCALE {data.stats.averageScale.toFixed(4)}</span></div>}
      {state === "unavailable" && <div className="epoch-proof"><span>BASE INDEXER TEMPORARILY UNAVAILABLE</span><span>NO EMPTY-EPOCH ASSUMPTION HAS BEEN MADE</span></div>}
    </section>
  );
}
