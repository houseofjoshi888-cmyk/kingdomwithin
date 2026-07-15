import assert from "node:assert/strict";
import test from "node:test";
import { aggregateEpoch, type IndexedMandala } from "../lib/epoch.ts";

const mandala = (overrides: Partial<IndexedMandala>): IndexedMandala => ({
  tokenId: "1", owner: "0x1", transactionHash: "0x1", timestamp: 1,
  sourceText: "Malkuta", mappingMode: "root_60", metadataURI: "ipfs://one", imageURI: "ipfs://image",
  numericalSignature: 1402, symmetry: 11, rotation: 242, scale: .892, hue: 180,
  priceWei: "10000000000000000", ...overrides,
});

test("epoch aggregation produces deterministic verified dashboard statistics", () => {
  const stats = aggregateEpoch([
    mandala({ tokenId: "1" }),
    mandala({ tokenId: "2", numericalSignature: 100, hue: 190 }),
    mandala({ tokenId: "3", sourceText: "The Word", numericalSignature: 100, hue: 20, priceWei: "0" }),
  ]);
  assert.equal(stats.totalMinted, 3);
  assert.equal(stats.totalVolumeWei, "20000000000000000");
  assert.equal(stats.aggregateFrequency, 1602);
  assert.deepEqual(stats.topSources[0], { source: "Malkuta", count: 2 });
  assert.deepEqual(stats.topSignatures[0], { signature: 100, count: 2 });
  assert.equal(stats.dominantHue, 195);
  assert.equal(stats.hueDistribution.reduce((sum, count) => sum + count, 0), 3);
  assert.equal(stats.frequencyDistribution.reduce((sum, count) => sum + count, 0), 3);
  assert.equal(stats.masterMandala.length, 3);
});
