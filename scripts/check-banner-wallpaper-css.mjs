import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/styles/global.css"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const mobileBannerRule = css.match(/:root\[data-wallpaper-mode="banner"\]\s+\.home-hero-banner\s*\{[^}]+\}/g)?.at(-1) ?? "";
const blackHoleScopeRule = css.match(/\.home-black-hole-scope\s*\{[^}]+\}/)?.[0] ?? "";
const scopedHeroRule = css.match(/\.home-black-hole-scope\s+\.home-hero-banner\s*\{[^}]+\}/)?.[0] ?? "";

assert(mobileBannerRule, "Mobile banner wallpaper rule is missing");
assert(
  !/background-size:\s*100%\s+auto\s*;/.test(mobileBannerRule),
  "Mobile banner wallpaper must not fit by width because it exposes the page background above the image",
);
assert(
  !/min-height:\s*calc\(46\.8vw\s*\+\s*var\(--site-header-height\)\)\s*;/.test(mobileBannerRule),
  "Mobile banner height must not be coupled to wallpaper aspect ratio",
);
assert(blackHoleScopeRule, "Black hole scope rule is missing");
assert(
  /margin-top:\s*calc\(var\(--site-header-height\)\s*\*\s*-1\)\s*;/.test(blackHoleScopeRule),
  "Black hole scope must extend behind the sticky header so the banner does not reveal the page background",
);
assert(scopedHeroRule, "Scoped hero rule is missing");
assert(
  /margin-top:\s*0\s*;/.test(scopedHeroRule),
  "Hero margin must be neutralized inside the black hole scope to avoid double header overlap",
);

console.log("banner wallpaper CSS checks passed");
