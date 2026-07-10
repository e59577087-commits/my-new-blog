# `haven,for you` Brand Copy Replacement

## Goal

Replace every exact occurrence of `happy,for you` in the website source with `haven,for you` so that the visible brand, metadata, author name, and social sharing image remain consistent.

## Scope

- Update the shared site metadata in `src/data/site.ts`.
- Update the page descriptions in `src/pages/about.astro` and `src/pages/login.astro`.
- Update the accessible title and rendered text in `public/og.svg`.
- Preserve all unrelated content and existing uncommitted changes.

## Implementation

Perform a minimal, case-sensitive replacement of the seven known exact matches. Do not refactor the site configuration or alter layout, styling, or behavior.

## Verification

1. Search the workspace and confirm that no exact occurrence of `happy,for you` remains.
2. Confirm that all seven expected occurrences now read `haven,for you`.
3. Run the production build and confirm that it succeeds.
