import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeVerse,
  calculateRoot60,
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
  { phrase: "Malkuta", total: 299, symmetry: 14, phase: 299, scale: 1.1713849878934626 },
  { phrase: "The Kingdom is Within", total: 769, symmetry: 4, phase: 49, scale: 1.17160263653484 },
  { phrase: "In the beginning was the Word", total: 1073, symmetry: 8, phase: 353, scale: 1.2260692090395482 },
];

for (const expected of cases) {
  test(`Root-60 signature remains stable: ${expected.phrase}`, () => {
    const result = analyzeVerse(expected.phrase, "root60", {});
    assert.equal(result.total, expected.total);
    assert.equal(result.symmetry, expected.symmetry);
    assert.equal(result.phase, expected.phase);
    assert.equal(result.hue, expected.phase);
    assert.ok(Math.abs(result.scale - expected.scale) < 1e-12);
  });
}

test("NFKD normalization strips separators, punctuation, niqqud, and combining marks", () => {
  assert.equal(normalizeText("  מַלְכוּת! ", "ancient"), "מלכות");
  assert.equal(normalizeText("Málkuta #001", "root60"), "Malkuta001");
});

test("Root-60 uses the ratified charCode modulo 60 alignment protocol", () => {
  assert.deepEqual(calculateRoot60("Malkuta"), {
    normalized: "Malkuta",
    sum: 299,
    alignmentConstant: 299,
    metadata: { mode: "Root-60", constant: 299 },
  });
  assert.equal(calculateRoot60("x").sum, 0);
});

test("final Hebrew forms normalize to base MASTER_MAP glyphs", () => {
  assert.equal(normalizeText("מלך", "ancient"), "מלכ");
});

test("canonical payload and SHA-256 seal are stable", async () => {
  const data = analyzeVerse("Malkuta", "root60", {});
  assert.equal(
    canonicalProtocolPayload(data),
    'Malkutaroot_602.0.0{"numericalSignature":299,"symmetry":14,"rotation":299,"scale":1.171384987893,"hue":299,"alignmentConstant":299}',
  );
  assert.equal((await sha256Hex(canonicalProtocolPayload(data))).length, 66);
});

test("manifest and SVG embed the same audited protocol values", async () => {
  const data = analyzeVerse("Malkuta", "root60", {});
  const manifest = await createCanonicalManifest("Malkuta", "ipfs://IMAGE_CID", data);
  assert.equal(manifest.protocol.mapping_mode, "root_60");
  assert.equal(manifest.protocol.alignment_mode, "Root-60");
  assert.equal(manifest.protocol.alignment_constant, 299);
  assert.equal(manifest.attributes[3].value, 299);
  const svg = renderCanonicalSvg(data);
  assert.match(svg, /<svg/);
  assert.match(svg, /"numericalSignature":299/);
  assert.doesNotMatch(svg, /Math\.random|Date\.now/);
  assert.match(manifestKeccak256(manifest), /^0x[0-9a-f]{64}$/);
});
