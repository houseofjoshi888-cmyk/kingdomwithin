export function clampToDecimals(value: string, decimals: number) {
  if (!value.includes(".")) return value;
  const [i, f] = value.split(".");
  return `${i}.${(f ?? "").slice(0, Math.max(0, decimals))}`;
}

export function isValidNumberInput(v: string) {
  return /^(\d+(\.\d*)?|\.\d+)$/.test(v) || v === "";
}

const DEFAULT_SWAP_MAX_FRACTION_DIGITS = 6;
const LARGE_NUMBER_COMPACT_THRESHOLD = 1_000_000;

export function formatCompactNumber(value: number, maxFractionDigits: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return "0";

  const options: Intl.NumberFormatOptions = {
    maximumFractionDigits: value >= LARGE_NUMBER_COMPACT_THRESHOLD ? 4 : maxFractionDigits,
  };

  if (value >= LARGE_NUMBER_COMPACT_THRESHOLD) {
    options.notation = "compact";
  }

  return value.toLocaleString(undefined, options);
}

export function formatNumberDisplay(value: number, maxFractionDigits = DEFAULT_SWAP_MAX_FRACTION_DIGITS): string {
  return formatCompactNumber(value, maxFractionDigits);
}

export function formatUsdDisplay(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return "$0";

  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: maxFractionDigits,
  };

  if (value >= LARGE_NUMBER_COMPACT_THRESHOLD) {
    options.notation = "compact";
  }

  return value.toLocaleString(undefined, options);
}

export function formatSwapAmountDisplay(raw: string, maxFractionDigits = DEFAULT_SWAP_MAX_FRACTION_DIGITS): string {
  const cleaned = String(raw ?? "").trim().replaceAll(",", "");
  // If the cleaned string is empty or clearly zero, return "0"
  if (!cleaned || /^0+(?:\.0+)?$/.test(cleaned)) return "0";

  const n = Number(cleaned);
  if (!Number.isFinite(n)) {
    console.warn("[formatSwapAmountDisplay] Invalid input:", raw, "-> NaN");
    return "0";
  }

  // Handle very small non-zero values that would round to 0 with limited fraction digits.
  if (n !== 0 && Math.abs(n) < 10 ** -maxFractionDigits) {
    return `<0.${"0".repeat(maxFractionDigits - 1)}1`;
  }

  const result = formatCompactNumber(n, maxFractionDigits);
  return result || "0"; // Ensure we never return empty string
}

export function formatBalanceDisplay(
  value: bigint,
  decimals: number,
  symbol: string,
): string {
  const raw = Number(value) / 10 ** decimals;
  if (raw === 0) return `0 ${symbol}`;
  if (raw < 0.0001) return `<0.0001 ${symbol}`;

  const formatted = formatCompactNumber(raw, raw >= 1 ? 4 : 6);
  return `${formatted} ${symbol}`;
}
