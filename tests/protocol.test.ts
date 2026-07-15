import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeVerse,
  canonicalProtocolPayload,
  createCanonicalManifest,
  MASTER_MAP,
  manifestKeccak256,
  normalizeText,
  renderCanonicalSvg,
  sha256Hex,
} from "../lib/protocol.ts";

test("the immutable historical MASTER_MAP remains 22 glyphs from 1 through 400", () => {
  assert.equal(MASTER_MAP.length, 22);
  assert.deepEqual(MASTER_MAP[0], ["א", 1]);
  assert.deepEqual(MASTER_MAP[21], ["ת", 400]);
});

const cases = [
  { phrase: "Malkuta", total: 79, symmetry: 10, phase: 79, scale: 0.7023186813186814 },
  { phrase: "The Kingdom is Within", total: 217, symmetry: 4, phase: 217, scale: 0.7502264957264958 },
  { phrase: "In the beginning was the Word", total: 273, symmetry: 12, phase: 273, scale: 0.707875 },
];

for (const expected of cases) {
  test(`Latin-Alpha signature remains stable: ${expected.phrase}`, () => {
    const result = analyzeVerse(expected.phrase, "latin", {});
    assert.equal(result.total, expected.total);
    assert.equal(result.symmetry, expected.symmetry);
    assert.equal(result.phase, expected.phase);
    assert.equal(result.hue, expected.phase);
    assert.ok(Math.abs(result.scale - expected.scale) < 1e-12);
  });
}

test("NFKD normalization strips separators, punctuation, niqqud, and combining marks", () => {
  assert.equal(normalizeText("  מַלְכוּת! ", "ancient"), "מלכות");
  assert.equal(normalizeText("Málkuta #001", "latin"), "MALKUTA");
});

test("final Hebrew forms normalize to base MASTER_MAP glyphs", () => {
  assert.equal(normalizeText("מלך", "ancient"), "מלכ");
});

test("canonical payload and SHA-256 seal are stable", async () => {
  const data = analyzeVerse("Malkuta", "latin", {});
  assert.equal(
    canonicalProtocolPayload(data),
    'MALKUTAlatin_alpha1.0.0{"numericalSignature":79,"symmetry":10,"rotation":79,"scale":0.702318681319,"hue":79}',
  );
  assert.equal((await sha256Hex(canonicalProtocolPayload(data))).length, 66);
});

test("manifest and SVG embed the same audited protocol values", async () => {
  const data = analyzeVerse("Malkuta", "latin", {});
  const manifest = await createCanonicalManifest("Malkuta", "ipfs://IMAGE_CID", data);
  assert.equal(manifest.protocol.mapping_mode, "latin_alpha");
  assert.equal(manifest.attributes[3].value, 79);
  const svg = renderCanonicalSvg(data);
  assert.match(svg, /<svg/);
  assert.match(svg, /"numericalSignature":79/);
  assert.doesNotMatch(svg, /Math\.random|Date\.now/);
  assert.match(manifestKeccak256(manifest), /^0x[0-9a-f]{64}$/);
});
