import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appearanceSettings = readFileSync(resolve(root, "src", "components", "AppearanceSettings.astro"), "utf8");
const baseLayout = readFileSync(resolve(root, "src", "layouts", "BaseLayout.astro"), "utf8");
const globalCss = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");

const runAppearanceScript = (storedSettings) => {
  const script = [...baseLayout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((source) => source.includes("blog-appearance-settings-v1"));
  assert.ok(script, "appearance bootstrap script is missing");

  const documentElement = {
    dataset: {},
    style: { setProperty() {} },
  };
  const window = {
    localStorage: {
      getItem: () => storedSettings === null ? null : JSON.stringify(storedSettings),
    },
  };

  runInNewContext(script, { document: { documentElement }, window });
  return { appearance: window.__blogAppearance, documentElement };
};

test("uses the warm paper background for a visitor with no saved appearance", () => {
  const { appearance, documentElement } = runAppearanceScript(null);

  assert.equal(appearance.read().accentMode, "paper");
  assert.equal(documentElement.dataset.accentMode, "paper");
});

test("offers one full-screen wallpaper option backed by the transparent mode", () => {
  const group = appearanceSettings.match(/<div class="appearance-options" data-appearance-wallpaper[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(group, "wallpaper mode controls are missing");

  const buttons = [...group.matchAll(/<button type="button" data-value="([^"]+)">([^<]+)<\/button>/g)].map((match) => ({
    value: match[1],
    label: match[2],
  }));

  assert.deepEqual(buttons, [
    { value: "banner", label: "横幅壁纸" },
    { value: "transparent", label: "全屏壁纸" },
    { value: "solid", label: "纯色背景" },
  ]);
});

test("migrates the removed fullscreen mode to the transparent mode", () => {
  const { appearance, documentElement } = runAppearanceScript({ wallpaperMode: "fullscreen" });

  assert.equal(appearance.normalize({ wallpaperMode: "fullscreen" }).wallpaperMode, "transparent");
  assert.equal(appearance.apply({ wallpaperMode: "fullscreen" }).wallpaperMode, "transparent");
  assert.equal(documentElement.dataset.wallpaperMode, "transparent");
  assert.equal(appearance.normalize({ wallpaperMode: "transparent" }).wallpaperMode, "transparent");
  assert.equal(appearance.normalize({ wallpaperMode: "unknown" }).wallpaperMode, "banner");
});

test("removes the old fullscreen styles while retaining the transparent wallpaper effect", () => {
  assert.ok(!globalCss.includes('data-wallpaper-mode="fullscreen"'), "removed fullscreen CSS selectors are still present");
  assert.match(
    globalCss,
    /:root\[data-wallpaper-mode="transparent"\] body\s*\{[\s\S]*?var\(--appearance-wallpaper\)[\s\S]*?\}/,
    "transparent mode no longer paints the page wallpaper",
  );
  assert.match(
    globalCss,
    /:root\[data-theme="dark"\]\[data-wallpaper-mode="transparent"\] body\s*\{/,
    "transparent mode no longer supports the dark theme wallpaper",
  );
  assert.match(
    globalCss,
    /:root\[data-wallpaper-mode="transparent"\] \.surface,\s*:root\[data-wallpaper-mode="transparent"\] \.surface-soft\s*\{/,
    "transparent mode no longer applies its glass surface treatment",
  );
});

test("offers and persists an innei-inspired warm paper appearance preset", () => {
  const lightRoot = globalCss.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(lightRoot, "the default light theme tokens are missing");

  assert.match(appearanceSettings, /appearance-swatch--paper[^>]*data-accent-mode="paper"[^>]*aria-label="纸白"/, "the theme hue row does not offer the paper preset");
  assert.match(lightRoot, /--color-page:\s*hsl\(var\(--theme-hue\)/, "selecting a hue can no longer restore its colored page background");
  assert.match(globalCss, /:root\[data-accent-mode="paper"\]\s*\{[\s\S]*?--color-page:\s*#fefefb\s*;[\s\S]*?--color-page-soft:\s*#f9f8f5\s*;[\s\S]*?--color-surface-fallback:\s*#fbfaf7\s*;[\s\S]*?--page-background:\s*var\(--color-page\)\s*;/, "the paper preset does not define the warm paper palette");
  assert.match(globalCss, /:root\[data-theme="dark"\]\[data-accent-mode="paper"\]\s*\{/, "the paper preset has no dark-theme counterpart");

  const { appearance, documentElement } = runAppearanceScript({ accentMode: "paper" });
  assert.equal(appearance.normalize({ accentMode: "paper" }).accentMode, "paper");
  assert.equal(appearance.apply({ accentMode: "paper" }).accentMode, "paper");
  assert.equal(documentElement.dataset.accentMode, "paper");
});
