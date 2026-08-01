import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (...segments) => {
  const file = resolve(root, ...segments);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
};

test("defines reusable motion timing and easing tokens with a reduced-motion fallback", () => {
  const css = readSource("src", "styles", "global.css");

  assert.match(css, /--motion-duration-fast:\s*\d+ms/, "fast motion duration token is missing");
  assert.match(css, /--motion-duration-page:\s*\d+ms/, "page motion duration token is missing");
  assert.match(css, /--motion-ease-standard:\s*cubic-bezier\(/, "standard easing token is missing");
  assert.match(css, /--motion-ease-enter:\s*cubic-bezier\(/, "entrance easing token is missing");
  assert.match(css, /\.motion-card[\s\S]*?var\(--motion-duration-fast\)/, "cards do not use the shared motion tokens");
  assert.match(css, /prefers-reduced-motion:[\s\S]*?::view-transition-group\(article-title\)/, "shared transitions lack a reduced-motion fallback");
});

test("connects article cards and article details with named shared elements", () => {
  const baseLayout = readSource("src", "layouts", "BaseLayout.astro");
  const articleLayout = readSource("src", "layouts", "ArticleLayout.astro");
  const transitionComponent = readSource("src", "components", "ArticlePageTransition.astro");
  const css = readSource("src", "styles", "global.css");
  const cardSources = [
    readSource("src", "components", "EntryCard.astro"),
    readSource("src", "pages", "index.astro"),
    readSource("src", "components", "ShareLibrary.astro"),
    readSource("src", "components", "StudyDossier.astro"),
    readSource("src", "components", "EssayTimeline.astro"),
  ].join("\n");

  assert.match(baseLayout, /ArticlePageTransition/, "the shared-transition controller is not mounted");
  assert.match(transitionComponent, /sessionStorage/, "the destination transition is not scoped to a clicked article");
  assert.match(transitionComponent, /view-transition-name/, "the clicked source does not receive named transition elements");
  assert.match(cardSources, /data-article-transition/, "article links are not marked as transition sources");
  assert.match(cardSources, /data-article-transition-cover/, "article cover sources are not marked");
  assert.match(cardSources, /data-article-transition-title/, "article title sources are not marked");
  assert.match(articleLayout, /data-article-transition-cover/, "article cover destination is not marked");
  assert.match(articleLayout, /data-article-transition-title/, "article title destination is not marked");
  assert.match(transitionComponent, /addEventListener\("pageswap"/, "the source snapshot is not finalized at pageswap");
  assert.match(transitionComponent, /addEventListener\("pagereveal"/, "prerender activation cannot restore destination names");
  assert.match(css, /::view-transition-new\(root\)[\s\S]*?article-page-enter/, "navigation lacks a smooth whole-page fallback");
  assert.match(css, /@keyframes article-page-enter/, "the whole-page entrance animation is missing");
  assert.match(css, /:root\[data-article-transition="active"\]::view-transition-old\(root\)[\s\S]*?article-page-exit/, "article navigation does not hold the old page above the destination");
  assert.match(css, /:root\[data-article-transition="active"\]::view-transition-new\(root\)[\s\S]*?animation:\s*none/, "article navigation still fades the destination root over an empty page");
  assert.match(css, /@keyframes article-page-exit/, "the delayed article page exit animation is missing");
  assert.match(css, /data-article-transition-pending="true"/, "clicked cards do not expose immediate loading feedback");
});

test("prefetches article HTML without prerendering heavy destinations", () => {
  const transitionComponent = readSource("src", "components", "ArticlePageTransition.astro");

  assert.match(transitionComponent, /type="speculationrules"/, "article navigation does not publish speculation rules");
  assert.match(transitionComponent, /"prefetch"/, "article HTML is not prefetched before navigation");
  assert.doesNotMatch(transitionComponent, /"prerender"/, "article prerendering can race the click hand-off and load every body image");
  assert.match(transitionComponent, /selector_matches[^\n]+a\[data-article-transition\]/, "speculation is not limited to article transition links");
  assert.match(transitionComponent, /"eagerness"\s*:\s*"eager"/, "article prefetching starts too late");
  assert.match(transitionComponent, /cover\.decode/, "the clicked card cover is not decoded before its snapshot");
});

test("defers comments and Supabase until after the destination can render", () => {
  const comments = readSource("src", "components", "Comments.astro");

  assert.doesNotMatch(comments, /^\s*import\s+\{[^\n]+\}\s+from\s+["']\.\.\/lib\/supabaseClient["'];/m);
  assert.match(comments, /await import\(["']\.\.\/lib\/supabaseClient["']\)/);
  assert.match(comments, /requestIdleCallback/);
  assert.match(comments, /window\.addEventListener\(["']load["']/);
});

test("renders the innei.in sidebar read indicator", () => {
  const baseLayout = readSource("src", "layouts", "BaseLayout.astro");
  const articleLayout = readSource("src", "layouts", "ArticleLayout.astro");
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");
  const toc = readSource("src", "components", "ArticleToc.astro");

  assert.match(articleLayout, /ArticleReadingProgress/, "the Shiro read controller is not mounted");
  assert.match(articleLayout, /data-article-reading-root/, "article reading bounds are not marked");
  assert.match(toc, /data-shiro-read-indicator/, "the desktop TOC lacks the reading indicator accessory");
  assert.match(toc, /data-innei-toc-divider/, "the innei.in wavy divider is missing");
  assert.match(toc, /M2 6\.5 C4 3, 7 2\.5, 9 5 C11 8, 14 8, 17 5 C19 2, 22 3, 25 6\.5/, "the divider does not use innei.in's wave path");
  assert.match(toc, /<circle cx="7" cy="7" r="6"/, "the 14px circular progress ring is missing");
  assert.match(toc, /data-shiro-read-percent/, "the percentage label is missing");
  assert.match(toc, /data-shiro-back-top/, "the innei.in-style back-to-top action is missing");
  assert.doesNotMatch(progress, /data-shiro-reading-edge/, "the old Shiro right-edge fallback is still mounted");
  assert.match(progress, /Math\.min\(window\.scrollY, window\.innerHeight\)/, "the reading percentage algorithm is not used");
  assert.match(progress, /data-article-reading-root/, "progress is not calculated from article bounds");
  assert.match(baseLayout, /type !== "article"[\s\S]*?<ScrollTopButton/, "the old circular page progress still duplicates Shiro on articles");
});

test("keeps TOC section highlighting separate from Shiro reading progress", () => {
  const toc = readSource("src", "components", "ArticleToc.astro");

  assert.match(toc, /aria-current", "location"/, "the current section accessibility state is missing");
  assert.doesNotMatch(toc, /data-toc-reading-progress/, "the previous in-TOC fill rail is still rendered");
  assert.doesNotMatch(toc, /--toc-reading-progress/, "the previous TOC progress state is still present");
  assert.match(toc, /toc-link\[aria-current="location"\]::before/, "the active innei.in-style TOC marker is missing");
  assert.match(toc, /toc-link\[aria-current="location"\][\s\S]*?color:\s*var\(--color-accent\)/, "the active TOC item does not use the accent color");
  assert.doesNotMatch(toc, /\.toc-link\[aria-current="location"\]\s*\{[^}]*background:/, "the active TOC item still has a filled background");
});

test("switches the active heading when the reading curve crosses its node", () => {
  const toc = readSource("src", "components", "ArticleToc.astro");
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");

  assert.match(progress, /const deltaHeight\s*=\s*Math\.min\(window\.scrollY,\s*window\.innerHeight\)/, "the reading curve no longer uses the viewport reading position");
  assert.match(toc, /const readingLine\s*=\s*Math\.min\(window\.scrollY,\s*window\.innerHeight\)/, "the active heading does not use the same viewport reading position as the curve");
  assert.doesNotMatch(toc, /const readingLine\s*=\s*112/, "the old fixed top offset still makes every heading switch late");
});

test("collapses the desktop TOC into innei.in's reading track and expands it on hover or focus", () => {
  const toc = readSource("src", "components", "ArticleToc.astro");
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");

  assert.match(toc, /data-innei-toc-rail/, "the compact reading track is missing");
  assert.match(toc, /data-innei-rail-path/, "the track does not include the curved progress path");
  assert.match(toc, /data-innei-rail-node/, "heading nodes are not rendered on the track");
  assert.match(toc, /data-innei-rail-title/, "the compact track does not expose the active heading title");
  assert.match(toc, /article-toc-expanded/, "the full TOC is not isolated as the expanded state");
  assert.match(toc, /article-toc-desktop:is\(:hover,\s*:focus-within\)[\s\S]*?article-toc-expanded[\s\S]*?opacity:\s*1/, "hover and keyboard focus do not reveal the full TOC");
  assert.match(toc, /article-toc-desktop:is\(:hover,\s*:focus-within\)[\s\S]*?innei-toc-rail[\s\S]*?opacity:\s*0/, "the compact track does not hide while the full TOC is open");
  assert.match(toc, /addEventListener\("pointerenter"[\s\S]*?dataset\.expanded\s*=\s*"true"/, "pointer entry does not explicitly open the transparent TOC hit area");
  assert.match(toc, /addEventListener\("pointerleave"[\s\S]*?dataset\.expanded\s*=\s*"false"/, "pointer exit does not explicitly restore the compact track");
  assert.match(toc, /article-toc-desktop\[data-expanded="true"\][\s\S]*?article-toc-expanded[\s\S]*?opacity:\s*1/, "the explicit pointer state does not reveal the full TOC");
  assert.match(progress, /getTotalLength\(\)/, "the curved track is not used to position heading nodes");
  assert.match(progress, /data-innei-rail-label/, "the compact progress label is not positioned from reading progress");
});

test("animates the reading-track curve with a scroll-velocity pulse and a reduced-motion fallback", () => {
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");

  assert.match(progress, /railMotionStates\s*=\s*new WeakMap/, "rail animation state is not retained between scroll frames");
  assert.match(progress, /pulseVelocity/, "scroll changes do not create a curve-width impulse");
  assert.match(progress, /curveRadius\s*=\s*56\s*\+\s*25\s*\*/, "the curve does not expand vertically from the sampled target geometry");
  assert.match(progress, /curveWidth\s*=\s*11\s*\+\s*11\s*\*/, "the curve does not expand horizontally from the sampled target geometry");
  assert.match(progress, /requestAnimationFrame\(stepRailMotion\)/, "the rail path is not animated frame by frame");
  assert.match(progress, /pulseVelocity\s*\+=\s*-165\s*\*/, "the curve pulse does not use the sampled spring tension");
  assert.match(progress, /Math\.exp\(-15\s*\*\s*deltaSeconds\)/, "the velocity pulse does not use the sampled damped response");
  assert.match(progress, /reducedMotion\.matches[\s\S]*?drawReadingRail/, "reduced motion does not bypass the spring animation");
});

test("centers the darker progress dash on the curve apex", () => {
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");
  const toc = readSource("src", "components", "ArticleToc.astro");

  assert.match(progress, /railAccentSpan\s*=\s*0\.12/, "the accent dash length is not shared with its alignment calculation");
  assert.match(progress, /apexLength\s*=\s*lengthOnRailAtY\(basePath,\s*curveCenter\)/, "the flattened endpoint is not resolved from its vertical path position");
  assert.match(progress, /accentStart\s*=\s*Math\.max\(0,\s*apexLength\s*-\s*pathLength\s*\*\s*railAccentSpan\s*\/\s*2\)/, "the darker segment is not clipped at the start of the rail");
  assert.match(progress, /accentEnd\s*=\s*Math\.min\(pathLength,\s*apexLength\s*\+\s*pathLength\s*\*\s*railAccentSpan\s*\/\s*2\)/, "the darker segment is not clipped at the end of the rail");
  assert.match(progress, /accentPath\.setAttribute\("d",\s*buildRailAccentPath\(basePath,\s*accentStart,\s*accentEnd\)\)/, "the darker segment is not drawn from the real curve geometry");
  assert.doesNotMatch(progress, /accentPath\.style\.strokeDashoffset/, "the disappearing dash-offset implementation is still active");
  assert.doesNotMatch(toc, /data-innei-rail-path="accent"[^>]*stroke-dasharray=/, "the darker segment can still wrap around or disappear at a rail endpoint");
});

test("lets the reading curve reach the exact top and bottom of the rail", () => {
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");

  assert.match(progress, /curveCenter\s*=\s*Math\.min\(height,\s*Math\.max\(0,\s*state\.center\)\)/, "the curve center is still inset from the rail endpoints");
  assert.match(progress, /topRadius\s*=\s*Math\.min\(constrainedRadius,\s*curveCenter\)/, "the upper half of the curve is not compressed at the top edge");
  assert.match(progress, /bottomRadius\s*=\s*Math\.min\(constrainedRadius,\s*height\s*-\s*curveCenter\)/, "the lower half of the curve is not compressed at the bottom edge");
  assert.match(progress, /edgeCurveScale\s*=\s*Math\.min\(1,\s*Math\.min\(curveCenter,\s*height\s*-\s*curveCenter\)\s*\/\s*constrainedRadius\)/, "the horizontal curve does not flatten smoothly at the endpoints");
  assert.match(progress, /curveX\s*=\s*8\s*\+\s*constrainedWidth\s*\*\s*edgeCurveScale/, "the endpoint curve can still fold into a horizontal hook");
  assert.doesNotMatch(progress, /Math\.min\(height\s*-\s*constrainedRadius,\s*Math\.max\(constrainedRadius,\s*state\.center\)\)/, "the old radius-sized endpoint inset is still active");
});

test("keeps the compact reading track from dominating tall viewports", () => {
  const toc = readSource("src", "components", "ArticleToc.astro");

  assert.match(toc, /article-toc-desktop[\s\S]*?height:\s*min\(56vh,\s*34rem,\s*calc\(100vh\s*-\s*var\(--site-header-height\)\s*-\s*5\.75rem\)\)/, "the compact track does not use the shorter responsive height");
  assert.doesNotMatch(toc, /article-toc-desktop[\s\S]*?height:\s*min\(75vh,/, "the old near-full-height track is still active");
});

test("keeps the compact rail label visible at both endpoints", () => {
  const progress = readSource("src", "components", "ArticleReadingProgress.astro");

  assert.match(progress, /railLabelInset\s*=\s*16/, "the rail label does not reserve a small endpoint inset");
  assert.match(progress, /labelCenter\s*=\s*Math\.min\(height\s*-\s*railLabelInset,\s*Math\.max\(railLabelInset,\s*curveCenter\)\)/, "the rail label is not clamped inside the track");
  assert.match(progress, /translateY\(\$\{labelCenter\}px\)/, "the clamped label position is not applied");
  assert.doesNotMatch(progress, /translateY\(\$\{curveCenter\}px\)\s*translateY\(-50%\)/, "the label can still be clipped at the rail endpoints");
});

test("distinguishes active, root, and nested heading nodes", () => {
  const toc = readSource("src", "components", "ArticleToc.astro");

  assert.match(toc, /rootDepth\s*=\s*Math\.min\(\.\.\.headings\.map\(\(heading\)\s*=>\s*heading\.depth\)\)/, "the root heading depth is not derived from the article outline");
  assert.match(toc, /data-root=\{heading\.depth\s*===\s*rootDepth\s*\?\s*"true"\s*:\s*"false"\}/, "rail nodes do not expose their outline level");
  assert.match(toc, /r=\{index\s*===\s*0\s*\?\s*"2\.5"\s*:\s*heading\.depth\s*===\s*rootDepth\s*\?\s*"1\.75"\s*:\s*"1\.25"\}/, "initial rail node radii do not preserve the heading hierarchy");
  assert.match(toc, /node\.setAttribute\(\s*"r",\s*isActive\s*\?\s*"2\.5"\s*:\s*node\.dataset\.root\s*===\s*"true"\s*\?\s*"1\.75"\s*:\s*"1\.25"\s*\)/, "active-section changes do not restore root and nested node sizes");
  assert.match(toc, /data-innei-rail-node\]\[data-root="false"\][\s\S]*?18%/, "nested rail nodes are not visually quieter than root nodes");
});

test("crossfades the compact rail title when the active section changes", () => {
  const toc = readSource("src", "components", "ArticleToc.astro");

  assert.match(toc, /tocReducedMotion\s*=\s*window\.matchMedia\("\(prefers-reduced-motion:\s*reduce\)"\)/, "title motion does not respect reduced-motion preferences");
  assert.match(toc, /railTitleAnimations\s*=\s*new WeakMap<HTMLElement,\s*Animation>\(\)/, "title animations cannot be interrupted cleanly");
  assert.equal((toc.match(/label\.animate\(/g) || []).length, 2, "the title does not animate through separate exit and enter phases");
  assert.match(toc, /transform:\s*"translateY\(-3px\)"/, "the outgoing title does not drift upward");
  assert.match(toc, /transform:\s*"translateY\(3px\)"/, "the incoming title does not enter from below");
  assert.match(toc, /duration:\s*250/, "the title transition does not use innei.in's 250ms timing");
  assert.match(toc, /tocReducedMotion\.matches[\s\S]*?label\.textContent\s*=\s*nextTitle/, "reduced motion does not switch the title immediately");
  assert.match(toc, /exitAnimation\.cancel\(\);[\s\S]*?label\.textContent\s*=\s*nextTitle[\s\S]*?const enterAnimation/, "the outgoing fill frame can hide the title after the enter animation completes");
});
