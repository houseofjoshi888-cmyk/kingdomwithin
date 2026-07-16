import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const files = ["app/providers.tsx", "app/page.tsx", "app/admin/page.tsx", "app/collection/page.tsx", "app/verify/page.tsx", "app/api/epoch/route.ts", "app/WalletButton.tsx", "lib/network.ts", "lib/contract.ts", "PROTOCOL.md", ".env.example"];
const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

test("all public network configuration targets Base mainnet", () => {
  assert.match(source, /chains:\s*\[base\]/);
  assert.match(source, /BASE_MAINNET_CHAIN_ID\s*=\s*8453/);
  assert.match(source, /https:\/\/mainnet\.base\.org/);
  assert.match(source, /0x3c626ff68e9a69526117b22d288ab71bda2b377a/i);
  assert.match(source, /MALKUTA_ENGINE_DEPLOYMENT_BLOCK\s*=\s*"48698258"/);
  assert.match(source, /MandalaMinted/);
  assert.match(source, /Manifest hash mismatch/);
  assert.match(source, /https:\/\/basescan\.org/);
  assert.match(source, /919392f900531a3721df98547c9ff9e6/);
  assert.match(source, /walletConnect\(\{ projectId: walletConnectProjectId \}\)/);
});

test("testnet configuration cannot be introduced into public app surfaces", () => {
  assert.doesNotMatch(source, /sepolia|testnet|84532|baseSepolia/i);
});
