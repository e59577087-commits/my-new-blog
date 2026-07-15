import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(resolve(root, ...parts), "utf8");

const baseLayout = read("src", "layouts", "BaseLayout.astro");
const globalCss = read("src", "styles", "global.css");
const homepage = read("src", "pages", "index.astro");
const siteData = read("src", "data", "site.ts");
const authStatus = read("src", "components", "AuthStatus.astro");
const blackHole = read("src", "components", "HomepageBlackHole.astro");
const headers = read("public", "_headers");

const expectedAssets = [
  ["public/media/wallpaper-summer-960-v1.webp", 300_000],
  ["public/media/wallpaper-summer-1920-v1.webp", 700_000],
  ["public/media/wallpaper-summer-2560-v1.webp", 1_100_000],
  ["public/media/avatar-256-v1.webp", 100_000],
  ["public/media/cover-samurai-800-v1.webp", 500_000],
  ["public/media/cover-samurai-1600-v1.webp", 1_000_000],
  ["public/media/cover-network-320-v1.webp", 150_000],
  ["public/media/cover-network-640-v1.webp", 350_000],
  ["public/favicon-64-v1.png", 50_000],
];

test("ships compact, display-sized first-load image assets", () => {
  for (const [relativePath, maxBytes] of expectedAssets) {
    const path = resolve(root, relativePath);
    assert.ok(existsSync(path), `${relativePath} is missing`);
    assert.ok(statSync(path).size <= maxBytes, `${relativePath} exceeds ${maxBytes} bytes`);
  }
});

test("uses responsive images without promoting below-fold covers", () => {
  assert.match(globalCss, /wallpaper-summer-960-v1\.webp/);
  assert.match(globalCss, /wallpaper-summer-1920-v1\.webp/);
  assert.match(globalCss, /wallpaper-summer-2560-v1\.webp/);
  assert.doesNotMatch(globalCss, /url\(['"]?\/夏\.jpeg/);

  assert.match(siteData, /avatar:\s*["']\/media\/avatar-256-v1\.webp["']/);
  assert.match(homepage, /getResponsiveCover/);
  assert.match(homepage, /srcset=/);
  assert.match(homepage, /sizes=/);
  assert.match(homepage, /loading="lazy"/);
  assert.match(homepage, /fetchpriority="low"/);
  assert.doesNotMatch(homepage, /loading="eager"[^>]*fetchpriority="high"/);
});

test("uses html2canvas-compatible wallpaper URLs at responsive breakpoints", () => {
  assert.doesNotMatch(globalCss, /(?:-webkit-)?image-set\s*\(/);

  const wallpaperUrls = [
    ...globalCss.matchAll(
      /--appearance-wallpaper:\s*url\(['"]([^'"]+)['"]\)/g,
    ),
  ].map((match) => match[1]);

  assert.deepEqual(wallpaperUrls, [
    "/media/wallpaper-summer-960-v1.webp",
    "/media/wallpaper-summer-1920-v1.webp",
    "/media/wallpaper-summer-2560-v1.webp",
  ]);
  assert.match(
    globalCss,
    /@media\s*\(min-width:\s*64rem\)[\s\S]*?--appearance-wallpaper:\s*url\(['"]\/media\/wallpaper-summer-1920-v1\.webp['"]\)/,
  );
  assert.match(
    globalCss,
    /@media\s*\(min-width:\s*90rem\)[\s\S]*?--appearance-wallpaper:\s*url\(['"]\/media\/wallpaper-summer-2560-v1\.webp['"]\)/,
  );
});

test("removes failed render-blocking font and oversized favicon requests", () => {
  assert.doesNotMatch(baseLayout, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(baseLayout, /href="\/favicon-64-v1\.png"/);
  assert.doesNotMatch(baseLayout, /href="\/favicon\.svg/);
});

test("loads account status after the critical render", () => {
  assert.doesNotMatch(authStatus, /^\s*import\s+\{[^\n]+\}\s+from\s+["']\.\.\/lib\/supabaseClient["'];/m);
  assert.match(authStatus, /await import\(["']\.\.\/lib\/supabaseClient["']\)/);
  assert.match(authStatus, /requestIdleCallback/);
});

test("keeps the original black-hole loading and startup behavior", () => {
  assert.match(blackHole, /^\s*import\s+html2canvas\s+from\s+["']html2canvas["'];/m);
  assert.doesNotMatch(blackHole, /import\(["']html2canvas["']\)/);
  assert.match(blackHole, /\(function homepageBlackHoleWebGL\(\) \{/);
  assert.match(blackHole, /\n\s*start\(\);\r?\n\s*\}\)\(\);/);
  assert.doesNotMatch(blackHole, /scheduleBlackHole|window\.addEventListener\(["']load["'], scheduleBlackHole/);
});

test("caches versioned media independently from HTML", () => {
  assert.match(headers, /\/media\/\*[\s\S]*?Cache-Control:\s*public, max-age=31536000, immutable/);
  assert.match(headers, /\/favicon-64-v1\.png[\s\S]*?Cache-Control:\s*public, max-age=31536000, immutable/);
});
