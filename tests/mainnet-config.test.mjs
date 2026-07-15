import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const files = ["app/providers.tsx", "app/page.tsx", "app/admin/page.tsx", "app/verify/page.tsx", "app/api/epoch/route.ts", "app/WalletButton.tsx", "lib/network.ts", "lib/contract.ts", "PROTOCOL.md", ".env.example"];
const source = files.map((file) => readFileSync(file, "utf8")).join("\n");

test("all public network configuration targets Base mainnet", () => {
  assert.match(source, /chains:\s*\[base\]/);
  assert.match(source, /BASE_MAINNET_CHAIN_ID\s*=\s*8453/);
  assert.match(source, /https:\/\/mainnet\.base\.org/);
  assert.match(source, /NEXT_PUBLIC_MALKUTA_ENGINE_ADDRESS/);
  assert.match(source, /MALKUTA_DEPLOYMENT_BLOCK/);
  assert.match(source, /MandalaMinted/);
  assert.match(source, /Manifest hash mismatch/);
  assert.match(source, /https:\/\/basescan\.org/);
});

test("testnet configuration cannot be introduced into public app surfaces", () => {
  assert.doesNotMatch(source, /sepolia|testnet|84532|baseSepolia/i);
});
