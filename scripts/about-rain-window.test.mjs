import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test, before } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist", "about", "index.html");
const aboutPage = resolve(root, "src", "pages", "about.astro");
const rainWindowComponent = resolve(root, "src", "components", "AboutRainWindow.astro");
const glassClockComponent = resolve(root, "src", "components", "AboutGlassClock.astro");
const statsComponent = resolve(root, "src", "components", "StatsCard.astro");

let html = "";
let sources = "";

before(() => {
  const astroCli = resolve(root, "node_modules", "astro", "bin", "astro.mjs");
  const build = spawnSync(process.execPath, [astroCli, "build"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(build.status, 0, `${build.error ?? ""}\n${build.stdout}\n${build.stderr}`);
  html = readFileSync(output, "utf8");
  sources = readFileSync(aboutPage, "utf8")
    + (existsSync(rainWindowComponent) ? readFileSync(rainWindowComponent, "utf8") : "")
    + (existsSync(glassClockComponent) ? readFileSync(glassClockComponent, "utf8") : "")
    + readFileSync(statsComponent, "utf8");
});

test("renders a fullscreen rain video with only one statistics overlay", () => {
  assert.ok(html.includes("data-about-rain-window"), "rainy about-page root is missing");
  assert.ok(html.includes("data-rain-window"), "rain-window region is missing");
  assert.ok(html.includes("data-about-stats-overlay"), "statistics overlay is missing");
  assert.ok(html.includes("stats-card--overlay"), "overlay statistics variant is missing");
  assert.ok(!html.includes("ABOUT · LIGHT RAIN"), "old eyebrow remains");
  assert.ok(!html.includes("我在这里"), "old heading remains");
  assert.ok(!html.includes("signal online"), "old signal remains");
});

test("configures the cat video as a silent atmospheric loop", () => {
  const video = html.match(/<video[^>]*data-rain-video[^>]*>/)?.[0] ?? "";
  assert.ok(video, "rain video is missing");
  assert.ok(video.includes("%E9%9B%A8%E5%A4%9C%E5%B0%8F%E7%8C%AB.mp4") || video.includes("雨夜小猫.mp4"));
  assert.ok(video.includes("%E9%9B%A8%E5%A4%9C%E5%B0%8F%E7%8C%AB-poster.webp") || video.includes("雨夜小猫-poster.webp"));
  for (const attribute of ["autoplay", "muted", "loop", "playsinline"]) {
    assert.ok(video.includes(attribute), `video is missing ${attribute}`);
  }
  assert.ok(!video.includes("controls"), "atmospheric video must not expose controls");
});

test("defines responsive, reduced-motion, failure, and parallax behavior", () => {
  assert.ok(sources.includes("object-fit: cover"), "cover video treatment is missing");
  assert.ok(sources.includes("position: absolute"), "fullscreen video positioning is missing");
  assert.ok(sources.includes("@media (max-width:"), "mobile statistics layout is missing");
  assert.ok(sources.includes("prefers-reduced-motion: reduce"), "reduced-motion fallback is missing");
  assert.ok(sources.includes("data-video-failed"), "video error fallback is missing");
  assert.ok(sources.includes("pointermove"), "desktop pointer parallax is missing");
  assert.ok(sources.includes("astro:after-swap"), "Astro navigation reattachment is missing");
});

test("extends the fullscreen video behind the transparent site header", () => {
  assert.match(sources, /\.about-rain\s*{[^}]*min-height:\s*100svh/s);
  assert.match(sources, /\.about-rain\s*{[^}]*margin-top:\s*calc\(var\(--site-header-height\)\s*\*\s*-1\)/s);
  assert.doesNotMatch(sources, /min-height:\s*calc\(100svh\s*-\s*var\(--site-header-height\)\)/);
});

test("sequences the window reveal before the statistics overlay", () => {
  const windowReady = sources.indexOf("about-window-ready");
  const statsReady = sources.indexOf("about-stats-ready");
  assert.ok(windowReady >= 0, "window-ready signal is missing");
  assert.ok(statsReady > windowReady, "statistics reveal is not sequenced after the window reveal");
});

test("keeps the right-side video free of window-frame decorations", () => {
  for (const decoration of [
    "rain-window__frame",
    "rain-window__bar",
    "rain-window__sill",
    "rain-window__plant",
  ]) {
    assert.ok(!sources.includes(decoration), `${decoration} should be removed`);
  }
});

test("does not overlay programmed rain streaks on the video", () => {
  assert.ok(!sources.includes("rain-window__rain"), "rain-streak overlay remains");
  assert.ok(!sources.includes("rain-window-fall"), "rain-streak animation remains");
  assert.ok(!sources.includes("repeating-linear-gradient"), "repeating rain gradient remains");
});

test("renders four responsive statistics in the borderless overlay", () => {
  for (const label of ["篇记录", "次访问", "运行天数", "正文总字数"]) {
    assert.ok(html.includes(label), `missing statistic: ${label}`);
  }
  assert.ok(sources.includes("grid-template-columns: repeat(4"), "desktop four-column statistics are missing");
  assert.ok(sources.includes("grid-template-columns: repeat(2"), "mobile two-column statistics are missing");
  assert.ok(sources.includes("backdrop-filter: blur"), "frosted overlay is missing");
});

test("uses light frosting so statistics remain clear over the video", () => {
  assert.match(sources, /background:\s*color-mix\(in srgb,\s*var\(--color-surface-solid\) 86%,\s*transparent\)/);
  assert.match(sources, /backdrop-filter:\s*blur\(0\.4rem\)\s+saturate\(110%\)/);
  assert.doesNotMatch(sources, /blur\(1\.1rem\)/);
  assert.doesNotMatch(sources, /saturate\(135%\)/);
});

test("uses a near-transparent light-theme card with white glass statistics", () => {
  assert.match(sources, /:global\(:root:not\(\[data-theme="dark"\]\)\) \.stats-card--overlay\s*{[^}]*background:\s*rgba\(248,\s*250,\s*252,\s*0\.08\)/s);
  assert.match(sources, /:global\(:root:not\(\[data-theme="dark"\]\)\) \.stats-card--overlay \.stat-number\s*{[^}]*color:\s*rgba\(248,\s*250,\s*252,\s*0\.94\)[^}]*text-shadow:/s);
  assert.match(sources, /:global\(:root:not\(\[data-theme="dark"\]\)\) \.stats-card--overlay \.stat-label\s*{[^}]*color:\s*rgba\(241,\s*245,\s*249,\s*0\.82\)/s);
  assert.match(sources, /:global\(:root:not\(\[data-theme="dark"\]\)\) \.stats-card--overlay \.stat-icon[^}]*color:\s*rgba\(248,\s*250,\s*252,\s*0\.9\)\s*!important/s);
});

test("renders a borderless glass clock with smaller lowered seconds", () => {
  assert.ok(html.includes("data-about-glass-clock"), "glass clock is missing");
  assert.ok(sources.includes("AboutGlassClock"), "glass clock is not mounted on the about page");
  assert.match(sources, /\.about-glass-clock\s*{[^}]*background:\s*none[^}]*border:\s*0[^}]*box-shadow:\s*none/s);
  assert.match(sources, /background-clip:\s*text/);
  assert.match(sources, /\.glass-clock__seconds\s*{[^}]*font-size:\s*0\.42em[^}]*transform:\s*translateY\(0\.2em\)/s);
  assert.ok(sources.includes('aria-live="off"'), "clock should not announce every second");
});

test("places a subdued local date below the glass time", () => {
  assert.ok(html.includes("data-clock-date"), "glass date is missing");
  assert.match(sources, /\.about-glass-clock\s*{[^}]*flex-direction:\s*column[^}]*align-items:\s*flex-start/s);
  assert.match(sources, /\.glass-clock__date\s*{[^}]*font-size:\s*0\.22em[^}]*letter-spacing:\s*0\.12em[^}]*opacity:\s*0\.72/s);
  assert.ok(sources.includes("getFullYear()"), "local year update is missing");
  assert.ok(sources.includes("getMonth() + 1"), "local month update is missing");
  assert.ok(sources.includes("getDate()"), "local day update is missing");
});

test("updates the local glass clock once per second across page transitions", () => {
  assert.ok(sources.includes("setInterval(updateClock, 1000)"), "one-second clock update is missing");
  assert.ok(sources.includes("astro:before-swap"), "clock cleanup before navigation is missing");
  assert.ok(sources.includes("astro:after-swap"), "clock reinitialization after navigation is missing");
  assert.ok(sources.includes("toLocaleTimeString"), "browser-local time formatting is missing");
});
