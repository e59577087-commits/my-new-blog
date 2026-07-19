import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...parts) => readFileSync(resolve(root, ...parts), "utf8");
const css = read("src", "styles", "global.css");

test("defines the same Noto Serif SC-led editorial font stack used by the reference listing", () => {
  assert.match(
    css,
    /--font-editorial:\s*"Noto Serif SC",\s*"Noto Serif CJK SC",\s*"Source Han Serif SC"/,
  );
});

test("marks every article-listing card as editorial typography", () => {
  const listingSources = [
    read("src", "pages", "index.astro"),
    read("src", "components", "EntryCard.astro"),
    read("src", "components", "EssayTimeline.astro"),
    read("src", "components", "ShareLibrary.astro"),
    read("src", "components", "StudyDossier.astro"),
  ];

  for (const source of listingSources) {
    assert.ok(source.includes("data-editorial-card"), "an article-listing card is missing the editorial marker");
  }
  assert.match(css, /\[data-editorial-card\]\s*\{[^}]*font-family:\s*var\(--font-editorial\);/s);
  assert.match(
    css,
    /\[data-editorial-card\]\s+\[data-article-transition-title\]\s*\{[^}]*font-family:\s*var\(--font-editorial\);[^}]*font-weight:\s*500;/s,
  );
});

test("keeps long-form article copy on the existing sans-serif reading face", () => {
  assert.match(css, /\.prose-tech\s*\{[^}]*font-family:\s*var\(--font-sans\);/s);
});
