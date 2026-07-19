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
