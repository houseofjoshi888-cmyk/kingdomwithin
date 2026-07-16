import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const routes = ["faq", "privacy", "terms", "contact"];
const removedRoutes = ["mint-policy", "disclosures"];

test("all trust-center routes exist", () => {
  for (const route of routes) assert.equal(existsSync(`app/${route}/page.tsx`), true, `Missing /${route}`);
});

test("footer links every trust-center route", () => {
  const footer = readFileSync("app/SiteFooter.tsx", "utf8");
  for (const route of routes) assert.match(footer, new RegExp(`href=["']/${route}["']`));
});

test("mint and risk disclosures are consolidated instead of separate routes", () => {
  for (const route of removedRoutes) assert.equal(existsSync(`app/${route}/page.tsx`), false, `/${route} should not be a separate page`);
  const terms = readFileSync("app/terms/page.tsx", "utf8");
  assert.match(terms, /Mint finality and refunds/);
  assert.match(terms, /Blockchain and storage risks/);
});

test("brand and current FAQ references are present", () => {
  assert.equal(existsSync("public/house-of-joshi-mark.png"), true);
  const faq = readFileSync("app/faq/page.tsx", "utf8");
  assert.doesNotMatch(faq, /The Mint Policy explains/);
  assert.match(faq, /href="\/terms"/);
  assert.match(faq, /Terms and Conditions/);
});

test("generation pins the canonical artifact before mint is enabled", () => {
  const composer = readFileSync("app/page.tsx", "utf8");
  const mint = readFileSync("app/MintAction.tsx", "utf8");
  assert.match(composer, /mintActionRef\.current\?\.prepareCanonical\(\)/);
  assert.match(mint, /artifactReady/);
  assert.match(mint, /GENERATE MANDALA TO ENABLE MINT/);
  assert.match(mint, /CANONICAL ARTIFACT READY ON IPFS · MINT UNLOCKED/);
  assert.doesNotMatch(mint.slice(mint.indexOf("async function mint()")), /pinCanonicalArtifact\(/);
});

test("epoch index failures are explicit and never presented as an empty epoch", () => {
  const route = readFileSync("app/api/epoch/route.ts", "utf8");
  const dashboard = readFileSync("app/EpochDashboard.tsx", "utf8");
  assert.match(route, /runtime = "nodejs"/);
  assert.match(route, /maxDuration = 60/);
  assert.match(route, /contractTotalSupply > BigInt\(0\)/);
  assert.match(dashboard, /INDEXER TEMPORARILY UNAVAILABLE/);
  assert.match(dashboard, /NO EMPTY-EPOCH ASSUMPTION HAS BEEN MADE/);
});
