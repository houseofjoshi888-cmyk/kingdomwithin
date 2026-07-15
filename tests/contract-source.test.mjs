import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../contracts/MalkutaEngine.sol", import.meta.url), "utf8");

test("public mint requires an active epoch and exact payment", () => {
  assert.match(source, /function mint\([\s\S]*?external payable nonReentrant/);
  assert.match(source, /require\(epoch\.isActive/);
  assert.match(source, /require\(msg\.value == epoch\.mintPrice/);
});

test("minting stores immutable marketplace metadata and provenance", () => {
  assert.match(source, /_safeMint\(recipient, tokenId\)/);
  assert.match(source, /_setTokenURI\(tokenId, metadataURI\)/);
  assert.match(source, /tokenProvenance\[tokenId\]\s*=\s*Provenance/);
  assert.match(source, /metadataURI:\s*metadataURI/);
  assert.match(source, /timestamp:\s*block\.timestamp/);
  assert.doesNotMatch(source, /function\s+setTokenURI\s*\(/);
  assert.doesNotMatch(source, /setProvenance|setContentHash/);
});

test("unused token IDs are checked without ownerOf reverting", () => {
  assert.match(source, /tokenId == uint256\(keccak256\(abi\.encodePacked\(recipient, contentHash\)\)\)/);
  assert.match(source, /_ownerOf\(tokenId\)\s*==\s*address\(0\)/);
  assert.doesNotMatch(source, /require\(ownerOf\(tokenId\)/);
});

test("admin airdrop uses the same immutable mint pipeline without payment", () => {
  const airdrop = source.match(/function airdrop\([\s\S]*?_mintMandala\(recipient, tokenId, contentHash, protocolVersion, metadataURI, 0\);\s*}/)?.[0] ?? "";
  assert.match(airdrop, /external onlyRole\(ADMIN_ROLE\) nonReentrant/);
  assert.doesNotMatch(airdrop, /payable/);
});

test("supply, epochs, and complete mint events are available to the app and indexer", () => {
  assert.match(source, /_totalMinted\+\+/);
  assert.match(source, /function totalSupply\(\) external view returns \(uint256\)/);
  assert.match(source, /event EpochConfigured/);
  assert.match(source, /event MandalaMinted\([\s\S]*string metadataURI,[\s\S]*uint256 price/);
});

test("all withdrawn mint proceeds are locked to the House wallet", () => {
  assert.match(source, /HOUSE_WALLET\s*=\s*payable\(0x6736d2eA9807297F0e56967361B9410854B86a5f\)/);
  assert.match(source, /HOUSE_WALLET\.call\{value:\s*amount}/);
  assert.doesNotMatch(source, /payable\(msg\.sender\)/);
});

test("state-changing value paths use reentrancy protection", () => {
  assert.match(source, /contract MalkutaEngine is ERC721URIStorage, AccessControl, ReentrancyGuard/);
  assert.match(source, /function mint\([\s\S]*?nonReentrant/);
  assert.match(source, /function airdrop\([\s\S]*?nonReentrant/);
  assert.match(source, /function withdraw\(\) external onlyRole\(ADMIN_ROLE\) nonReentrant/);
});
