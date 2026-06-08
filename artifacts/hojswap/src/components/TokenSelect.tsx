import { useMemo } from "react";
import { Token, tokenId } from "@/lib/tokens";

export function TokenSelect({
  tokens,
  value,
  onChange,
}: {
  tokens: Token[];
  value: Token;
  onChange: (t: Token) => void;
}) {
  const options = useMemo(
    () =>
      tokens.map((t) => ({
        id: tokenId(t),
        symbol: t.symbol,
        name: t.name,
      })),
    [tokens],
  );

  return (
    <div className="relative w-full">
      <select
        className="w-full appearance-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 pr-10 text-sm text-white outline-none ring-0 hover:border-[rgba(212,175,55,0.25)] focus:border-[rgba(212,175,55,0.45)]"
        value={tokenId(value)}
        onChange={(e) => {
          const id = e.target.value;
          const next = tokens.find((t) => tokenId(t) === id);
          if (next) onChange(next);
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.symbol} — {o.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
        ▾
      </div>
    </div>
  );
}
