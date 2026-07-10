# Article Table of Contents Design

## Goal

Add an automatically generated table of contents to article pages so readers can quickly navigate long posts written in Obsidian.

## Source Data

Use the heading metadata returned by Astro's `render(article)` function. Do not parse the rendered DOM or introduce a separate Markdown parser.

Only include Markdown level-two and level-three headings:

- `##` headings are top-level table-of-contents entries.
- `###` headings are indented child entries.
- `#` remains reserved for the page's article title and is excluded.

Hide the table of contents when fewer than two eligible headings exist.

## Layout

### Desktop

Keep the article body at its current readable width and add a right-hand table-of-contents rail on large screens. The rail remains sticky below the fixed site header while the reader scrolls.

### Mobile and Narrow Screens

Render the same entries near the beginning of the article inside a native collapsible disclosure labelled `本文目录`. The disclosure is keyboard accessible and does not occupy reading space while collapsed.

## Interaction

- Each entry links to the heading's Astro-generated fragment identifier.
- Heading targets receive enough scroll margin to remain visible below the sticky header.
- On desktop, the entry matching the current reading section is highlighted progressively with `aria-current="location"`.
- Active-section highlighting is a progressive enhancement. Navigation links continue to work if JavaScript is unavailable.
- Existing reduced-motion preferences remain respected; navigation must not introduce mandatory animation.

## Component Boundary

Create a focused table-of-contents component that receives filtered Astro heading objects and owns only table-of-contents markup and active-section behavior. `ArticleLayout.astro` remains responsible for obtaining headings, filtering by depth, deciding whether the component should render, and arranging the article-plus-sidebar layout.

## Edge Cases

- Zero or one eligible heading: render no table of contents.
- Long heading text: wrap without widening the sidebar.
- Duplicate heading text: rely on Astro's generated unique slugs.
- A level-three heading without a preceding level-two heading: render it as an indented entry without inventing a parent.

## Verification

1. Build an article with no eligible headings and confirm no table of contents is rendered.
2. Build an article with one eligible heading and confirm no table of contents is rendered.
3. Build an article with multiple level-two and level-three headings and confirm hierarchy and fragment links.
4. Verify the sticky desktop rail, current-section highlighting, and header offset.
5. Verify the mobile disclosure with touch and keyboard input.
6. Disable JavaScript and confirm all table-of-contents links still navigate correctly.
7. Run the production build and existing regression checks.
