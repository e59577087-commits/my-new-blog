import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const home = readFileSync(resolve(root, "src", "pages", "index.astro"), "utf8");
const trailPath = resolve(root, "src", "components", "AnnualWritingTrail.astro");
const timelinePath = resolve(root, "src", "pages", "timeline.astro");

test("places the annual writing trail between homepage content and the global footer", () => {
  assert.match(home, /import AnnualWritingTrail from "\.\.\/components\/AnnualWritingTrail\.astro"/);
  assert.match(home, /<AnnualWritingTrail articles=\{articles\}\s*\/>\s*<\/BaseLayout>/);
});

test("builds the trail from published article dates and links", () => {
  const trail = readFileSync(trailPath, "utf8");

  assert.ok(trail.includes("笔耕不辍"), "writing trail title is missing");
  assert.ok(trail.includes("getEntryUrl"), "article nodes do not link to their entries");
  assert.match(trail, /Array\.from\(\{ length: 13 \}/, "the complete rolling-year scale is missing");
  assert.ok(trail.includes("data-writing-trail-node"), "interactive article nodes are missing");
  assert.ok(trail.includes("data-writing-trail-now"), "the current-time marker is missing");
  assert.ok(trail.includes("data-writing-trail-year-count"), "the current-year count is missing");
});

test("keeps the article dots usable without relying on hover or motion", () => {
  const trail = readFileSync(trailPath, "utf8");

  assert.match(trail, /aria-label=\{`阅读：\$\{article\.data\.title\}/);
  assert.match(trail, /\.writing-trail-node:focus-visible/);
  assert.match(trail, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(trail, /@media \(max-width: 640px\)/);
});

test("hides every article tooltip after its node loses hover and keyboard focus", () => {
  const trail = readFileSync(trailPath, "utf8");

  assert.match(trail, /\.writing-trail-node:hover \.writing-trail-tooltip,\s*\.writing-trail-node:focus-visible \.writing-trail-tooltip\s*\{/);
  assert.doesNotMatch(
    trail,
    /\.writing-trail-node(?:-[\w-]+)?\.is-latest \.writing-trail-tooltip/,
    "the latest article tooltip must not stay permanently visible",
  );
});

test("opens the complete writing timeline on its own page", () => {
  const trail = readFileSync(trailPath, "utf8");

  assert.match(trail, /href="\/timeline\/"/);
  assert.ok(trail.includes("翻阅完整时间线"), "the dedicated timeline link label is missing");
  assert.ok(existsSync(timelinePath), "the dedicated /timeline/ page is missing");

  const timeline = readFileSync(timelinePath, "utf8");
  assert.ok(timeline.includes("getPublishedArticles"), "the timeline does not load all published articles");
  assert.ok(timeline.includes("getEntryUrl"), "timeline entries do not link to their article routes");
  assert.ok(timeline.includes("data-full-timeline"), "the timeline page landmark is missing");
  assert.ok(timeline.includes("data-timeline-year"), "the year grouping is missing");
  assert.ok(timeline.includes("data-timeline-entry"), "the chronological article rows are missing");
});
