import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const globalCss = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");

test("renders sized article images inline with surrounding text", () => {
  const rule = globalCss.match(/\.prose-tech img\[width\]\s*\{([^}]*)\}/)?.[1];

  assert.ok(rule, "sized article image rule is missing");
  assert.match(rule, /display:\s*inline-block\s*;/, "sized article images are not inline");
  assert.match(rule, /vertical-align:\s*middle\s*;/, "sized article images are not aligned with the text");
});
