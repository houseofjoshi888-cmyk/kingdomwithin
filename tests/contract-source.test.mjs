import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../contracts/MalkutaEngine.sol", import.meta.url), "utf8");

test("Track A provenance is written during safe mint", () => {
  assert.match(source, /_safeMint\(to, tokenId\)/);
  assert.match(source, /provenance\[tokenId\]\s*=\s*TokenProvenance\(_version, _digest, _contentHash\)/);
  assert.match(source, /emit MandalaMinted\(tokenId, _contentHash, _version\)/);
});

test("Track A exposes no owner provenance override", () => {
  assert.doesNotMatch(source, /setContentHash/);
  assert.doesNotMatch(source, /setProvenance/);
});
