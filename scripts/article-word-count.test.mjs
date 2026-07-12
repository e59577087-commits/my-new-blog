import assert from "node:assert/strict";
import { test } from "node:test";
import { countArticleWords, countArticlesWords } from "../src/utils/articleWordCount.ts";

test("counts CJK characters and Latin or numeric tokens", () => {
  assert.equal(countArticleWords("你好世界 Astro blog 2026"), 7);
  assert.equal(countArticleWords("かな 한글"), 4);
});

test("ignores Markdown decoration, link targets, HTML tags, and punctuation", () => {
  const markdown = `# 标题

[链接文字](https://example.com/path) <strong>正文</strong>

\`const value = 1\`
`;

  assert.equal(countArticleWords(markdown), 11);
});

test("totals article bodies and treats missing content as empty", () => {
  assert.equal(countArticlesWords([{ body: "你好" }, { body: "Astro blog" }, { body: undefined }]), 4);
  assert.equal(countArticlesWords([]), 0);
});
