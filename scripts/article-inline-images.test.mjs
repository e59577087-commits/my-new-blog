import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const globalCss = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");
const remarkObsidianPath = resolve(root, "src", "utils", "remark-obsidian.ts");
const remarkObsidianModule = existsSync(remarkObsidianPath) ? await import(pathToFileURL(remarkObsidianPath)) : null;

const transformText = (value) => {
  assert.ok(remarkObsidianModule, "Obsidian remark plugin is missing");
  const tree = {
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", value }] }],
  };
  remarkObsidianModule.remarkObsidian()(tree);
  return tree.children[0].children;
};

test("defaults Obsidian images to 150px while preserving explicit dimensions", () => {
  const [defaultImage] = transformText("![[photo.jpg]]");
  const [sizedImage] = transformText("![[photo.jpg|120x90]]");

  assert.equal(defaultImage.type, "image");
  assert.deepEqual(defaultImage.data?.hProperties, { width: "150" });
  assert.deepEqual(sizedImage.data?.hProperties, { width: "120", height: "90" });
});

test("renders sized article images inline with surrounding text", () => {
  const rule = globalCss.match(/\.prose-tech img\[width\]\s*\{([^}]*)\}/)?.[1];

  assert.ok(rule, "sized article image rule is missing");
  assert.match(rule, /display:\s*inline-block\s*;/, "sized article images are not inline");
  assert.match(rule, /vertical-align:\s*middle\s*;/, "sized article images are not aligned with the text");
});
