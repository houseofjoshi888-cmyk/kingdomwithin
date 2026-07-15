import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../contracts/MalkutaEngine.sol", import.meta.url), "utf8");

test("the corrected contract source stores epoch provenance during safe mint", () => {
  assert.match(source, /_safeMint\(msg\.sender, tokenId\)/);
  assert.match(source, /tokenProvenance\[tokenId\]\s*=\s*Provenance/);
  assert.match(source, /epochId:\s*currentEpochId/);
  assert.match(source, /timestamp:\s*block\.timestamp/);
  assert.match(source, /emit MandalaMinted\(tokenId, currentEpochId, _contentHash\)/);
});

test("the corrected contract exposes no provenance override", () => {
  assert.doesNotMatch(source, /setContentHash/);
  assert.doesNotMatch(source, /setProvenance/);
});

test("the corrected source checks unused token IDs without reverting", () => {
  assert.match(source, /_ownerOf\(tokenId\)\s*==\s*address\(0\)/);
  assert.doesNotMatch(source, /require\(ownerOf\(tokenId\)/);
});

test("Genesis epoch and role-based administration match the deployment", () => {
  assert.match(source, /epochs\[0\]\s*=\s*Epoch\(0\.01 ether, true, "Genesis"\)/);
  assert.match(source, /onlyRole\(ADMIN_ROLE\)/);
});

test("airdrop is an admin-only gas-sponsored mint with immutable provenance", () => {
  const airdrop = source.match(/function airdrop\([\s\S]*?emit MandalaMinted\(_tokenId, currentEpochId, _contentHash\);\s*}/)?.[0] ?? "";

  assert.match(airdrop, /external onlyRole\(ADMIN_ROLE\)/);
  assert.match(airdrop, /_ownerOf\(_tokenId\)\s*==\s*address\(0\)/);
  assert.match(airdrop, /_safeMint\(_recipient, _tokenId\)/);
  assert.match(airdrop, /tokenProvenance\[_tokenId\]\s*=\s*Provenance/);
  assert.match(airdrop, /epochId:\s*currentEpochId/);
  assert.match(airdrop, /timestamp:\s*block\.timestamp/);
  assert.doesNotMatch(airdrop, /payable/);
});
