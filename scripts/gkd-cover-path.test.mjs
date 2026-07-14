import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import yaml from "js-yaml";

const articleUrl = new URL("../src/content/articles/GKD，好用的跳开屏广告软件.md", import.meta.url);

test("GKD article uses the public-root cover URL", async () => {
  const source = await readFile(articleUrl, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  assert.ok(frontmatter, "article frontmatter is missing");
  assert.equal(yaml.load(frontmatter[1]).cover, "/gkd.png");
});
