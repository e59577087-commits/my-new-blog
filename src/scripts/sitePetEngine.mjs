import { DEFAULT_SITE_PET_ID, SITE_PETS } from "../data/sitePets.mjs";

const animation = (row, durations, loop = true) => Object.freeze({ row, durations: Object.freeze(durations), loop });

export const PET_ANIMATIONS = Object.freeze({
  idle: animation(0, [280, 110, 110, 140, 140, 320]),
  runningRight: animation(1, [120, 120, 120, 120, 120, 120, 120, 220]),
  runningLeft: animation(2, [120, 120, 120, 120, 120, 120, 120, 220]),
  waving: animation(3, [140, 140, 140, 280], false),
  jumping: animation(4, [140, 140, 140, 140, 280], false),
  failed: animation(5, [140, 140, 140, 140, 140, 140, 140, 240], false),
  waiting: animation(6, [150, 150, 150, 150, 150, 260]),
  running: animation(7, [120, 120, 120, 120, 120, 220]),
  review: animation(8, [150, 150, 150, 150, 150, 280]),
});

export const idleBlinkHoldMs = (randomValue = Math.random()) => {
  const normalized = Number.isFinite(randomValue) ? Math.min(1, Math.max(0, randomValue)) : 0;
  return Math.round(2500 + normalized * 3500);
};

export const frameRect = (row, column, cellWidth = 192, cellHeight = 208) => ({
  sx: column * cellWidth,
  sy: row * cellHeight,
  sw: cellWidth,
  sh: cellHeight,
});

export const lookFrameFromVector = (dx, dy, deadzone = 24) => {
  if (Math.hypot(dx, dy) <= deadzone) return null;

  const clockwiseFromTop = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  const index = Math.round(clockwiseFromTop / 22.5) % 16;
  return {
    row: index < 8 ? 9 : 10,
    column: index % 8,
    direction: index * 22.5,
  };
};

export const getPetById = (petId) => (
  SITE_PETS.find((pet) => pet.id === petId)
  ?? SITE_PETS.find((pet) => pet.id === DEFAULT_SITE_PET_ID)
  ?? SITE_PETS[0]
);

export const loadPetSpritesheet = (pet, {
  ImageCtor = globalThis.Image,
  timeoutMs = 12_000,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  signal,
} = {}) => new Promise((resolve, reject) => {
  if (typeof ImageCtor !== "function") {
    reject(new TypeError("Image constructor is unavailable"));
    return;
  }

  const nextImage = new ImageCtor();
  let settled = false;
  let timeoutId;

  const cleanup = () => {
    nextImage.onload = null;
    nextImage.onerror = null;
    if (timeoutId !== undefined) clearTimeoutFn(timeoutId);
    signal?.removeEventListener("abort", handleAbort);
  };

  const settle = (callback, value, { stopRequest = false } = {}) => {
    if (settled) return;
    settled = true;
    if (stopRequest) {
      try {
        nextImage.src = "";
      } catch {
        // The request has already ended; cleanup below is still required.
      }
    }
    cleanup();
    callback(value);
  };

  const handleAbort = () => {
    const error = new Error(`Spritesheet request aborted: ${pet.spritesheetPath}`);
    error.name = "AbortError";
    settle(reject, error, { stopRequest: true });
  };

  nextImage.decoding = "async";
  nextImage.onload = async () => {
    try {
      if (typeof nextImage.decode === "function") {
        try {
          await nextImage.decode();
        } catch (error) {
          if (!(nextImage.complete && nextImage.naturalWidth > 0)) throw error;
        }
      }
      settle(resolve, nextImage);
    } catch (error) {
      settle(reject, error);
    }
  };
  nextImage.onerror = () => {
    settle(reject, new Error(`Failed to load ${pet.spritesheetPath}`));
  };

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timeoutId = setTimeoutFn(() => {
      settle(
        reject,
        new Error(`Spritesheet request timed out: ${pet.spritesheetPath}`),
        { stopRequest: true },
      );
    }, timeoutMs);
  }

  signal?.addEventListener("abort", handleAbort, { once: true });
  if (signal?.aborted) {
    handleAbort();
    return;
  }
  try {
    nextImage.src = pet.spritesheetPath;
  } catch (error) {
    settle(reject, error, { stopRequest: true });
  }
});

export const createPetImageCoordinator = ({
  loadImage,
  wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  maxAttempts = 2,
  retryDelayMs = 200,
  onReady = () => {},
  onError = () => {},
} = {}) => {
  if (typeof loadImage !== "function") {
    throw new TypeError("loadImage must be a function");
  }

  let requestToken = 0;
  let disposed = false;
  let activeController = null;

  const abortActiveRequest = () => {
    activeController?.abort();
    activeController = null;
  };

  const reportError = (payload) => {
    try {
      onError(payload);
      return payload;
    } catch (callbackError) {
      return { ...payload, callbackError };
    }
  };

  const select = async (pet, context = {}) => {
    abortActiveRequest();
    const token = ++requestToken;
    if (disposed) return { status: "stale", pet, token, context };

    const normalizedAttempts = Math.floor(Number(maxAttempts));
    const attemptsLimit = Number.isFinite(normalizedAttempts) && normalizedAttempts > 0
      ? normalizedAttempts
      : 1;
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    activeController = controller;
    const releaseController = () => {
      if (activeController === controller) activeController = null;
    };

    for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
      let image;
      try {
        image = await loadImage(pet, {
          attempt,
          token,
          context,
          signal: controller?.signal,
        });
      } catch (error) {
        if (disposed || token !== requestToken) {
          releaseController();
          return { status: "stale", pet, token, context };
        }
        if (attempt < attemptsLimit) {
          try {
            await wait(retryDelayMs * attempt);
          } catch (waitError) {
            if (disposed || token !== requestToken) {
              releaseController();
              return { status: "stale", pet, token, context };
            }
            const payload = reportError({
              pet,
              error: waitError,
              token,
              attempts: attempt,
              context,
              phase: "retry-delay",
            });
            releaseController();
            return { status: "error", ...payload };
          }
          if (disposed || token !== requestToken) {
            releaseController();
            return { status: "stale", pet, token, context };
          }
          continue;
        }

        const payload = reportError({
          pet,
          error,
          token,
          attempts: attempt,
          context,
          phase: "load",
        });
        releaseController();
        return { status: "error", ...payload };
      }

      if (disposed || token !== requestToken) {
        releaseController();
        return { status: "stale", pet, token, context };
      }

      const payload = { pet, image, token, attempts: attempt, context };
      try {
        onReady(payload);
      } catch (error) {
        const errorPayload = reportError({ ...payload, error, phase: "commit" });
        releaseController();
        return { status: "error", ...errorPayload };
      }
      releaseController();
      return { status: "ready", ...payload };
    }

    releaseController();
    return { status: "stale", pet, token, context };
  };

  const dispose = () => {
    disposed = true;
    requestToken += 1;
    abortActiveRequest();
  };

  const cancel = () => {
    requestToken += 1;
    abortActiveRequest();
  };

  return { select, cancel, dispose };
};
