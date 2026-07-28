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

const deferred = () => {
  let resolvePromise;
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
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

test("does not commit a delayed spritesheet before it is ready", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const pendingImage = deferred();
  const commits = [];
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    loadImage: () => pendingImage.promise,
    maxAttempts: 1,
    onReady: (payload) => commits.push(payload),
  });

  const selection = coordinator.select(pet);
  await Promise.resolve();
  assert.equal(commits.length, 0);

  const image = { src: pet.spritesheetPath };
  pendingImage.resolve(image);
  const result = await selection;

  assert.equal(result.status, "ready");
  assert.equal(commits.length, 1);
  assert.equal(commits[0].pet, pet);
  assert.equal(commits[0].image, image);
});

test("retries one failed spritesheet request before reporting an error", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const attempts = [];
  const delays = [];
  const commits = [];
  const errors = [];
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const image = { src: pet.spritesheetPath };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 2,
    retryDelayMs: 180,
    wait: async (delay) => delays.push(delay),
    loadImage: async (_pet, { attempt }) => {
      attempts.push(attempt);
      if (attempt === 1) throw new Error("temporary failure");
      return image;
    },
    onReady: (payload) => commits.push(payload),
    onError: (payload) => errors.push(payload),
  });

  const result = await coordinator.select(pet);

  assert.equal(result.status, "ready");
  assert.deepEqual(attempts, [1, 2]);
  assert.deepEqual(delays, [180]);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].attempts, 2);
  assert.equal(errors.length, 0);
});

test("does not report an obsolete retry-delay failure after cancellation", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const retryDelay = deferred();
  const errors = [];
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 2,
    loadImage: async () => {
      throw new Error("offline");
    },
    wait: () => retryDelay.promise,
    onError: (payload) => errors.push(payload),
  });

  const selection = coordinator.select(pet);
  await Promise.resolve();
  await Promise.resolve();
  coordinator.cancel();
  retryDelay.reject(new Error("cancelled delay"));
  const result = await selection;

  assert.equal(result.status, "stale");
  assert.equal(errors.length, 0);
});

test("does not reload a spritesheet when the ready callback fails", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const errors = [];
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  let loadCount = 0;
  const coordinator = createPetImageCoordinator({
    maxAttempts: 2,
    loadImage: async () => {
      loadCount += 1;
      return { src: pet.spritesheetPath };
    },
    onReady: () => {
      throw new Error("commit failed");
    },
    onError: (payload) => errors.push(payload),
  });

  const result = await coordinator.select(pet);

  assert.equal(result.status, "error");
  assert.equal(result.phase, "commit");
  assert.equal(loadCount, 1);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].phase, "commit");
});

test("contains an error callback failure instead of leaving an unhandled rejection", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 1,
    loadImage: async () => {
      throw new Error("offline");
    },
    onError: () => {
      throw new Error("status callback failed");
    },
  });

  const result = await coordinator.select(pet);

  assert.equal(result.status, "error");
  assert.equal(result.error.message, "offline");
  assert.equal(result.callbackError.message, "status callback failed");
});

test("loads, decodes, and cleans up a browser spritesheet request", async () => {
  const { loadPetSpritesheet } = await loadModule("src/scripts/sitePetEngine.mjs");
  const clearedTimers = [];
  let decodeCount = 0;

  class FakeImage {
    static instance;

    constructor() {
      FakeImage.instance = this;
      this.complete = false;
      this.naturalWidth = 0;
    }

    async decode() {
      decodeCount += 1;
    }
  }

  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const loading = loadPetSpritesheet(pet, {
    ImageCtor: FakeImage,
    timeoutMs: 12_000,
    setTimeoutFn: () => 42,
    clearTimeoutFn: (timerId) => clearedTimers.push(timerId),
  });
  FakeImage.instance.complete = true;
  FakeImage.instance.naturalWidth = 192;
  await FakeImage.instance.onload();

  assert.equal(await loading, FakeImage.instance);
  assert.equal(decodeCount, 1);
  assert.equal(FakeImage.instance.onload, null);
  assert.equal(FakeImage.instance.onerror, null);
  assert.deepEqual(clearedTimers, [42]);
});

test("uses an already drawable image when decode rejects", async () => {
  const { loadPetSpritesheet } = await loadModule("src/scripts/sitePetEngine.mjs");

  class FakeImage {
    static instance;

    constructor() {
      FakeImage.instance = this;
      this.complete = true;
      this.naturalWidth = 192;
    }

    async decode() {
      throw new Error("decode pressure");
    }
  }

  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const loading = loadPetSpritesheet(pet, {
    ImageCtor: FakeImage,
    setTimeoutFn: () => 7,
    clearTimeoutFn: () => {},
  });
  await FakeImage.instance.onload();

  assert.equal(await loading, FakeImage.instance);
});

test("rejects and cleans up a spritesheet request after its timeout", async () => {
  const { loadPetSpritesheet } = await loadModule("src/scripts/sitePetEngine.mjs");
  let triggerTimeout;

  class FakeImage {
    static instance;

    constructor() {
      FakeImage.instance = this;
    }
  }

  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const loading = loadPetSpritesheet(pet, {
    ImageCtor: FakeImage,
    timeoutMs: 12_000,
    setTimeoutFn: (callback) => {
      triggerTimeout = callback;
      return 9;
    },
    clearTimeoutFn: () => {},
  });
  triggerTimeout();

  await assert.rejects(loading, /timed out/i);
  assert.equal(FakeImage.instance.src, "");
  assert.equal(FakeImage.instance.onload, null);
  assert.equal(FakeImage.instance.onerror, null);
});

test("rejects and cleans up a spritesheet request after an image error", async () => {
  const { loadPetSpritesheet } = await loadModule("src/scripts/sitePetEngine.mjs");

  class FakeImage {
    static instance;

    constructor() {
      FakeImage.instance = this;
    }
  }

  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const loading = loadPetSpritesheet(pet, {
    ImageCtor: FakeImage,
    setTimeoutFn: () => 11,
    clearTimeoutFn: () => {},
  });
  FakeImage.instance.onerror();

  await assert.rejects(loading, /Failed to load/);
  assert.equal(FakeImage.instance.onload, null);
  assert.equal(FakeImage.instance.onerror, null);
});

test("cleans up when assigning the spritesheet URL throws", async () => {
  const { loadPetSpritesheet } = await loadModule("src/scripts/sitePetEngine.mjs");

  class FakeImage {
    static instance;

    constructor() {
      FakeImage.instance = this;
    }

    set src(_value) {
      throw new Error("invalid source");
    }
  }

  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const loading = loadPetSpritesheet(pet, {
    ImageCtor: FakeImage,
    setTimeoutFn: () => 17,
    clearTimeoutFn: () => {},
  });

  await assert.rejects(loading, /invalid source/);
  assert.equal(FakeImage.instance.onload, null);
  assert.equal(FakeImage.instance.onerror, null);
});

test("aborts the active browser request when a selection is cancelled", async () => {
  const { createPetImageCoordinator, loadPetSpritesheet } = await loadModule("src/scripts/sitePetEngine.mjs");

  class FakeImage {
    static instance;

    constructor() {
      FakeImage.instance = this;
    }
  }

  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 1,
    loadImage: (nextPet, { signal }) => loadPetSpritesheet(nextPet, {
      ImageCtor: FakeImage,
      signal,
      setTimeoutFn: () => 13,
      clearTimeoutFn: () => {},
    }),
  });
  const selection = coordinator.select(pet);
  coordinator.cancel();

  const result = await selection;
  assert.equal(result.status, "stale");
  assert.equal(FakeImage.instance.src, "");
  assert.equal(FakeImage.instance.onload, null);
  assert.equal(FakeImage.instance.onerror, null);
});

test("keeps request context with the spritesheet that eventually commits", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const commits = [];
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const context = { persistSelection: true };
  const coordinator = createPetImageCoordinator({
    loadImage: async () => ({ src: pet.spritesheetPath }),
    onReady: (payload) => commits.push(payload),
  });

  const result = await coordinator.select(pet, context);

  assert.equal(result.status, "ready");
  assert.equal(result.context, context);
  assert.equal(commits[0].context, context);
});

test("only commits the latest spritesheet when requests finish out of order", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const pending = new Map([
    ["pet-a", deferred()],
    ["pet-b", deferred()],
  ]);
  const commits = [];
  const coordinator = createPetImageCoordinator({
    maxAttempts: 1,
    loadImage: (pet) => pending.get(pet.id).promise,
    onReady: (payload) => commits.push(payload),
  });
  const petA = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const petB = { id: "pet-b", spritesheetPath: "/pets/pet-b/spritesheet.webp" };

  const selectionA = coordinator.select(petA);
  const selectionB = coordinator.select(petB);
  pending.get("pet-b").resolve({ src: petB.spritesheetPath });
  const resultB = await selectionB;
  pending.get("pet-a").resolve({ src: petA.spritesheetPath });
  const resultA = await selectionA;

  assert.equal(resultB.status, "ready");
  assert.equal(resultA.status, "stale");
  assert.deepEqual(commits.map(({ pet }) => pet.id), ["pet-b"]);
});

test("allows the same pet to recover after an exhausted request", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const commits = [];
  const errors = [];
  let shouldFail = true;
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 1,
    loadImage: async () => {
      if (shouldFail) throw new Error("offline");
      return { src: pet.spritesheetPath };
    },
    onReady: (payload) => commits.push(payload),
    onError: (payload) => errors.push(payload),
  });

  const failed = await coordinator.select(pet);
  shouldFail = false;
  const recovered = await coordinator.select(pet);

  assert.equal(failed.status, "error");
  assert.equal(recovered.status, "ready");
  assert.equal(errors.length, 1);
  assert.equal(commits.length, 1);
});

test("invalidates an unfinished spritesheet request when disposed", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const pendingImage = deferred();
  const commits = [];
  const errors = [];
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 1,
    loadImage: () => pendingImage.promise,
    onReady: (payload) => commits.push(payload),
    onError: (payload) => errors.push(payload),
  });

  const selection = coordinator.select(pet);
  coordinator.dispose();
  pendingImage.resolve({ src: pet.spritesheetPath });
  const result = await selection;

  assert.equal(result.status, "stale");
  assert.equal(commits.length, 0);
  assert.equal(errors.length, 0);
});

test("cancels an unfinished request without disposing future selections", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  const pendingImage = deferred();
  const commits = [];
  const petA = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const petB = { id: "pet-b", spritesheetPath: "/pets/pet-b/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    maxAttempts: 1,
    loadImage: (pet) => pet.id === petA.id
      ? pendingImage.promise
      : Promise.resolve({ src: pet.spritesheetPath }),
    onReady: (payload) => commits.push(payload),
  });

  const selectionA = coordinator.select(petA);
  coordinator.cancel();
  pendingImage.resolve({ src: petA.spritesheetPath });
  const resultA = await selectionA;
  const resultB = await coordinator.select(petB);

  assert.equal(resultA.status, "stale");
  assert.equal(resultB.status, "ready");
  assert.deepEqual(commits.map(({ pet }) => pet.id), ["pet-b"]);
});

test("does not start another spritesheet request after disposal", async () => {
  const { createPetImageCoordinator } = await loadModule("src/scripts/sitePetEngine.mjs");
  let loadCount = 0;
  const pet = { id: "pet-a", spritesheetPath: "/pets/pet-a/spritesheet.webp" };
  const coordinator = createPetImageCoordinator({
    loadImage: async () => {
      loadCount += 1;
      return { src: pet.spritesheetPath };
    },
  });

  coordinator.dispose();
  const result = await coordinator.select(pet);

  assert.equal(result.status, "stale");
  assert.equal(loadCount, 0);
});

test("requests a pet first and persists it only after the renderer reports success", () => {
  const component = readSource("src/components/SitePet.astro");
  const settings = readSource("src/components/AppearanceSettings.astro");

  assert.match(component, /createPetImageCoordinator/);
  assert.match(component, /loadPetSpritesheet/);
  assert.match(component, /blog:site-pet-request/);
  assert.match(component, /imageCoordinator\.cancel\(\)/);
  assert.match(component, /if \(persistSelection\) \{\s*delete root\.dataset\.loadError/);
  assert.match(
    component,
    /if \(pendingPetId === nextPet\.id\) \{\s*if \(!persistSelection\) return;\s*imageCoordinator\.cancel\(\)/,
  );
  assert.doesNotMatch(component, /persistSitePetSelection/);
  assert.match(settings, /data-appearance-pet-status/);
  assert.match(settings, /blog:site-pet-request/);
  assert.match(settings, /blog:site-pet-status/);
  assert.match(settings, /const commitPetSelection = \(sitePetId\)/);
  assert.match(settings, /status === "ready" && persistSelection/);
  assert.match(
    settings,
    /document\.documentElement\.dataset\.pendingSitePetId = button\.dataset\.value/,
  );
  assert.match(
    component,
    /const queuedPetId = document\.documentElement\.dataset\.pendingSitePetId/,
  );
  assert.doesNotMatch(
    settings,
    /petGroup\?\.addEventListener\("click"[\s\S]*?update\(\{\s*sitePetId:/,
  );
});

test("preserves a later visibility change while a pet request is loading", () => {
  const settings = readSource("src/components/AppearanceSettings.astro");
  const commitBlock = settings.match(
    /const commitPetSelection = \(sitePetId\) => \{[\s\S]*?\n    \};/,
  )?.[0] ?? "";

  assert.match(commitBlock, /\.\.\.settings/);
  assert.doesNotMatch(commitBlock, /appearance\.read/);
  assert.doesNotMatch(commitBlock, /sitePetEnabled:\s*true/);
  assert.match(
    settings,
    /if \(!settings\.sitePetEnabled\) update\(\{\s*sitePetEnabled:\s*true\s*\}\)/,
  );
});

test("announces only requested pet switches and keeps the live region mounted", () => {
  const component = readSource("src/components/SitePet.astro");
  const settings = readSource("src/components/AppearanceSettings.astro");
  const globalStyles = readSource("src/styles/global.css");

  assert.match(component, /const reportStatus = persistSelection/);
  assert.match(component, /if \(requestContext\.reportStatus\) announcePetStatus\("ready"/);
  assert.match(component, /if \(reportStatus\) announcePetStatus\("loading"/);
  assert.doesNotMatch(settings, /\.appearance-pet-status:empty\s*\{[\s\S]*?display:\s*none/);
  assert.match(settings, /\.appearance-pet-status\s*\{[\s\S]*?min-height:/);
  assert.match(settings, /\.appearance-pet-status\s*\{[\s\S]*?color:\s*var\(--color-text\)/);
  assert.match(globalStyles, /--color-text:\s*#[0-9a-f]{6}/i);
});

test("validates the next frame before replacing the active pet state", () => {
  const component = readSource("src/components/SitePet.astro");
  const readyBlock = component.match(
    /onReady: \(\{ pet: nextPet[\s\S]*?\n      \},\n      onError:/,
  )?.[0] ?? "";

  assert.match(component, /const stagePetFrame = \(nextPet, nextImage\) =>/);
  assert.match(readyBlock, /const stagedFrame = stagePetFrame\(nextPet, nextImage\)/);
  assert.ok(
    readyBlock.indexOf("stagePetFrame(nextPet, nextImage)")
      < readyBlock.indexOf("pet = nextPet"),
    "the candidate frame must be validated before active state changes",
  );
});

test("keeps the latest applied appearance in memory when storage is unavailable", () => {
  const baseLayout = readSource("src/layouts/BaseLayout.astro");

  assert.match(baseLayout, /let currentSettings;/);
  assert.match(baseLayout, /if \(currentSettings\) return \{ \.\.\.currentSettings \};/);
  assert.match(baseLayout, /currentSettings = \{ \.\.\.next \};/);
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
