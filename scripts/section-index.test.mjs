import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const articlesDir = resolve(root, "src", "content", "articles");
const toolsOutput = resolve(root, "dist", "tools", "index.html");
const shareOutput = resolve(root, "dist", "share", "index.html");
const homeOutput = resolve(root, "dist", "index.html");
const globalCss = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");

const fixtures = [
  {
    name: "__section-essay-august.md",
    content: `---
title: "八月的新故事"
description: "用于验证最新月份和时间线顺序。"
date: 2026-08-02
tags: ["日常"]
section: essay
draft: false
---

八月随笔。
`,
  },
  {
    name: "__section-essay-july.md",
    content: `---
title: "七月的旧故事"
date: 2026-07-01
section: essay
draft: false
---

七月随笔。
`,
  },
  {
    name: "__section-share-primary.md",
    content: `---
title: "网络教程"
description: "用于验证自动标签筛选。"
date: 2026-08-03
tags: [" 教程 ", "网络", "教程"]
section: share
category: "指南"
draft: false
---

分享正文。
`,
  },
  {
    name: "__section-share-secondary.md",
    content: `---
title: "工具分享"
date: 2026-08-01
tags: ["网络", "工具"]
section: share
draft: false
---

分享正文。
`,
  },
  {
    name: "__section-share-draft.md",
    content: `---
title: "不应出现的草稿"
date: 2026-08-04
tags: ["草稿专属"]
section: share
draft: true
---

草稿正文。
`,
  },
  {
    name: "__section-study-home.md",
    content: `---
title: "首页学习预览"
date: 2026-08-01
tags: ["学习中", "测试"]
section: study
draft: false
---

学习正文。
`,
  },
];

let toolsHtml = "";
let shareHtml = "";
let homeHtml = "";

before(() => {
  for (const fixture of fixtures) {
    writeFileSync(resolve(articlesDir, fixture.name), fixture.content, "utf8");
  }

  const astroCli = resolve(root, "node_modules", "astro", "bin", "astro.mjs");
  const build = spawnSync(process.execPath, [astroCli, "build"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(build.status, 0, `${build.error ?? ""}\n${build.stdout}\n${build.stderr}`);
  toolsHtml = readFileSync(toolsOutput, "utf8");
  shareHtml = readFileSync(shareOutput, "utf8");
  homeHtml = readFileSync(homeOutput, "utf8");
});

after(() => {
  for (const fixture of fixtures) {
    rmSync(resolve(articlesDir, fixture.name), { force: true });
  }
});

test("renders a dedicated chronological essay timeline", () => {
  assert.ok(toolsHtml.includes("data-essay-timeline"), "essay timeline is missing");
  assert.ok(toolsHtml.includes("2026年8月"), "August group is missing");
  assert.ok(toolsHtml.includes("2026年7月"), "July group is missing");
  assert.ok(
    toolsHtml.indexOf("八月的新故事") < toolsHtml.indexOf("七月的旧故事"),
    "essays are not in descending date order",
  );
  assert.ok(!toolsHtml.includes('data-appearance-article-list="catalog"'), "generic catalog remains on essays");
});

test("renders literary subtitles and removes the previous section copy", () => {
  assert.match(toolsHtml, /<h1[^>]*>随笔<\/h1>\s*<p class="section-subtitle">浮生拾遗<\/p>/);
  assert.match(shareHtml, /<h1[^>]*>分享<\/h1>\s*<p class="section-subtitle">任君采撷<\/p>/);

  for (const removed of ["JOURNAL / 随笔", "生活近况", "一些最近常出现在生活里的小东西，也包括那些让我哭笑不得的时刻。"] ) {
    assert.ok(!toolsHtml.includes(removed), `old essay copy remains: ${removed}`);
  }
  for (const removed of ["LIBRARY / 分享", "实用内容库", "整理教程、工具与走过弯路后留下的经验，方便需要的时候快速找到。"] ) {
    assert.ok(!shareHtml.includes(removed), `old share copy remains: ${removed}`);
  }

  assert.ok(toolsHtml.includes("篇记录"), "essay statistics were removed");
  assert.ok(shareHtml.includes("份分享"), "share statistics were removed");
});

test("styles section subtitles as restrained literary Chinese captions", () => {
  assert.match(globalCss, /\.section-subtitle\s*\{[^}]*font-family:\s*"LXGW WenKai"[^;]*FangSong[^;]*serif;/s);
  assert.match(globalCss, /\.section-subtitle\s*\{[^}]*font-weight:\s*400;/s);
  assert.match(globalCss, /\.section-subtitle\s*\{[^}]*letter-spacing:\s*0\.16em;/s);
  assert.match(globalCss, /\.section-subtitle\s*\{[^}]*color:\s*var\(--color-muted\);/s);
  assert.match(globalCss, /\.section-subtitle\s*\{[^}]*transform:\s*skewX\(-6deg\);/s);
  assert.ok(globalCss.includes("letter-spacing: 0.12em;"), "mobile subtitle tracking is not tightened");
});

test("uses the destination-page subtitles on homepage sections", () => {
  assert.match(homeHtml, /<h2[^>]*>随笔<\/h2>\s*<p class="section-subtitle home-section-subtitle">浮生拾遗<\/p>/);
  assert.match(homeHtml, /<h2[^>]*>分享<\/h2>\s*<p class="section-subtitle home-section-subtitle">任君采撷<\/p>/);
  assert.match(
    homeHtml,
    /<h2[^>]*>学习<\/h2>\s*<p class="section-subtitle home-section-subtitle">仙人抚我顶（<span class="study-subtitle-strike">并非挠自己头<\/span>）<\/p>/,
  );

  for (const removed of ["小事小事。", "好东西好东西。", "研究研究。"] ) {
    assert.ok(!homeHtml.includes(removed), `old homepage subtitle remains: ${removed}`);
  }
});

test("keeps homepage literary subtitles compact and wrappable", () => {
  assert.match(globalCss, /\.section-subtitle\.home-section-subtitle\s*\{[^}]*font-size:\s*clamp\(0\.78rem, 1\.2vw, 0\.88rem\);/s);
  assert.match(globalCss, /\.section-subtitle\.home-section-subtitle\s*\{[^}]*margin-top:\s*0\.2rem;/s);
  assert.match(globalCss, /\.section-subtitle\.home-section-subtitle\s*\{[^}]*letter-spacing:\s*0\.12em;/s);
  assert.match(globalCss, /\.section-subtitle\.home-section-subtitle\s*\{[^}]*white-space:\s*normal;/s);
});

test("widens essay covers without increasing card height", () => {
  assert.match(
    globalCss,
    /\.essay-entry-card\s*\{[^}]*grid-template-columns:\s*10\.5rem minmax\(0, 1fr\);[^}]*min-height:\s*8\.25rem;/s,
    "desktop cover should be 10.5rem wide while retaining the 8.25rem card height",
  );
  assert.ok(
    globalCss.includes("grid-template-columns: 7rem minmax(0, 1fr);"),
    "mobile cover should be 7rem wide",
  );
  assert.ok(globalCss.includes("min-height: 7rem;"), "mobile card height should remain 7rem");
});

test("builds normalized share filters from published article tags", () => {
  assert.ok(shareHtml.includes("data-share-library"), "share library is missing");
  assert.ok(shareHtml.includes('data-share-filter="all"'), "the all filter is missing");
  assert.equal((shareHtml.match(/data-share-filter="教程"/g) ?? []).length, 1, "教程 filter is not normalized");
  assert.equal((shareHtml.match(/data-share-filter="网络"/g) ?? []).length, 1, "网络 filter is duplicated");
  assert.equal((shareHtml.match(/data-share-filter="工具"/g) ?? []).length, 1, "工具 filter is missing");
  assert.ok(!shareHtml.includes("草稿专属"), "draft-only tag leaked into filters");
  assert.ok(!shareHtml.includes("不应出现的草稿"), "draft article leaked into the page");
});

test("uses 分享 as the default share card category", () => {
  assert.match(
    shareHtml,
    /<div class="share-card-meta"><span>分享<\/span><time[^>]*>[\s\S]*?<\/time><\/div><h2[^>]*>工具分享<\/h2>/,
  );
});

test("renders accessible filter state and no-results recovery", () => {
  assert.match(shareHtml, /data-share-filter="all"[^>]*aria-pressed="true"/);
  assert.ok(shareHtml.includes("data-share-tags"), "filterable tag data is missing from cards");
  assert.ok(shareHtml.includes("data-share-empty"), "filtered empty state is missing");
  assert.ok(shareHtml.includes("data-share-reset"), "filter reset control is missing");
  assert.ok(!shareHtml.includes('data-appearance-article-list="catalog"'), "generic catalog remains on shares");
});
