import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { test } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const readSource = (relativePath) => {
  const absolutePath = resolve(root, ...relativePath.split("/"));
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
};

const loadModule = async (relativePath) => {
  const absolutePath = resolve(root, ...relativePath.split("/"));
  try {
    return await import(`${pathToFileURL(absolutePath).href}?test=${Date.now()}`);
  } catch (error) {
    assert.fail(`unable to load ${relativePath}: ${error.message}`);
  }
};

test("registers the three selected Codex Pets with their verified atlas versions", async () => {
  const { SITE_PETS, DEFAULT_SITE_PET_ID } = await loadModule("src/data/sitePets.mjs");

  assert.equal(DEFAULT_SITE_PET_ID, "ikun");
  assert.deepEqual(
    SITE_PETS.map(({ id, displayName, author, version, atlasHeight }) => ({ id, displayName, author, version, atlasHeight })),
    [
      { id: "ikun", displayName: "鸡哥 ikun", author: "ikun", version: 1, atlasHeight: 1872 },
      { id: "yukino-swimsuit", displayName: "雪之下雪乃", author: "Joexxl", version: 2, atlasHeight: 2288 },
      { id: "xilian", displayName: "昔涟", author: "lincat", version: 1, atlasHeight: 1872 },
    ],
  );
});

test("stores each selected spritesheet locally instead of hotlinking the gallery", async () => {
  const { SITE_PETS } = await loadModule("src/data/sitePets.mjs");

  for (const pet of SITE_PETS) {
    assert.match(pet.spritesheetPath, new RegExp(`^/pets/${pet.id}/spritesheet\\.webp$`));
    const spritesheet = resolve(root, "public", pet.spritesheetPath.slice(1).replaceAll("/", "\\"));
    assert.ok(existsSync(spritesheet), `${pet.id} spritesheet is missing`);
    assert.ok(statSync(spritesheet).size > 100_000, `${pet.id} spritesheet is unexpectedly small`);
  }
});

test("maps the standard animation rows without stepping into transparent cells", async () => {
  const { PET_ANIMATIONS, frameRect } = await loadModule("src/scripts/sitePetEngine.mjs");

  assert.deepEqual(PET_ANIMATIONS.idle.durations, [280, 110, 110, 140, 140, 320]);
  assert.deepEqual(PET_ANIMATIONS.waving.durations, [140, 140, 140, 280]);
  assert.deepEqual(PET_ANIMATIONS.jumping.durations, [140, 140, 140, 140, 280]);
  assert.equal(PET_ANIMATIONS.runningRight.row, 1);
  assert.equal(PET_ANIMATIONS.runningLeft.row, 2);
  assert.deepEqual(frameRect(1, 3), { sx: 576, sy: 208, sw: 192, sh: 208 });
});

test("paces idle blinking with a random 2.5 to 6 second neutral hold", async () => {
  const { idleBlinkHoldMs, PET_ANIMATIONS } = await loadModule("src/scripts/sitePetEngine.mjs");
  const component = readSource("src/components/SitePet.astro");

  assert.equal(idleBlinkHoldMs(0), 2500);
  assert.equal(idleBlinkHoldMs(0.5), 4250);
  assert.equal(idleBlinkHoldMs(1), 6000);
  assert.deepEqual(
    PET_ANIMATIONS.idle.durations.slice(1),
    [110, 110, 140, 140, 320],
    "the actual blink frames should keep their original speed",
  );
  assert.match(component, /idleBlinkHoldMs/);
  assert.match(component, /stateName\s*===\s*"idle"\s*&&\s*frameIndex\s*===\s*0/);
});

test("maps pointer vectors clockwise into the V2 look rows", async () => {
  const { lookFrameFromVector } = await loadModule("src/scripts/sitePetEngine.mjs");

  assert.deepEqual(lookFrameFromVector(0, -100), { row: 9, column: 0, direction: 0 });
  assert.deepEqual(lookFrameFromVector(100, 0), { row: 9, column: 4, direction: 90 });
  assert.deepEqual(lookFrameFromVector(0, 100), { row: 10, column: 0, direction: 180 });
  assert.deepEqual(lookFrameFromVector(-100, 0), { row: 10, column: 4, direction: 270 });
  assert.deepEqual(lookFrameFromVector(-100, -100), { row: 10, column: 6, direction: 315 });
  assert.equal(lookFrameFromVector(10, 10, 24), null, "the pointer deadzone should preserve idle animation");
});

test("falls back to ikun when a saved pet id is unavailable", async () => {
  const { getPetById } = await loadModule("src/scripts/sitePetEngine.mjs");

  assert.equal(getPetById("yukino-swimsuit").id, "yukino-swimsuit");
  assert.equal(getPetById("missing-pet").id, "ikun");
});

test("mounts one shared pet renderer and persists the selected pet in appearance settings", () => {
  const baseLayout = readSource("src/layouts/BaseLayout.astro");
  const settings = readSource("src/components/AppearanceSettings.astro");

  assert.match(baseLayout, /import SitePet from "\.\.\/components\/SitePet\.astro"/);
  assert.match(baseLayout, /<SitePet\s+reducedActivity=\{type === "article"\}\s*\/>/);
  assert.match(baseLayout, /sitePetEnabled:\s*true/);
  assert.match(baseLayout, /sitePetId:\s*"ikun"/);
  assert.match(baseLayout, /next\.sitePetId\s*=\s*sitePetIds\.includes\(next\.sitePetId\)/);
  assert.match(baseLayout, /root\.dataset\.sitePet\s*=\s*next\.sitePetEnabled\s*\?\s*"on"\s*:\s*"off"/);
  assert.match(baseLayout, /root\.dataset\.sitePetId\s*=\s*next\.sitePetId/);

  assert.match(settings, /data-appearance-switch="sitePetEnabled"/);
  assert.match(settings, /data-appearance-pet/);
  assert.match(settings, /SITE_PETS\.map/);
  assert.match(settings, /data-value=\{pet\.id\}/);
  assert.match(settings, /blog:appearance-change/);
});

test("renders an accessible, low-overhead pet interaction surface", () => {
  const component = readSource("src/components/SitePet.astro");

  assert.match(component, /data-site-pet-root/);
  assert.match(component, /<button[^>]*data-site-pet-action[^>]*aria-label=/);
  assert.match(component, /<canvas[^>]*width="192"[^>]*height="208"/);
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /prefers-reduced-motion:\s*reduce/);
  assert.match(component, /pointermove/);
  assert.match(component, /pet\.version\s*===\s*2/);
  assert.match(component, /blog:appearance-change/);
  assert.match(component, /@media\s*\(max-width:\s*48rem\)/);
});

test("keeps lightweight local poster images for the appearance picker", async () => {
  const { SITE_PETS } = await loadModule("src/data/sitePets.mjs");

  for (const pet of SITE_PETS) {
    assert.match(pet.posterPath, new RegExp(`^/pets/${pet.id}/poster\\.webp$`));
    const poster = resolve(root, "public", pet.posterPath.slice(1).replaceAll("/", "\\"));
    assert.ok(existsSync(poster), `${pet.id} poster is missing`);
    assert.ok(statSync(poster).size > 1_000, `${pet.id} poster is unexpectedly small`);
  }
});
