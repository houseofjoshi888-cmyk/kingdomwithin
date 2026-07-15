import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../contracts/MalkutaEngine.sol", import.meta.url), "utf8");

test("the deployed contract source stores epoch provenance during safe mint", () => {
  assert.match(source, /_safeMint\(msg\.sender, tokenId\)/);
  assert.match(source, /tokenProvenance\[tokenId\]\s*=\s*Provenance/);
  assert.match(source, /epochId:\s*currentEpochId/);
  assert.match(source, /timestamp:\s*block\.timestamp/);
  assert.match(source, /emit MandalaMinted\(tokenId, currentEpochId, _contentHash\)/);
});

test("the deployed contract exposes no provenance override", () => {
  assert.doesNotMatch(source, /setContentHash/);
  assert.doesNotMatch(source, /setProvenance/);
});

test("the deployed source contains the confirmed mint-blocking ownerOf guard", () => {
  assert.match(source, /ownerOf\(tokenId\)\s*==\s*address\(0\)/);
  assert.doesNotMatch(source, /_ownerOf\(tokenId\)\s*==\s*address\(0\)/);
});

test("Genesis epoch and role-based administration match the deployment", () => {
  assert.match(source, /epochs\[0\]\s*=\s*Epoch\(0\.01 ether, true, "Genesis"\)/);
  assert.match(source, /onlyRole\(ADMIN_ROLE\)/);
});
