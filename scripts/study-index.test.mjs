import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const articlesDir = resolve(root, "src", "content", "articles");
const output = resolve(root, "dist", "study", "index.html");
const studyPage = resolve(root, "src", "pages", "study.astro");
const studyComponent = resolve(root, "src", "components", "StudyDossier.astro");
const globalCss = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");

const fixtures = [
  {
    name: "__study-ongoing.md",
    content: `---
title: "正在学 Astro"
description: "一则仍在推进的学习札记。"
date: 2026-08-05
tags: [" 学习中 ", "Astro"]
section: study
category: "前端"
draft: false
---

正文。
`,
  },
  {
    name: "__study-completed.md",
    content: `---
title: "已整理 TypeScript"
description: "一则已经整理的知识文章。"
date: 2026-08-04
tags: ["已整理", "TypeScript"]
section: study
draft: false
---

正文。
`,
  },
  {
    name: "__study-both.md",
    content: `---
title: "优先归档的双状态文章"
date: 2026-08-03
tags: ["学习中", "已整理", "双状态"]
section: study
draft: false
---

正文。
`,
  },
  {
    name: "__study-default.md",
    content: `---
title: "默认进入研习中"
date: 2026-08-02
tags: ["JavaScript"]
section: study
draft: false
---

正文。
`,
  },
  {
    name: "__study-minimal.md",
    content: `---
title: "没有可选字段的札记"
date: 2026-08-01
section: study
draft: false
---

正文。
`,
  },
];

let html = "";

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
  html = readFileSync(output, "utf8");
});

after(() => {
  for (const fixture of fixtures) {
    rmSync(resolve(articlesDir, fixture.name), { force: true });
  }
});

test("renders the study dossier title, subtitle, and statistics", () => {
  assert.ok(html.includes("data-study-dossier"), "study dossier is missing");
  assert.match(
    html,
    /<h1[^>]*>学习<\/h1>\s*<p class="section-subtitle">静下心来，咬好每一口<\/p>/,
  );
  assert.ok(html.includes("5 则札记 · 3 项研习中"), "study statistics are incorrect");
  assert.ok(!html.includes('data-appearance-article-list="catalog"'), "generic catalog remains on study page");
});

test("classifies study articles with completed status taking priority", () => {
  assert.match(html, /data-study-state="ongoing"[^>]*>[\s\S]*?正在学 Astro/);
  assert.match(html, /data-study-state="ongoing"[^>]*>[\s\S]*?默认进入研习中/);
  assert.match(html, /data-study-state="ongoing"[^>]*>[\s\S]*?没有可选字段的札记/);
  assert.match(html, /data-study-state="completed"[^>]*>[\s\S]*?已整理 TypeScript/);
  assert.match(html, /data-study-state="completed"[^>]*>[\s\S]*?优先归档的双状态文章/);
});

test("keeps status tags out of ordinary topic-tag lists", () => {
  const lists = [...html.matchAll(/<ul[^>]*data-study-topic-tags[^>]*>([\s\S]*?)<\/ul>/g)];
  assert.ok(lists.length > 0, "study topic tag lists are missing");
  for (const [, content] of lists) {
    assert.ok(!content.includes("学习中"), "ongoing status leaked into topic tags");
    assert.ok(!content.includes("已整理"), "completed status leaked into topic tags");
  }
  assert.ok(html.includes("Astro"), "ordinary ongoing topic is missing");
  assert.ok(html.includes("TypeScript"), "ordinary completed topic is missing");
});

test("omits the overall empty state while keeping per-group empty states", () => {
  const sources = readFileSync(studyPage, "utf8")
    + (existsSync(studyComponent) ? readFileSync(studyComponent, "utf8") : "");
  assert.ok(!sources.includes("STUDIUM"), "overall study empty-state kicker remains");
  assert.ok(!sources.includes("卷帙待启"), "overall study empty-state title remains");
  assert.ok(!sources.includes("案头尚静，待第一则求知札记落笔。"), "overall study empty-state copy remains");
  assert.ok(!sources.includes("data-study-empty"), "overall study empty-state marker remains");
  assert.ok(sources.includes("data-study-ongoing-empty"), "ongoing group empty state is missing");
  assert.ok(sources.includes("data-study-completed-empty"), "completed group empty state is missing");
});

test("defines distinct study tones and responsive dossier layouts", () => {
  assert.ok(globalCss.includes(".study-index"), "study section color system is missing");
  assert.ok(globalCss.includes(".study-dossier"), "study dossier styles are missing");
  assert.ok(globalCss.includes(".study-subtitle-strike"), "subtitle strikethrough style is missing");
  assert.ok(globalCss.includes(".study-ongoing-grid"), "ongoing responsive grid is missing");
  assert.ok(globalCss.includes(".study-archive-list"), "completed archive styles are missing");
});
