# Warm Paper Background Design

Date: 2026-07-26

Status: Approved design

## Context

The existing `paper` appearance uses `#fefefb` for the page while the `white`
appearance uses `#ffffff`. The difference is too small to perceive reliably.
Both appearances also share the same global grain treatment, so the paper
preset does not feel more tactile than pure white.

## Goal

Make the light `paper` preset visibly warmer and gently tactile while keeping
long-form reading comfortable. The result should resemble a clean book page,
not a yellow eye-comfort filter or aged parchment.

## Scope

- Strengthen only the light `paper` appearance and its settings swatch.
- Keep the `white`, colored, dark, and wallpaper appearances visually
  unchanged.
- Reuse the existing CSS grain overlay; do not add an image asset or network
  request.
- Do not change page structure, spacing, typography, or interactions.

## Visual Design

The light paper palette will use:

- Page base: `#f4eddd`
- Page highlight: `#faf5e9`
- Opaque surface fallback: `#fbf6e9`
- Translucent header reference: `rgb(248 241 226 / 0.78)`
- Muted text: `#6f6b62`
- Faint text: `#817b70`

The page background will combine two very low-contrast radial highlights with
a vertical gradient from the pale highlight into the warmer base. This creates
slight tonal variation across a large page without producing visible bands or
decorative blobs.

The paper-specific muted and faint text values are slightly darker, warm grays.
This prevents the warmer background from reducing secondary-text contrast. Main
body and heading colors remain unchanged.

The existing fixed SVG grain will remain the single texture layer. Its opacity
will become a semantic token:

- Existing default and white appearances retain their current effective grain.
- Light paper uses `0.035` with a restrained sepia/contrast filter.
- Dark paper explicitly keeps the current dark grain treatment, so light-paper
  settings cannot leak into dark mode.

The paper swatch in the appearance panel will use the same base/highlight pair,
making it immediately distinguishable from the pure-white swatch.

## Implementation Boundaries

The change is limited to:

- `src/styles/global.css`
- `src/components/AppearanceSettings.astro`
- `scripts/appearance-wallpaper-mode.test.mjs`

Theme persistence and the default new-visitor selection remain unchanged.
Pages already consume the shared appearance tokens, so no page-specific styles
are needed.

## Test Strategy

Follow test-driven development:

1. Update the appearance test to require the new paper palette, layered
   background, legible warm-gray text tokens, scoped grain token/filter, and
   matching settings swatch.
2. Run `npm run test:appearance` and confirm it fails for the old near-white
   values.
3. Implement the minimum token and swatch changes.
4. Re-run `npm run test:appearance`, `npm run test:article-layout`, and
   `npm run build`.
5. Visually compare paper and white on the homepage and an article page at
   desktop and mobile widths. Confirm dark mode and wallpaper mode are not
   visually changed.

## Success Criteria

- Paper and white are immediately distinguishable when switched in place.
- The paper preset feels warm and tactile without reading as yellow or dirty.
- Main and secondary text remain comfortably legible.
- Cards, borders, photographs, and the banner wallpaper are not muddied by the
  texture.
- No new asset, request, layout shift, or theme-persistence change is
  introduced.
