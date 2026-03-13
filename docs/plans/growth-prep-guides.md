# Growth Prep Guides Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Publish 5-10 high-intent prep guides for the next Marvel release cycle.

## Goal

Create a repeatable, search-friendly guide system and publish the first 5-10 high-intent Marvel prep guides around the next release cycle.

## Non-Goals

- Rewriting every existing AMP story as a long-form guide immediately.
- Auto-generating guide prose from TMDB or timeline data.
- Redesigning the entire site navigation before the first guides ship.

## Repo Findings

- Existing watch-list content lives under `src/pages/stories/*.md`, but those files render through `src/layouts/list-story.astro`, which produces AMP Web Stories rather than standard HTML guide pages.
- `src/helpers/node/listing-files.ts#mapStoryContentToListings()` already knows how to map markdown sections written as `## [Title](URL)` into listing data, which is useful for guide authoring.
- The site already has examples of prep-guide style content such as `src/pages/stories/no-way-home-watch-list.md` and `src/pages/stories/she-hulk-watch-list.md`.
- Title detail pages already have strong listing UI, so a new guide format can reuse existing listing cards or timeline modules rather than inventing a second title rendering system.

## External Research

The shared research points to release-window landing pages as the highest-leverage search asset for this product, especially queries shaped like:

- `what to watch before [upcoming title]`
- `[franchise] movies in order`
- `spoiler-free marvel watch order`
- `essential marvel movies only`

It also makes clear that the guides need original editorial value, not just a copied title list.

## Recommendation

Do not treat the existing AMP story template as the canonical guide surface.

Instead:

1. Create a new HTML guide route family, likely under `src/pages/guides/` or `src/pages/watch/`.
2. Build the guide layout on top of `src/layouts/MainLayout.astro` so it inherits existing SEO, navigation, and page chrome.
3. Reuse the existing story-style section syntax or a close variant so guide authoring stays markdown-first.
4. Keep AMP stories optional and derivative later if a guide also deserves a web-story version.

## Rollout Plan

### Stage 0: Define the guide content model

- Choose a new guide route family and slug pattern.
- Define frontmatter for guide pages:
  - `title`
  - `description`
  - `coverImage`
  - `targetRelease`
  - `spoilerPolicy`
  - `updatedAt`
  - optional `relatedListings` or `franchises`
- Decide whether guide bodies will keep the current `## [Title](URL)` section style or move to a stricter schema.

### Stage 1: Build the reusable HTML guide layout

- Create a markdown layout for long-form guides using `MainLayout.astro`.
- Add reusable guide modules:
  - summary or verdict box
  - watch order section
  - optional-versus-essential labels
  - spoiler guidance
  - "why this matters" notes
  - internal links to title pages and related guides
- Make sure guide pages expose normal HTML headings, crawlable copy, and canonical metadata.

### Stage 2: Seed the first guides from known demand

- Convert or rewrite the strongest existing story-style pages into HTML guides first:
  - one Spider-Man prep guide
  - one MCU-wide prep guide
  - one franchise order guide such as X-Men or Spider-Man
- Build the next 5-10 guides around the upcoming release calendar.
- Prefer pages that can be kept current with small updates instead of one-off stunt content.

### Stage 3: Add distribution and internal-link support

- Link relevant guides from high-traffic title pages.
- Add guide modules or "Read next" surfaces on title pages and changelog pages.
- Decide whether the header, sidebar, or footer needs a lightweight guides entry point after the first batch ships.

### Stage 4: Add a paired story workflow only if the HTML guides prove useful

- If a guide performs well, consider generating or maintaining a paired AMP story version.
- Use the HTML guide as the canonical source of truth and the story as a distribution artifact.

## Validation Gates

- `bun run build`
- Manual QA on one new guide route and one converted guide route
- Confirm HTML guides have unique titles, descriptions, and canonical URLs
- Confirm the guide pages have enough crawlable text to stand on their own without AMP story support
- Confirm linked listings resolve correctly and do not break if a title slug changes

## Deliverables

- A new HTML guide layout
- A markdown authoring pattern for prep guides
- The first 5-10 guides
- A lightweight internal-linking plan for routing guide traffic into title pages

## Risks And Open Questions

- The current story authoring pattern is convenient, but it may be too sparse for strong search performance without richer editorial sections.
- If AMP stories remain indexed separately, canonical handling needs to be explicit to avoid duplicate content confusion.
- Guide freshness depends on release-date accuracy, so this plan should stay aligned with the timeline data reliability work.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Existing story layout: `src/layouts/list-story.astro`
- Story-to-listing mapper: `src/helpers/node/listing-files.ts`
