export const MASTER_MAP = [
  ["א", 1], ["ב", 2], ["ג", 3], ["ד", 4], ["ה", 5], ["ו", 6],
  ["ז", 7], ["ח", 8], ["ט", 9], ["י", 10], ["כ", 20], ["ל", 30],
  ["מ", 40], ["נ", 50], ["ס", 60], ["ע", 70], ["פ", 80], ["צ", 90],
  ["ק", 100], ["ר", 200], ["ש", 300], ["ת", 400],
] as const;

export const LATIN_MAP = Object.fromEntries(
  Array.from({ length: 26 }, (_, index) => [String.fromCharCode(65 + index), index + 1]),
) as Record<string, number>;

export const TEST_INPUTS = [
  { phrase: "Malkuta", role: "The Core Concept" },
  { phrase: "The Kingdom is Within", role: "The Principle" },
  { phrase: "In the beginning was the Word", role: "The Foundation" },
] as const;

const VALUE_MAP = Object.fromEntries(MASTER_MAP) as Record<string, number>;
const FINAL_FORMS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

export type MappingMode = "ancient" | "latin" | "custom";

export function analyzeVerse(text: string, mode: MappingMode, customMap: Record<string, number>) {
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
  return {
    letters,
    ignored,
    total,
    maxPossibleSum,
    maxMapValue,
    symmetry,
    phase,
    scale,
    hue: phase,
    mapEntries: Object.entries(activeMap),
  };
}
