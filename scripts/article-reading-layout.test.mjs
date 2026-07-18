import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const layout = readFileSync(resolve(root, "src", "layouts", "ArticleLayout.astro"), "utf8");
const baseLayout = readFileSync(resolve(root, "src", "layouts", "BaseLayout.astro"), "utf8");
const css = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");
const toc = readFileSync(resolve(root, "src", "components", "ArticleToc.astro"), "utf8");

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
  assert.match(prose, /font-size:\s*16px\s*;/, "article copy does not use innei.in's stable 16px reading size");
  assert.match(prose, /line-height:\s*1\.7\s*;/, "article copy does not use innei.in's 27.2px line height");
  assert.doesNotMatch(css, /\.prose-tech\s*\{[^}]*font-size:\s*1\.0625rem\s*;/, "desktop copy still grows beyond the reference reading size");
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

test("uses innei-inspired article sizes and warm ink colors", () => {
  const lightRoot = ruleBody(":root");
  const title = ruleBody("\\.article-title");
  const meta = ruleBody("\\.article-meta");

  assert.match(lightRoot, /--color-heading:\s*#000\s*;/, "light headings do not use the reference black ink");
  assert.match(lightRoot, /--color-text:\s*#262626\s*;/, "body text does not use the reference secondary ink");
  assert.match(lightRoot, /--color-muted:\s*#787670\s*;/, "muted text does not use the reference warm gray");
  assert.match(lightRoot, /--color-faint:\s*#a3a19a\s*;/, "faint text does not use the warm paper gray");
  assert.match(title, /font-size:\s*36px\s*;/, "the article title is not reduced to the reference 36px scale");
  assert.match(title, /line-height:\s*1\.25\s*;/, "the article title does not use the reference 45px line height");
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.article-title\s*\{[^}]*font-size:\s*30px\s*;/, "the reference title scale is not adapted for small screens");
  assert.match(layout, /<time[^>]*class="[^"]*\barticle-meta\b/, "article metadata lacks a scoped typography class");
  assert.match(meta, /font-size:\s*12px\s*;/, "article metadata is not reduced to the reference 12px label size");
  assert.match(meta, /color:\s*var\(--color-muted\)\s*;/, "article metadata does not use the warm muted color");
});

test("matches innei.in's compact table-of-contents typography", () => {
  const tocLink = toc.match(/\.toc-link\s*\{([^}]*)\}/s)?.[1] ?? "";

  assert.match(tocLink, /font-size:\s*14px\s*;/, "the expanded table of contents does not use the reference 14px size");
  assert.match(tocLink, /line-height:\s*21px\s*;/, "the expanded table of contents does not use the reference 21px line height");
  assert.match(tocLink, /color:\s*color-mix\(in srgb,\s*var\(--color-heading\) 75%,\s*var\(--color-page\)\)\s*;/, "the table of contents does not use the reference warm dark gray");
});

test("gives headings, paragraphs, and quotes distinct vertical rhythm", () => {
  const h2 = ruleBody("\\.prose-tech h2");
  const h3 = ruleBody("\\.prose-tech h3");
  const paragraph = ruleBody("\\.prose-tech p");

  assert.match(h2, /font-size:\s*24px\s*;/, "level-two headings do not use the reference 24px size");
  assert.match(h2, /line-height:\s*1\.25\s*;/, "level-two headings do not use the reference 30px line height");
  assert.match(h2, /margin-block:\s*2\.7em\s+0\.8em\s*;/, "level-two heading spacing is not editorially distinct");
  assert.match(h3, /font-size:\s*20px\s*;/, "level-three headings do not follow the reference title scale");
  assert.match(h3, /margin-block:\s*2\.2em\s+0\.7em\s*;/, "level-three heading spacing is not editorially distinct");
  assert.match(paragraph, /margin-block:\s*1\.15em\s*;/, "paragraph rhythm is not defined semantically");
  assert.match(
    css,
    /\.prose-tech blockquote\s*\{[^}]*border-inline-start:\s*3px\s+solid\s+var\(--color-accent-border\)\s*;/s,
    "quotes lack the restrained editorial accent",
  );
});
