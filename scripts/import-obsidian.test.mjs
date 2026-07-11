import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = resolve(root, "scripts", "import-obsidian.mjs");
const articlesDir = resolve(root, "src", "content", "articles");
const publicDir = resolve(root, "public");
const fixtureRoot = resolve(root, ".tmp-import-obsidian-test");

const runImport = (...args) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
  });

const cleanup = (...paths) => {
  for (const path of paths) {
    rmSync(path, { force: true, recursive: true });
  }
};

test("refuses to overwrite an existing article unless --force is passed", () => {
  const vault = resolve(fixtureRoot, "overwrite-vault");
  const note = resolve(vault, "existing-note.md");
  const dest = resolve(articlesDir, "existing-note.md");

  cleanup(vault, dest);
  try {
    mkdirSync(resolve(vault, ".obsidian"), { recursive: true });
    writeFileSync(note, "Fresh note body\n", "utf8");
    writeFileSync(dest, "keep me\n", "utf8");

    const blocked = runImport(note);
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /已存在|exists/i);
    assert.equal(readFileSync(dest, "utf8"), "keep me\n");

    const forced = runImport(note, "--force");
    assert.equal(forced.status, 0, forced.stderr);
    assert.match(readFileSync(dest, "utf8"), /Fresh note body/);
  } finally {
    cleanup(vault, dest);
  }
});

test("parses YAML frontmatter arrays and keeps Obsidian image size suffixes", () => {
  const vault = resolve(fixtureRoot, "yaml-vault");
  const note = resolve(vault, "yaml-note.md");
  const image = resolve(vault, "attachments", "screen shot.png");
  const dest = resolve(articlesDir, "yaml-note.md");
  const copiedImage = resolve(publicDir, "yaml-note-screen shot.png");

  cleanup(vault, dest, copiedImage);
  try {
    mkdirSync(resolve(vault, ".obsidian"), { recursive: true });
    mkdirSync(dirname(image), { recursive: true });
    writeFileSync(image, "fake image bytes", "utf8");
    writeFileSync(
      note,
      `---
title: "YAML Note"
tags: [alpha, beta]
date: 2026-07-08
---

Body paragraph long enough to become a description.

![[attachments/screen shot.png|320]]
`,
      "utf8",
    );

    const result = runImport(note);
    assert.equal(result.status, 0, result.stderr);

    const output = readFileSync(dest, "utf8");
    assert.match(output, /tags:\n  - alpha\n  - beta/);
    assert.match(output, /!\[\[yaml-note-screen shot\.png\|320\]\]/);
  } finally {
    cleanup(vault, dest, copiedImage);
  }
});
