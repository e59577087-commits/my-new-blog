import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const layout = readFileSync(resolve(root, "src", "layouts", "ArticleLayout.astro"), "utf8");
const baseLayout = readFileSync(resolve(root, "src", "layouts", "BaseLayout.astro"), "utf8");
const css = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");

const ruleBody = (selectorPattern) => css.match(new RegExp(`${selectorPattern}\\s*\\{([^}]*)\\}`, "s"))?.[1] ?? "";

test("uses an editorial reading column instead of uniform Tailwind prose spacing", () => {
  const proseClasses = layout.match(/class="([^"]*\bprose-tech\b[^"]*)"/)?.[1] ?? "";

  assert.ok(proseClasses, "article prose container is missing");
  assert.ok(!proseClasses.includes("max-w-3xl"), "Tailwind still forces the old 48rem reading width");
  assert.ok(!proseClasses.includes("space-y-6"), "uniform block spacing still flattens the article rhythm");

  const prose = ruleBody("\\.prose-tech");
  assert.match(prose, /max-inline-size:\s*42rem\s*;/, "reading measure is not limited to 42rem");
  assert.match(prose, /margin-inline:\s*auto\s*;/, "narrow reading column is not centered");
  assert.match(prose, /font-family:\s*var\(--font-sans\)\s*;/, "long-form copy does not use the clear sans stack");
  assert.match(prose, /font-size:\s*1rem\s*;/, "mobile article copy is not 16px");
  assert.match(prose, /line-height:\s*1\.82\s*;/, "mobile article line height is not tuned for Chinese copy");

  assert.match(
    css,
    /@media\s*\(min-width:\s*640px\)[\s\S]*?\.prose-tech\s*\{[^}]*font-size:\s*1\.0625rem\s*;[^}]*line-height:\s*1\.8\s*;/,
    "desktop article copy is not 17px with a 1.8 line height",
  );
});

test("keeps article display text in WenKai while body copy stays highly readable", () => {
  assert.match(layout, /<h1\s+class="[^"]*\barticle-title\b/, "article title does not have a scoped display class");

  const title = ruleBody("\\.article-title");
  assert.match(title, /font-family:\s*var\(--font-wenkai\)\s*;/, "article title does not use WenKai");

  const display = ruleBody("\\.prose-tech :is\\(h2, h3, h4\\),\\s*\\.prose-tech blockquote");
  assert.match(display, /font-family:\s*var\(--font-wenkai\)\s*;/, "article headings and quotes do not share the WenKai voice");
});

test("keeps the local WenKai stack without a failed render-blocking font request", () => {
  assert.match(
    css,
    /--font-wenkai:\s*"LXGW WenKai"[^;]+;/,
    "the display font stack no longer prefers an installed LXGW WenKai font",
  );
  assert.doesNotMatch(baseLayout, /fonts\.googleapis\.com|fonts\.gstatic\.com/, "a failed remote font request still blocks rendering");
});

test("gives headings, paragraphs, and quotes distinct vertical rhythm", () => {
  const h2 = ruleBody("\\.prose-tech h2");
  const h3 = ruleBody("\\.prose-tech h3");
  const paragraph = ruleBody("\\.prose-tech p");

  assert.match(h2, /font-size:\s*clamp\(/, "level-two headings do not have an explicit responsive size");
  assert.match(h2, /margin-block:\s*2\.7em\s+0\.8em\s*;/, "level-two heading spacing is not editorially distinct");
  assert.match(h3, /font-size:\s*clamp\(/, "level-three headings do not have an explicit responsive size");
  assert.match(h3, /margin-block:\s*2\.2em\s+0\.7em\s*;/, "level-three heading spacing is not editorially distinct");
  assert.match(paragraph, /margin-block:\s*1\.15em\s*;/, "paragraph rhythm is not defined semantically");
  assert.match(
    css,
    /\.prose-tech blockquote\s*\{[^}]*border-inline-start:\s*3px\s+solid\s+var\(--color-accent-border\)\s*;/s,
    "quotes lack the restrained editorial accent",
  );
});
