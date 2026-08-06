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

test("hard clips the black-hole overlay at the banner edges", () => {
  assert.match(
    blackHole,
    /float bandMask = step\(uBannerBand\.x, uv\.y\)\s*\* \(1\.0 - step\(uBannerBand\.y, uv\.y\)\);/,
  );
  assert.doesNotMatch(blackHole, /float bandF/);
  assert.doesNotMatch(blackHole, /smoothstep\(uBannerBand\./);
});

test("invalidates stale textures and discards captures from before an appearance change", () => {
  assert.match(blackHole, /let textureGeneration = 0;/);
  assert.match(
    blackHole,
    /function invalidatePageTexture\(\) \{\s*textureGeneration \+= 1;\s*textureReady = false;\s*\}/,
  );
  assert.match(capture, /const captureGeneration = textureGeneration;/);
  assert.match(capture, /if \(captureGeneration !== textureGeneration\) return;/);
  assert.ok(
    capture.indexOf("if (captureGeneration !== textureGeneration) return;")
      < capture.indexOf("gl.texImage2D"),
    "an obsolete capture is uploaded before its generation is checked",
  );
  assert.match(
    blackHole,
    /const appearanceObserver = new MutationObserver\(\(\) => \{\s*invalidatePageTexture\(\);\s*requestAppearanceCapture\(400\);\s*\}\);/,
  );
});

test("stops retrying a texture capture when Firefox cannot access html2canvas's cloned iframe", () => {
  assert.match(blackHole, /let textureCaptureSupported = true;/, "texture capture cannot be disabled after an unsupported-browser failure");
  assert.match(capture, /if \(!textureCaptureSupported\) return;/, "unsupported browsers still attempt every expensive texture capture");
  assert.match(
    capture,
    /Unable to find element in cloned iframe[\s\S]*?textureCaptureSupported = false;/,
    "Firefox's cloned-iframe failure is not converted into a quiet texture fallback",
  );
});

test("hides every sampled page color while the replacement texture is unavailable", () => {
  assert.match(blackHole, /term\[i\] = pageAt\(suv\)\[i\] \* uTextureReady;/);
  assert.match(blackHole, /bg \+= pageAt\(suv\) \* toward \* uTextureReady;/);
  assert.match(blackHole, /ring = pageAt\(suv2\) \* toward2 \* uTextureReady;/);
});
