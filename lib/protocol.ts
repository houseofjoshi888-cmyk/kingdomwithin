import { keccak256, toBytes } from "viem";

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

export const PROTOCOL_VERSION = "1.0.0";
export const PHI = 1.618;

const VALUE_MAP = Object.fromEntries(MASTER_MAP) as Record<string, number>;
const FINAL_FORMS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

export type MappingMode = "ancient" | "latin" | "custom";

export const MAPPING_MODE_IDS: Record<MappingMode, string> = {
  ancient: "aramaic_standard",
  latin: "latin_alpha",
  custom: "custom",
};

function canonicalGlyph(raw: string, mode: MappingMode) {
  const decomposed = raw.normalize("NFKD");
  if (mode === "ancient") return FINAL_FORMS[decomposed] ?? decomposed;
  if (mode === "latin") return decomposed.toUpperCase();
  return decomposed;
}

export function normalizeText(text: string, mode: MappingMode, customMap: Record<string, number> = {}) {
  const activeMap = mode === "ancient" ? VALUE_MAP : mode === "latin" ? LATIN_MAP : customMap;
  return Array.from(text.normalize("NFKD"))
    .filter((character) => /\p{L}/u.test(character))
    .map((character) => canonicalGlyph(character, mode))
    .filter((character) => Object.hasOwn(activeMap, character))
    .join("");
}

export function analyzeVerse(text: string, mode: MappingMode, customMap: Record<string, number>) {
  const activeMap = mode === "ancient" ? VALUE_MAP : mode === "latin" ? LATIN_MAP : customMap;
  const decomposedText = text.normalize("NFKD");
  const letters = Array.from(decomposedText).flatMap((raw) => {
    if (!/\p{L}/u.test(raw)) return [];
    const normalized = canonicalGlyph(raw, mode);
    const value = activeMap[normalized];
    return value ? [{ raw, normalized, value }] : [];
  });
  const ignored = Array.from(decomposedText).filter((char) => /\p{L}/u.test(char) && !activeMap[canonicalGlyph(char, mode)]);
  const total = letters.reduce((sum, item) => sum + item.value, 0);
  const maxMapValue = Math.max(0, ...Object.values(activeMap));
  const maxPossibleSum = letters.length * maxMapValue;
  const symmetry = total ? (total % 12) + 3 : 0;
  const phase = total ? total % 360 : 0;
  const scale = maxPossibleSum ? (total / maxPossibleSum) * PHI : 0;
  return {
    normalizedText: letters.map(({ normalized }) => normalized).join(""),
    mappingMode: MAPPING_MODE_IDS[mode],
    protocolVersion: PROTOCOL_VERSION,
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


export type Analysis = ReturnType<typeof analyzeVerse>;

export function geometryParams(data: Analysis) {
  return {
    numericalSignature: data.total,
    symmetry: data.symmetry,
    rotation: data.phase,
    scale: Number(data.scale.toFixed(12)),
    hue: data.hue,
  } as const;
}

export function canonicalProtocolPayload(data: Analysis) {
  return `${data.normalizedText}${data.mappingMode}${data.protocolVersion}${JSON.stringify(geometryParams(data))}`;
}

export async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function createCanonicalManifest(sourceText: string, imageUri: string, data: Analysis) {
  const protocolSeal = await sha256Hex(canonicalProtocolPayload(data));
  return {
    name: "Malkuta Mandala",
    description: "A sovereign digital heirloom generated via the Malkuta Frequency Protocol.",
    image: imageUri,
    protocol: {
      version: data.protocolVersion,
      mapping_mode: data.mappingMode,
      normalized_text: data.normalizedText,
      canonical_sha256: protocolSeal,
    },
    attributes: [
      { trait_type: "Source Text", value: sourceText },
      { trait_type: "Protocol Version", value: data.protocolVersion },
      { trait_type: "Mapping Mode", value: data.mappingMode },
      { trait_type: "Numerical Signature", value: data.total },
      { trait_type: "Symmetry (Petals)", value: data.symmetry },
      { trait_type: "Rotation (Phase)", value: data.phase },
      { trait_type: "Scale (Phi)", value: Number(data.scale.toFixed(12)) },
      { trait_type: "Color (Hue)", value: data.hue },
      { trait_type: "Canonical Seal (SHA-256)", value: protocolSeal },
    ],
  };
}

export function manifestKeccak256(manifest: Awaited<ReturnType<typeof createCanonicalManifest>>) {
  return keccak256(toBytes(JSON.stringify(manifest)));
}

export function renderCanonicalSvg(data: Analysis, size = 1600) {
  const center = size / 2;
  const maxRadius = size * 0.39;
  const phaseOffset = data.phase * Math.PI / 180;
  const polygons = Array.from({ length: 6 }, (_, index) => {
    const ring = index + 1;
    const radialCurve = Math.pow(ring / 6, Math.max(0.38, 1 - data.scale));
    const radius = maxRadius * radialCurve;
    const phase = (ring % 2 ? 1 : -1) * phaseOffset * (ring * 0.36 + 1);
    const points = Array.from({ length: data.symmetry }, (_, point) => {
      const angle = (point / data.symmetry) * Math.PI * 2 + phase;
      const modulation = Math.sin(angle * data.symmetry + phaseOffset + ring) * (radius * data.scale * 0.09);
      return `${(center + Math.cos(angle) * (radius + modulation)).toFixed(3)},${(center + Math.sin(angle) * (radius + modulation)).toFixed(3)}`;
    }).join(" ");
    const hue = ring % 3 === 0 ? data.hue : (data.hue + 38) % 360;
    return `<polygon points="${points}" fill="none" stroke="hsl(${hue} 72% 62%)" stroke-opacity="${ring % 3 === 0 ? ".72" : ".48"}" stroke-width="${ring === 6 ? "2.4" : "1.4"}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Malkuta Mandala numerical signature ${data.total}"><rect width="100%" height="100%" fill="#0b0d0c"/><g transform="rotate(${data.phase} ${center} ${center})">${polygons}</g><circle cx="${center}" cy="${center}" r="${(maxRadius * 1.08).toFixed(3)}" fill="none" stroke="#d4a95e" stroke-opacity=".38" stroke-width="1.5"/><metadata>${JSON.stringify({ protocolVersion: data.protocolVersion, mappingMode: data.mappingMode, normalizedText: data.normalizedText, ...geometryParams(data) })}</metadata></svg>`;
}
