import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const routes = ["faq", "privacy", "terms", "mint-policy", "disclosures"];

test("all trust-center routes exist", () => {
  for (const route of routes) assert.equal(existsSync(`app/${route}/page.tsx`), true, `Missing /${route}`);
});

test("footer links every trust-center route", () => {
  const footer = readFileSync("app/SiteFooter.tsx", "utf8");
  for (const route of routes) assert.match(footer, new RegExp(`href=["']/${route}["']`));
});
