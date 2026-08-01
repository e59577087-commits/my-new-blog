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

const readCssBlock = (selector) => {
  const marker = `${selector} {`;
  const markerIndex = globalCss.indexOf(marker);
  if (markerIndex < 0) return null;

  const bodyStart = markerIndex + marker.length;
  const bodyEnd = globalCss.indexOf("}", bodyStart);
  return bodyEnd < 0 ? null : globalCss.slice(bodyStart, bodyEnd);
};

const readHexToken = (block, token) => block?.match(new RegExp(`--${token}:\\s*(#[\\da-f]{6})\\s*;`, "i"))?.[1];

const relativeLuminance = (hex) => {
  const channels = hex.match(/[\da-f]{2}/gi).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
};

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
  const lightRoot = readCssBlock(":root");
  const paperRoot = readCssBlock(':root[data-accent-mode="paper"]');
  assert.ok(lightRoot, "the default light theme tokens are missing");
  assert.ok(paperRoot, "the paper appearance tokens are missing");

  assert.match(appearanceSettings, /appearance-swatch--paper[^>]*data-accent-mode="paper"[^>]*aria-label="纸白"/, "the theme hue row does not offer the paper preset");
  assert.match(lightRoot, /--color-page:\s*hsl\(var\(--theme-hue\)/, "selecting a hue can no longer restore its colored page background");
  assert.match(
    paperRoot,
    /--color-page:\s*#f9f6ec\s*;[\s\S]*?--color-page-soft:\s*#fcfaf5\s*;[\s\S]*?--color-surface-fallback:\s*#fdfaf4\s*;[\s\S]*?--color-muted:\s*#69655d\s*;[\s\S]*?--color-faint:\s*#6d675d\s*;[\s\S]*?radial-gradient\(circle at 18% 0%,\s*rgb\(255 255 255 \/ 0\.58\),\s*transparent 34%\)[\s\S]*?radial-gradient\(circle at 88% 100%,\s*rgb\(164 116 55 \/ 0\.025\),\s*transparent 38%\)[\s\S]*?linear-gradient\(180deg,\s*var\(--color-page-soft\) 0%,\s*var\(--color-page\) 100%\)/,
    "the paper preset does not define the approved warm, readable paper palette",
  );
  const paperBackgrounds = [
    ...["color-page", "color-page-soft", "color-surface-fallback"].map((token) => readHexToken(paperRoot, token)),
    "#efe6d3",
  ];
  const paperSecondaryText = ["color-muted", "color-faint"].map((token) => readHexToken(paperRoot, token));
  assert.ok([...paperBackgrounds, ...paperSecondaryText].every(Boolean), "the paper contrast tokens are incomplete");
  paperSecondaryText.forEach((foreground) => {
    paperBackgrounds.forEach((background) => {
      assert.ok(contrastRatio(foreground, background) >= 4.5, `${foreground} does not reach 4.5:1 on ${background}`);
    });
  });
  assert.match(
    appearanceSettings,
    /\.appearance-swatch--paper\s*\{[^}]*background:\s*linear-gradient\(135deg,\s*#fcfaf5 0 52%,\s*#f9f6ec 52% 100%\)/s,
    "the paper swatch does not preview the warmer paper palette",
  );
  assert.match(globalCss, /:root\[data-theme="dark"\]\[data-accent-mode="paper"\]\s*\{/, "the paper preset has no dark-theme counterpart");

  const { appearance, documentElement } = runAppearanceScript({ accentMode: "paper" });
  assert.equal(appearance.normalize({ accentMode: "paper" }).accentMode, "paper");
  assert.equal(appearance.apply({ accentMode: "paper" }).accentMode, "paper");
  assert.equal(documentElement.dataset.accentMode, "paper");
});

test("gives warm paper a scoped tactile grain without changing pure white or full-screen wallpaper", () => {
  const lightRoot = readCssBlock(":root");
  const paperRoot = readCssBlock(':root[data-accent-mode="paper"]');
  const grainOverlay = readCssBlock("body::after");
  const darkPaperRoot = readCssBlock(':root[data-theme="dark"][data-accent-mode="paper"]');
  const paperWallpaperRoot = readCssBlock(':root[data-accent-mode="paper"][data-wallpaper-mode="transparent"]');
  const darkPaperWallpaperRoot = readCssBlock(':root[data-theme="dark"][data-accent-mode="paper"][data-wallpaper-mode="transparent"]');
  const systemDarkPaperRoot = readCssBlock(':root:not([data-theme])[data-accent-mode="paper"]');
  const whiteRoot = readCssBlock(':root[data-accent-mode="white"]');
  assert.ok(
    [lightRoot, paperRoot, grainOverlay, darkPaperRoot, paperWallpaperRoot, darkPaperWallpaperRoot, systemDarkPaperRoot, whiteRoot].every(Boolean),
    "one or more appearance token blocks are missing",
  );
  assert.match(
    lightRoot,
    /--page-grain-opacity:\s*0\.028\s*;[\s\S]*?--page-grain-filter:\s*none\s*;/,
    "the shared grain defaults are missing",
  );
  assert.match(
    paperRoot,
    /--page-grain-opacity:\s*0\.035\s*;[\s\S]*?--page-grain-filter:\s*sepia\(0\.1\) contrast\(0\.94\)\s*;/,
    "the light paper preset does not receive its restrained tactile grain",
  );
  assert.match(
    grainOverlay,
    /opacity:\s*var\(--page-grain-opacity\)[\s\S]*?filter:\s*var\(--page-grain-filter\)\s*;/,
    "the grain overlay does not consume the semantic grain tokens",
  );
  assert.match(
    darkPaperRoot,
    /--page-grain-opacity:\s*0\.04\s*;[\s\S]*?--page-grain-filter:\s*none\s*;/,
    "the explicit dark paper preset does not preserve its existing grain treatment",
  );
  assert.match(
    paperWallpaperRoot,
    /--page-grain-opacity:\s*0\.028\s*;[\s\S]*?--page-grain-filter:\s*none\s*;/,
    "the light full-screen wallpaper inherits the stronger paper grain",
  );
  assert.match(
    darkPaperWallpaperRoot,
    /--page-grain-opacity:\s*0\.04\s*;[\s\S]*?--page-grain-filter:\s*none\s*;/,
    "the dark full-screen wallpaper no longer preserves its grain treatment",
  );
  assert.match(
    systemDarkPaperRoot,
    /--page-grain-opacity:\s*0\.028\s*;[\s\S]*?--page-grain-filter:\s*none\s*;/,
    "the system dark fallback does not preserve its existing grain treatment",
  );
  assert.match(
    whiteRoot,
    /--color-page:\s*hsl\(0 0% 100%\)\s*;[\s\S]*?--page-background:\s*linear-gradient\(180deg,\s*hsl\(0 0% 100%\) 0%,\s*hsl\(0 0% 100%\) 100%\)\s*;/,
    "the pure-white appearance changed while warming the paper preset",
  );
});
