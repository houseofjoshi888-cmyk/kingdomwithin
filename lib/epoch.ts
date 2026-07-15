export type IndexedMandala = {
  tokenId: string;
  owner: string;
  transactionHash: string;
  timestamp: number;
  sourceText: string;
  mappingMode: string;
  metadataURI: string;
  imageURI: string;
  numericalSignature: number;
  symmetry: number;
  rotation: number;
  scale: number;
  hue: number;
  priceWei: string;
};

export type EpochAggregate = {
  totalMinted: number;
  totalVolumeWei: string;
  aggregateFrequency: number;
  dominantHue: number | null;
  averageScale: number;
  averageSymmetry: number;
  topSources: Array<{ source: string; count: number }>;
  topSignatures: Array<{ signature: number; count: number }>;
  hueDistribution: number[];
  frequencyDistribution: number[];
  masterMandala: Array<Pick<IndexedMandala, "tokenId" | "symmetry" | "rotation" | "scale" | "hue">>;
};

const HUE_BUCKETS = 12;
const FREQUENCY_BUCKETS = 28;

export function aggregateEpoch(mandalas: IndexedMandala[]): EpochAggregate {
  const hueDistribution = Array.from({ length: HUE_BUCKETS }, () => 0);
  const frequencyDistribution = Array.from({ length: FREQUENCY_BUCKETS }, () => 0);
  const sources = new Map<string, number>();
  const signatures = new Map<number, number>();
  let aggregateFrequency = 0;
  let totalScale = 0;
  let totalSymmetry = 0;
  let totalVolume = BigInt(0);

  for (const mandala of mandalas) {
    const hue = ((Math.round(mandala.hue) % 360) + 360) % 360;
    const signature = Math.max(0, Math.round(mandala.numericalSignature));
    hueDistribution[Math.floor(hue / (360 / HUE_BUCKETS))]++;
    frequencyDistribution[signature % FREQUENCY_BUCKETS]++;
    aggregateFrequency += signature;
    totalScale += mandala.scale;
    totalSymmetry += mandala.symmetry;
    totalVolume += BigInt(mandala.priceWei || "0");
    if (mandala.sourceText) sources.set(mandala.sourceText, (sources.get(mandala.sourceText) ?? 0) + 1);
    signatures.set(signature, (signatures.get(signature) ?? 0) + 1);
  }

  const dominantBucket = hueDistribution.reduce((best, count, index, values) => count > values[best] ? index : best, 0);
  const ranked = <T,>(entries: Array<[T, number]>) => entries.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));

  return {
    totalMinted: mandalas.length,
    totalVolumeWei: totalVolume.toString(),
    aggregateFrequency,
    dominantHue: mandalas.length ? dominantBucket * 30 + 15 : null,
    averageScale: mandalas.length ? totalScale / mandalas.length : 0,
    averageSymmetry: mandalas.length ? totalSymmetry / mandalas.length : 0,
    topSources: ranked(Array.from(sources)).slice(0, 5).map(([source, count]) => ({ source, count })),
    topSignatures: ranked(Array.from(signatures)).slice(0, 8).map(([signature, count]) => ({ signature, count })),
    hueDistribution,
    frequencyDistribution,
    masterMandala: mandalas.slice(-48).map(({ tokenId, symmetry, rotation, scale, hue }) => ({ tokenId, symmetry, rotation, scale, hue })),
  };
}
