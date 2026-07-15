import assert from "node:assert/strict";
import test from "node:test";
import { analyzeVerse, MASTER_MAP } from "../lib/protocol.ts";

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
