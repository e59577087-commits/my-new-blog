import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const componentPath = "src/components/HomepageBlackHole.astro";
assert(existsSync(join(root, componentPath)), "HomepageBlackHole component is missing");

const component = read(componentPath);
assert(component.includes("data-home-black-hole-root"), "HomepageBlackHole root data attribute is missing");
assert(component.includes("data-home-black-hole-canvas"), "HomepageBlackHole canvas data attribute is missing");
assert(component.includes("position: fixed"), "HomepageBlackHole canvas should render only the viewport, not the full page");
assert(component.includes("data-black-hole-warp"), "HomepageBlackHole does not target warpable content");
assert(component.includes("data-black-hole-text-warp"), "HomepageBlackHole does not target text for separate suction");
assert(component.includes("uGrowth"), "HomepageBlackHole shader is missing growth-driven disk shaping");
assert(component.includes("uPageTexture"), "HomepageBlackHole shader is missing a captured page texture");
assert(component.includes("uTextureRect"), "HomepageBlackHole shader is missing the captured texture bounds");
assert(component.includes("uViewportRect"), "HomepageBlackHole shader is missing viewport-to-page texture mapping");
assert(component.includes("captureWholePageTexture"), "HomepageBlackHole should capture a stable page texture for real lensing");
assert(component.includes("viewportState"), "HomepageBlackHole should convert page-space motion to viewport-space rendering");
assert(component.includes("html2canvas"), "HomepageBlackHole should use html2canvas for the MVP page texture capture");
assert(component.includes("onclone"), "Page texture capture should clean up only the cloned DOM");
assert(!component.includes('scope.setAttribute("data-black-hole-capturing"'), "Capture must not mutate the live page and cause visible flicker");
assert(!component.includes('scope.removeAttribute("data-black-hole-capturing"'), "Capture must not mutate the live page and cause visible flicker");
assert(component.includes("scheduleTextureCapture"), "Page texture capture should be scheduled outside the animation hot path");
assert(component.includes("requestIdleCallback"), "Page texture capture should prefer browser idle time to reduce stutter");
assert(/textureRefreshMs:\s*(1[5-9]\d{2}|[2-9]\d{3,})/.test(component), "Page texture capture should be low frequency enough to avoid stutter");
assert(!component.includes("scheduleTextureCapture(state);"), "Animation loop must not schedule html2canvas captures every frame");
assert(component.includes("targetEntries"), "Warp targets should cache layout reads outside the animation hot path");
assert(component.includes("textEntries"), "Text warp targets should cache layout reads outside the animation hot path");
assert(component.includes("distortPageTexture"), "HomepageBlackHole shader should distort sampled page content around the ring");
assert(!component.includes("lensingField"), "Black hole should not paint a separate gray lensing field");
assert(!component.includes("swallowField"), "Black hole should not render the old vortex swallowing field");
assert(component.includes("gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)"), "WebGL should use standard alpha blending to avoid gray halos");
assert(/const\s+float\s+STAR_GAIN\s*=\s*0\.0/.test(component), "Black hole starfield should be disabled to avoid speckling");
assert(/minRadius:\s*(2[0-9]|3[0-4])\b/.test(component), "Black hole minimum radius should be smaller than the previous 60px");
assert(!component.includes("viewportTop + viewportHeight"), "Black hole should not be anchored to the current scroll viewport");
assert(/followEase:\s*0\.0(5|6)/.test(component), "Black hole movement follow easing should be faster than the previous 0.025");
assert(/rangeXMin:\s*0\.(4[6-9]|[5-9][0-9])/.test(component), "Black hole horizontal range should cover nearly the whole page");
assert(/rangeYMin:\s*0\.(4[2-9]|[5-9][0-9])/.test(component), "Black hole vertical range should cover nearly the whole page");
assert(/const speed = mixNumber\(0\.1[0-9], 0\.[4-6][0-9], growth\)/.test(component), "Black hole movement speed should be slower than the previous fast roam");

const index = read("src/pages/index.astro");
assert(index.includes("HomepageBlackHole"), "Home page does not import/render HomepageBlackHole");

const appearance = read("src/components/AppearanceSettings.astro");
assert(appearance.includes('data-appearance-switch="homeBlackHole"'), "Appearance settings are missing the black hole switch");

const baseLayout = read("src/layouts/BaseLayout.astro");
assert(baseLayout.includes("homeBlackHole: true"), "Appearance defaults are missing homeBlackHole");
assert(baseLayout.includes("dataset.homeBlackHole"), "BaseLayout does not write the home black hole dataset");

console.log("home black hole checks passed");
