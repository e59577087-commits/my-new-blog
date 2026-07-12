import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const footer = readFileSync(resolve(root, "src", "components", "SiteFooter.astro"), "utf8");

test("removes the global footer tagline while keeping copyright and navigation", () => {
  assert.ok(!footer.includes("慢慢写，慢慢整理。这里收着一些随笔片段和当下喜欢的东西。"));
  assert.ok(footer.includes("&copy;"), "footer copyright is missing");
  assert.ok(footer.includes("site.nav.map"), "footer navigation is missing");
});
