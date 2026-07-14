import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import yaml from "js-yaml";

const articleUrl = new URL("../src/content/articles/GKD，好用的跳开屏广告软件.md", import.meta.url);

const readArticle = async () => {
  const source = await readFile(articleUrl, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(frontmatter, "article frontmatter is missing");
  return {
    data: yaml.load(frontmatter[1]),
    body: source.slice(frontmatter[0].length),
  };
};

test("GKD article uses the public-root cover URL", async () => {
  const { data } = await readArticle();
  assert.equal(data.cover, "/gkd.png");
});

test("GKD article title describes an ad-skipping tool", async () => {
  const { data } = await readArticle();
  assert.equal(data.title, "GKD，好用的开屏广告跳过工具");
});

test("GKD installation guidance covers the current version and sensitive permission", async () => {
  const { body } = await readArticle();
  assert.match(body, /最新正式版 APK（撰写时为 v1\.12\.1）/);
  assert.match(body, /无障碍权限/);
  assert.match(body, /权限[^。]*敏感/);
  assert.match(body, /官方渠道/);
});

test("GKD subscription guidance identifies its source and usage limits", async () => {
  const { body } = await readArticle();
  assert.match(body, /第三方订阅/);
  assert.match(body, /社区[^。]*Fork/);
  assert.match(body, /禁止在国内平台传播/);
  assert.match(body, /按需开启/);
});

test("GKD copy uses readable product names and numbered import steps", async () => {
  const { body } = await readArticle();
  for (const term of ["GitHub", "APK", "Star", "AI"]) {
    assert.ok(body.includes(term), `${term} typography is missing`);
  }
  for (const step of [1, 2, 3, 4, 5]) {
    assert.match(body, new RegExp(`^${step}\\. `, "m"), `step ${step} is missing`);
  }
});
