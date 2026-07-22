import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(resolve(root, ...parts), "utf8");
const readOptional = (...parts) => {
  const path = resolve(root, ...parts);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
};

const baseLayout = read("src", "layouts", "BaseLayout.astro");
const globalCss = read("src", "styles", "global.css");
const homepage = read("src", "pages", "index.astro");
const blackHole = read("src", "components", "HomepageBlackHole.astro");
const switcher = readOptional("src", "components", "BannerWallpaperSwitcher.astro");
const appearanceSettings = read("src", "components", "AppearanceSettings.astro");

function readWebpDimensions(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF", "asset is not a RIFF WebP");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP", "asset is not a WebP image");

  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 ") {
    assert.deepEqual([...bytes.subarray(23, 26)], [0x9d, 0x01, 0x2a], "invalid VP8 frame header");
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  throw new Error(`unsupported WebP chunk: ${chunk}`);
}

function runAppearanceScript(storedSettings) {
  const script = [...baseLayout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((source) => source.includes("blog-appearance-settings-v1"));
  assert.ok(script, "appearance bootstrap script is missing");

  const properties = new Map();
  const documentElement = {
    dataset: {},
    style: {
      setProperty(name, value) {
        properties.set(name, value);
      },
      removeProperty(name) {
        properties.delete(name);
      },
    },
  };
  const window = {
    localStorage: {
      getItem: () => storedSettings === null ? null : JSON.stringify(storedSettings),
    },
  };

  runInNewContext(script, { document: { documentElement }, window });
  return { appearance: window.__blogAppearance, documentElement, properties };
}

test("ships a full-resolution Salvation WebP below 900 KB", () => {
  const sourcePath = resolve(root, "public", "82adce_42_Salvation_4k.jpg");
  const optimizedPath = resolve(root, "public", "media", "wallpaper-salvation-4k-v1.webp");

  assert.ok(existsSync(sourcePath), "source Salvation JPG is missing");
  assert.ok(existsSync(optimizedPath), "optimized Salvation WebP is missing");
  assert.ok(statSync(optimizedPath).size <= 900_000, "optimized Salvation WebP exceeds 900 KB");
  assert.ok(statSync(optimizedPath).size < statSync(sourcePath).size, "optimized asset is not smaller than the JPG");

  const dimensions = readWebpDimensions(readFileSync(optimizedPath));
  assert.deepEqual(dimensions, { width: 4200, height: 2386 });
});

test("normalizes and applies a persisted wallpaper selection", () => {
  const { appearance, documentElement, properties } = runAppearanceScript({ wallpaperId: "salvation" });

  assert.equal(appearance.read().wallpaperId, "salvation");
  assert.equal(documentElement.dataset.wallpaperId, "salvation");
  assert.match(properties.get("--appearance-wallpaper"), /wallpaper-salvation-4k-v1\.webp/);

  assert.equal(appearance.normalize({ wallpaperId: "unknown" }).wallpaperId, "summer");
  appearance.apply({ wallpaperId: "summer" });
  assert.equal(documentElement.dataset.wallpaperId, "summer");
  assert.equal(properties.has("--appearance-wallpaper"), false);
});

test("renders an accessible wallpaper button above the black-hole layer", () => {
  assert.match(homepage, /import BannerWallpaperSwitcher from "\.\.\/components\/BannerWallpaperSwitcher\.astro"/);
  assert.match(homepage, /<div class="home-hero-stage">[\s\S]*?<BannerWallpaperSwitcher\s*\/>[\s\S]*?<\/div>/);
  assert.match(switcher, /<button[^>]*type="button"[^>]*data-banner-wallpaper-switch/);
  assert.match(switcher, /data-html2canvas-ignore/);
  assert.match(switcher, /aria-label="更换横幅壁纸"/);
  assert.match(switcher, /left:\s*[^;]+;/);
  assert.match(switcher, /bottom:\s*[^;]+;/);
  assert.match(switcher, /z-index:\s*7/);
  assert.match(switcher, /:focus-visible/);
  assert.match(switcher, /data-wallpaper-mode="solid"[\s\S]*?display:\s*none/);
  assert.match(
    globalCss,
    /data-wallpaper-id="salvation"[\s\S]*?\.home-banner-title\.heading-text[\s\S]*?color:\s*rgba\(255,\s*255,\s*255/,
  );
});

test("limits the mouse hit area to the icon while retaining a 44px touch target", () => {
  const buttonRule = switcher.match(/\.banner-wallpaper-switcher button\s*\{([^}]*)\}/)?.[1];
  assert.ok(buttonRule, "wallpaper button rule is missing");
  assert.match(buttonRule, /width:\s*1\.25rem;/);
  assert.match(buttonRule, /height:\s*1\.25rem;/);
  assert.doesNotMatch(buttonRule, /min-width|min-height/);

  assert.match(switcher, /class="banner-wallpaper-switcher__surface"/);
  assert.match(
    switcher,
    /\.banner-wallpaper-switcher__surface\s*\{[\s\S]*?width:\s*1\.25rem;[\s\S]*?height:\s*1\.25rem;/,
  );
  assert.match(
    switcher,
    /@media \(pointer: coarse\)\s*\{[\s\S]*?\.banner-wallpaper-switcher button\s*\{[^}]*width:\s*2\.75rem;[^}]*height:\s*2\.75rem;/,
  );
  assert.match(switcher, /<svg[^>]*data-wallpaper-cycle-icon[^>]*width="15"[^>]*height="15"/);
  assert.doesNotMatch(switcher, /data-wallpaper-label/);
  assert.doesNotMatch(switcher, />\s*换图\s*</);
});

test("renders the cycle glyph itself as glass without a visible carrier", () => {
  assert.match(
    switcher,
    /\.banner-wallpaper-switcher__surface\s*\{[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/,
  );
  assert.match(switcher, /<linearGradient id="wallpaper-cycle-glass-gradient"/);
  assert.match(switcher, /stroke="url\(#wallpaper-cycle-glass-gradient\)"/);
  assert.match(switcher, /stop-opacity="0\.92"[\s\S]*?stop-opacity="0\.46"[\s\S]*?stop-opacity="0\.78"/);
  assert.match(
    switcher,
    /\.banner-wallpaper-switcher__surface svg\s*\{[^}]*opacity:\s*0\.86;[^}]*filter:\s*drop-shadow\(0 1px 1px rgba\(0,\s*0,\s*0,\s*0\.3\)\);/,
  );
});

test("preloads and decodes the next wallpaper before persisting it", () => {
  assert.match(switcher, /new Image\(\)/);
  assert.match(switcher, /await image\.decode\(\)/);
  assert.match(switcher, /appearance\.apply/);
  assert.match(switcher, /localStorage\.setItem\(appearance\.storageKey/);
  assert.match(switcher, /blog:wallpaper-change/);
  assert.ok(
    switcher.indexOf("await image.decode()") < switcher.indexOf("appearance.apply"),
    "the wallpaper is applied before it finishes decoding",
  );
});

test("keeps the appearance panel in sync with wallpaper button changes", () => {
  assert.match(appearanceSettings, /addEventListener\("blog:appearance-change"/);
  assert.match(appearanceSettings, /settings\s*=\s*appearance\.normalize\(event\.detail\)/);
});

test("refreshes the black-hole texture safely after wallpaper changes", () => {
  assert.match(blackHole, /data-black-hole-click-exempt/);
  assert.match(blackHole, /data-html2canvas-ignore/);
  assert.match(blackHole, /appearanceCapturePending/);
  assert.match(blackHole, /textureBusy\s*\|\|\s*textureScheduled/);
  assert.match(blackHole, /addEventListener\("blog:wallpaper-change"/);
  assert.match(
    blackHole,
    /attributeFilter:\s*\[[^\]]*"data-wallpaper-id"[^\]]*\]/,
  );
});
