import { useId, useState } from "react";

const PRESETS = [
  { label: "0.5%", bps: 50 },
  { label: "1%", bps: 100 },
  { label: "2%", bps: 200 },
] as const;

const MIN_BPS = 1;
const MAX_BPS = 5000;
const STORAGE_KEY = "hojswap-slippage-bps";

export function loadSlippageBps(): number {
  if (typeof window === "undefined") return 100;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : 100;
  if (!Number.isFinite(n) || n < MIN_BPS || n > MAX_BPS) return 100;
  return Math.round(n);
}

export function SlippageSettings({
  slippageBps,
  onChange,
  embedded = false,
}: {
  slippageBps: number;
  onChange: (bps: number) => void;
  embedded?: boolean;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const displayPct = (slippageBps / 100).toFixed(2);

  function applyCustom() {
    const pct = Number(customInput.replaceAll(",", "."));
    if (!Number.isFinite(pct) || pct <= 0) return;
    const bps = Math.round(pct * 100);
    const clamped = Math.min(MAX_BPS, Math.max(MIN_BPS, bps));
    onChange(clamped);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(clamped));
  }

  function selectPreset(bps: number) {
    onChange(bps);
    setCustomInput("");
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(bps));
  }

  const panel = (
    <div className={embedded ? "space-y-3" : "absolute right-0 z-50 mt-2 w-[min(100vw-2rem,280px)] rounded-2xl border border-white/10 bg-[#101012] p-3 shadow-2xl"}>
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Slippage tolerance</div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.bps}
            type="button"
            onClick={() => selectPreset(p.bps)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              slippageBps === p.bps
                ? "bg-[rgba(212,175,55,0.95)] text-black"
                : "border border-white/10 bg-black/30 text-white/80 hover:border-[rgba(212,175,55,0.25)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`${panelId}-custom`}>Custom slippage percent</label>
        <input
          id={`${panelId}-custom`}
          inputMode="decimal"
          placeholder="Custom %"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className="hoj-input h-10 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-[rgba(212,175,55,0.45)]"
        />
        <button
          type="button"
          onClick={applyCustom}
          className="h-10 shrink-0 rounded-xl border border-[rgba(212,175,55,0.35)] px-3 text-sm font-medium text-[rgba(212,175,55,0.95)] hover:bg-[rgba(212,175,55,0.12)]"
        >
          Set
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-white/40">Current: {displayPct}%. Range 0.01%–50%.</p>
    </div>
  );

  if (embedded) return panel;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70 hover:border-[rgba(212,175,55,0.3)]"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="uppercase tracking-[0.14em]">Slippage</span>
        <span className="font-semibold text-[rgba(212,175,55,0.95)]">{displayPct}%</span>
        <span className="text-white/40">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/40 sm:bg-transparent"
            aria-label="Close slippage settings"
            onClick={() => setOpen(false)}
          />
          <div id={panelId}>{panel}</div>
        </>
      ) : null}
    </div>
  );
}
