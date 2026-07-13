import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blackHole = readFileSync(resolve(root, "src", "components", "HomepageBlackHole.astro"), "utf8");
const capture = blackHole.match(/async function captureWholePageTexture[\s\S]*?(?=\n\s*function clearWarp\()/)?.[0];

test("composites the body backdrop into the cloned black-hole capture scope", () => {
  assert.ok(capture, "black-hole texture capture function is missing");

  const propertyBlock = capture.match(/const bodyBackdropProperties = \[([\s\S]*?)\];/)?.[1];
  assert.ok(propertyBlock, "body backdrop properties are not captured");
  const properties = [...propertyBlock.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(properties, [
    "background-color",
    "background-image",
    "background-position",
    "background-size",
    "background-repeat",
    "background-attachment",
    "background-origin",
    "background-clip",
  ]);

  assert.match(capture, /const bodyStyles = window\.getComputedStyle\(document\.body\);/);
  assert.match(capture, /const bodyBackdrop = bodyBackdropProperties\.map\(\(property\) => \[property, bodyStyles\.getPropertyValue\(property\)\]\);/);

  const cloneHook = capture.match(/onclone:\s*\(clonedDocument\) => \{([\s\S]*?)\r?\n\s*\},\r?\n\s*\}\);/)?.[1];
  assert.ok(cloneHook, "html2canvas clone hook is missing");
  assert.match(cloneHook, /const clonedScope = clonedDocument\.querySelector\("\[data-home-black-hole-scope\]"\);/);
  assert.match(cloneHook, /for \(const \[property, value\] of bodyBackdrop\)/);
  assert.match(cloneHook, /clonedScope\.style\.setProperty\(property, value, "important"\);/);
  assert.doesNotMatch(capture, /\bscope\.style\.setProperty\(property, value/);
});
