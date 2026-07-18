import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const articlesDir = resolve(root, "src", "content", "articles");
const multipleArticle = resolve(articlesDir, "__toc-multiple.md");
const singleArticle = resolve(articlesDir, "__toc-single.md");
const multipleOutput = resolve(root, "dist", "study", "__toc-multiple", "index.html");
const singleOutput = resolve(root, "dist", "study", "__toc-single", "index.html");
const tocComponent = resolve(root, "src", "components", "ArticleToc.astro");
const gkdArticle = resolve(articlesDir, "GKD，好用的跳开屏广告软件.md");

let multipleHtml = "";
let singleHtml = "";

before(() => {
  writeFileSync(
    multipleArticle,
    `---
title: "TOC multiple headings"
date: 2026-07-10
section: study
draft: false
---

## Getting started

Introduction.

### Requirements

Details.

## Next steps

Conclusion.
`,
    "utf8",
  );

  writeFileSync(
    singleArticle,
    `---
title: "TOC single heading"
date: 2026-07-10
section: study
draft: false
---

# Markdown title

This level-one heading is not eligible.

## Only section

Only one eligible heading exists.
`,
    "utf8",
  );

  const astroCli = resolve(root, "node_modules", "astro", "bin", "astro.mjs");
  const build = spawnSync(process.execPath, [astroCli, "build"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(build.status, 0, `${build.error ?? ""}\n${build.stdout}\n${build.stderr}`);
  multipleHtml = readFileSync(multipleOutput, "utf8");
  singleHtml = readFileSync(singleOutput, "utf8");
});

after(() => {
  rmSync(multipleArticle, { force: true });
  rmSync(singleArticle, { force: true });
});

test("renders desktop and mobile TOCs when at least two eligible headings exist", () => {
  assert.ok(multipleHtml.includes('data-article-toc="desktop"'), "desktop TOC is missing");
  assert.ok(multipleHtml.includes('data-article-toc="mobile"'), "mobile TOC is missing");
  assert.ok(/<summary[^>]*>[^<]*本文目录/.test(multipleHtml), "mobile TOC summary is missing");
});

test("uses Astro heading slugs and preserves level-three hierarchy", () => {
  assert.ok(multipleHtml.includes('href="#getting-started"'), "level-two heading link is missing");
  assert.ok(/href="#requirements"[^>]*data-toc-depth="3"/.test(multipleHtml), "level-three hierarchy is missing");
  assert.ok(multipleHtml.includes('href="#next-steps"'), "final heading link is missing");
});

test("does not render a TOC for fewer than two level-two or level-three headings", () => {
  assert.ok(!singleHtml.includes("data-article-toc="), "single-heading article should not render a TOC");
});

test("uses TOC-eligible section headings in the GKD article", () => {
  const source = readFileSync(gkdArticle, "utf8");
  const headings = [...source.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
    depth: match[1].length,
    text: match[2],
  }));

  assert.deepEqual(headings, [
    { depth: 2, text: "闲聊" },
    { depth: 2, text: "安装" },
    { depth: 2, text: "导入规则" },
    { depth: 2, text: "小细节" },
  ]);
});

test("progressively marks the current desktop section for assistive technology", () => {
  const source = readFileSync(tocComponent, "utf8");
  assert.ok(source.includes("IntersectionObserver"), "TOC heading observer is missing");
  assert.ok(source.includes('aria-current", "location"'), "current-section accessibility state is missing");
});
