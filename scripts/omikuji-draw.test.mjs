import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const layoutPath = new URL("../src/layouts/BaseLayout.astro", import.meta.url);
const componentPath = new URL("../src/components/OmikujiDraw.astro", import.meta.url);
const fortunePath = new URL("../src/utils/omikuji.ts", import.meta.url);

const layoutSource = readFileSync(layoutPath, "utf8");
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, "utf8") : "";

test("replaces the old skip link with the omikuji draw control", () => {
  assert.doesNotMatch(layoutSource, /跳过导航|class=["']skip-link["']/);
  assert.match(layoutSource, /import OmikujiDraw from ["']\.\.\/components\/OmikujiDraw\.astro["']/);
  assert.match(layoutSource, /<OmikujiDraw\s*\/>/);
});

test("renders a hanging paper fortune with an accessible result dialog", () => {
  assert.ok(componentSource, "expected src/components/OmikujiDraw.astro to exist");
  assert.match(componentSource, /data-omikuji-trigger/);
  assert.match(componentSource, /class=["'][^"']*omikuji-cord/);
  assert.match(componentSource, /class=["'][^"']*omikuji-knot/);
  assert.match(componentSource, /御神籤/);
  assert.match(componentSource, /<dialog[^>]+data-omikuji-dialog/);
  assert.match(componentSource, /aria-live=["']polite["']/);
  assert.match(componentSource, /prefers-reduced-motion:\s*reduce/);
});

test("removes the redraw action from an opened fortune", () => {
  assert.doesNotMatch(componentSource, /data-omikuji-redraw|再抽一签/);
});

test("binds both visible close controls to an explicit dialog close", () => {
  assert.match(componentSource, /class="omikuji-close"[^>]+data-omikuji-close/);
  assert.match(componentSource, /class="omikuji-accept"[^>]+data-omikuji-close/);
  assert.match(
    componentSource,
    /closeButtons\.forEach\([\s\S]*?addEventListener\("click"[\s\S]*?dialog\.close\(\)/,
  );
});

test("keeps pointer input enabled inside the modal dialog", () => {
  assert.match(componentSource, /\.omikuji-dialog\s*{[\s\S]*?pointer-events:\s*auto;/);
});

test("recognizes a completed draw only on the same local calendar day", async () => {
  const omikuji = await import(fortunePath.href);
  assert.equal(typeof omikuji.getOmikujiDayKey, "function");
  assert.equal(typeof omikuji.hasDrawnOmikujiToday, "function");

  const today = new Date(2026, 6, 16, 23, 59);
  const tomorrow = new Date(2026, 6, 17, 0, 1);
  const dayKey = omikuji.getOmikujiDayKey(today);
  assert.equal(dayKey, "2026-07-16");
  assert.equal(omikuji.hasDrawnOmikujiToday(dayKey, today), true);
  assert.equal(omikuji.hasDrawnOmikujiToday(dayKey, tomorrow), false);
});

test("persists the daily draw and hides only the hanging trigger", () => {
  assert.match(componentSource, /localStorage\.getItem\(OMIKUJI_LAST_DRAW_KEY\)/);
  assert.match(componentSource, /localStorage\.setItem\(OMIKUJI_LAST_DRAW_KEY,/);
  assert.match(componentSource, /root\.dataset\.drawnToday\s*=\s*"true"/);
  assert.match(
    componentSource,
    /\.omikuji-draw\[data-drawn-today="true"\]\s+\.omikuji-trigger\s*{[\s\S]*?display:\s*none;/,
  );
});

test("uses a visibly longer two-strand tassel", () => {
  assert.match(componentSource, /\.omikuji-draw\s*{[\s\S]*?height:\s*10rem;/);
  assert.match(componentSource, /\.omikuji-tassel\s*{[\s\S]*?height:\s*2\.1rem;/);
  assert.match(componentSource, /\.omikuji-tassel span\s*{[\s\S]*?height:\s*1\.65rem;/);
});

test("gives the hanging paper and tassel separate breeze motion", () => {
  assert.match(componentSource, /\.omikuji-trigger\s*{[\s\S]*?animation:\s*omikuji-breeze[^;]*infinite;/);
  assert.match(componentSource, /@keyframes omikuji-breeze\s*{/);
  assert.match(componentSource, /\.omikuji-tassel span\s*{[\s\S]*?animation:\s*omikuji-tassel-breeze[^;]*infinite;/);
  assert.match(componentSource, /@keyframes omikuji-tassel-breeze\s*{/);
});

test("turns off ambient breeze when reduced motion is requested", () => {
  assert.match(
    componentSource,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*?\.omikuji-tassel span[\s\S]*?animation:\s*none;/,
  );
});

test("provides several distinct phrase choices for every fortune grade", async () => {
  assert.ok(existsSync(fortunePath), "expected src/utils/omikuji.ts to exist");
  const { omikujiFortunes } = await import(fortunePath.href);

  assert.ok(omikujiFortunes.length >= 6);
  for (const template of omikujiFortunes) {
    for (const key of ["grade", "tone"]) {
      assert.equal(typeof template[key], "string", `expected ${key} to be a string`);
      assert.ok(template[key].trim(), `expected ${key} to be non-empty`);
    }
    for (const key of ["messages", "guidance", "wishes", "studies", "healthNotes", "loveNotes"]) {
      assert.ok(Array.isArray(template[key]), `expected ${key} to be an array`);
      assert.ok(template[key].length >= 3, `expected at least three ${key}`);
      assert.equal(new Set(template[key]).size, template[key].length, `expected unique ${key}`);
    }
  }
});

test("draws complete deterministic wording from the supplied random sequence", async () => {
  const { drawOmikuji, omikujiFortunes } = await import(fortunePath.href);
  const first = drawOmikuji(() => 0);
  let lastCall = 0;
  const last = drawOmikuji(() => (lastCall++ === 0 ? 0.999999 : 0));

  assert.equal(first.grade, omikujiFortunes[0].grade);
  assert.equal(last.grade, omikujiFortunes.at(-1).grade);
  for (const fortune of [first, last]) {
    for (const key of ["grade", "message", "wish", "study", "health", "love", "tone"]) {
      assert.equal(typeof fortune[key], "string", `expected ${key} to be a string`);
      assert.ok(fortune[key].trim(), `expected ${key} to be non-empty`);
    }
  }
});

test("varies every sentence while preserving the drawn grade and tone", async () => {
  const { drawOmikuji } = await import(fortunePath.href);
  const firstWording = drawOmikuji(() => 0);
  let call = 0;
  const alternateWording = drawOmikuji(() => (call++ === 0 ? 0 : 0.999999));

  assert.equal(alternateWording.grade, firstWording.grade);
  assert.equal(alternateWording.tone, firstWording.tone);
  for (const key of ["message", "wish", "study", "health", "love"]) {
    assert.notEqual(alternateWording[key], firstWording[key], `expected ${key} to vary`);
  }
});
