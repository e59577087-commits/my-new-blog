import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = resolve(root, "src", "content", "articles", "__external-links.md");
const output = resolve(root, "dist", "study", "__external-links", "index.html");
let html = "";

const anchorAttributes = (label) => {
  const match = new RegExp(`<a([^>]*)>${label}</a>`).exec(html);
  assert.ok(match, `${label} link is missing`);
  return match[1];
};

before(() => {
  writeFileSync(
    fixture,
    `---
title: "External link behavior"
date: 2026-07-11
section: study
draft: false
---

[HTTPS external](https://external.example/path "External title")

[HTTP external](http://insecure.example/path)

[Internal path](/about/)

[Relative path](../about/)

[Page anchor](#details)

[Email link](mailto:reader@example.com)

[Phone link](tel:+123456789)

[[科学上网|Internal wiki]]
`,
    "utf8",
  );

  const astroCli = resolve(root, "node_modules", "astro", "bin", "astro.mjs");
  const build = spawnSync(process.execPath, [astroCli, "build"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(build.status, 0, `${build.error ?? ""}\n${build.stdout}\n${build.stderr}`);
  html = readFileSync(output, "utf8");
});

after(() => {
  rmSync(fixture, { force: true });
});

test("opens HTTP and HTTPS Markdown links in a secure new tab", () => {
  for (const label of ["HTTPS external", "HTTP external"]) {
    const attributes = anchorAttributes(label);
    assert.match(attributes, /target="_blank"/);
    assert.match(attributes, /rel="noopener noreferrer"/);
  }

  const httpsAttributes = anchorAttributes("HTTPS external");
  assert.match(httpsAttributes, /href="https:\/\/external\.example\/path"/);
  assert.match(httpsAttributes, /title="External title"/);
});

test("keeps non-HTTP and Obsidian links in the current tab", () => {
  for (const label of ["Internal path", "Relative path", "Page anchor", "Email link", "Phone link", "Internal wiki"]) {
    const attributes = anchorAttributes(label);
    assert.ok(!attributes.includes('target="_blank"'), `${label} should not open a new tab`);
    assert.ok(!attributes.includes("noopener"), `${label} should not receive external-link security attributes`);
  }
});
