import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const profile = readFileSync(resolve(root, "src", "components", "ProfileCard.astro"), "utf8");
const calendar = readFileSync(resolve(root, "src", "components", "MiniCalendar.astro"), "utf8");
const globalCss = readFileSync(resolve(root, "src", "styles", "global.css"), "utf8");

test("keeps the profile avatar size while tightening vertical spacing", () => {
  assert.match(profile, /profile-card[^\n]+\bp-4\b[^\n]+\bsm:p-5\b/);
  assert.match(profile, /profile-avatar-link[^\n]+\bsize-16\b[^\n]+\bsm:size-18\b/);
  assert.match(profile, /profile-social-links\s+mt-4\b/);
  assert.match(profile, /profile-social-link[^\n]+\bpy-1\.5\b/);
  assert.match(profile, /\.profile-avatar-link\s*{[^}]*margin-top:\s*1rem/s);
});

test("keeps the calendar at its natural height in the wide-screen sidecar", () => {
  const wideScreen = globalCss.match(/@media \(min-width:\s*1600px\)\s*{([\s\S]*?)\n}/)?.[1] ?? "";

  assert.match(wideScreen, /\.latest-profile-sidecar\s*{[\s\S]*?display:\s*block/);
  assert.match(wideScreen, /\.latest-profile-sidecar\s*>\s*\.mt-4\s*{[\s\S]*?margin-top:\s*1rem/);
  assert.doesNotMatch(wideScreen, /height:\s*calc\(100%\s*-\s*3rem\)/);
  assert.doesNotMatch(wideScreen, /grid-template-rows:/);
  assert.doesNotMatch(calendar, /\.mini-calendar\s*{[^}]*height:\s*100%/s);
  assert.doesNotMatch(calendar, /\.cal-grid\s*{[^}]*flex:\s*1/s);
  assert.doesNotMatch(calendar, /align-content:\s*space-between/);
});
