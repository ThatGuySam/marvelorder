# Growth Affiliate Expansion Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Expand affiliate coverage into physical collections and comics, not just streaming CTAs.

## Goal

Expand commerce surfaces where user intent is strongest while preserving the site's trust and avoiding clutter on the core timeline experience.

## Non-Goals

- Stuffing affiliate links onto every page.
- Adding multiple low-quality providers at once.
- Replacing editorial recommendations with auto-generated storefront listings.

## Repo Findings

- The current data model already supports `watchLinks`, and `ListingWatchLinks` allows additional keys even though the UI currently only favors Amazon or Prime.
- `src/components/listing-content.vue` shows a Prime Video button outside listing-page context.
- `src/layouts/list-story.astro` already renders `Watch on Prime` pills in story watch-order pages.
- `scripts/add-amazon-links.ts` uses Amazon Product Advertising API to search `AmazonVideo` and write links back into title markdown.
- The backlog already includes "Add rental/purchase links for `none`", which is adjacent to this experiment.

## External Research

The shared research suggests:

- affiliate works best on explicit purchase-intent pages
- generic entertainment informational pages do not monetize well through affiliate alone
- curated high-intent pages such as box sets, comics, and collector guides are a better fit than simply adding more generic watch buttons

## Recommendation

Keep the current title-page watch CTA light and expand commerce through curated modules and guide pages.

Recommended split:

- `watchLinks` remains for streaming or rental actions tied to a title
- add a separate commerce model for:
  - physical collections
  - comic tie-ins
  - reading-order or buying-guide recommendations

This keeps title pages usable while moving the heavier commerce intent into the places where users are already deciding what to buy.

## Rollout Plan

### Stage 0: Audit current coverage and intent

- Measure how many titles already have Amazon links.
- Identify the best initial commerce targets:
  - Spider-Man collections
  - X-Men collections
  - Avengers or MCU box sets
  - comics to read before upcoming releases

### Stage 1: Define the expanded commerce model

- Decide whether to add `shopLinks`, `buyLinks`, or `readingLinks` to frontmatter.
- Decide which surfaces should accept curated product lists versus one-link CTAs.
- Add disclosure copy requirements before rendering new commerce blocks.

### Stage 2: Build the UI and authoring workflow

- Add a reusable commerce module for guide pages and possibly title pages.
- Keep title-page UI minimal and context-aware.
- Add or update helper scripts only where automation is trustworthy enough to reduce manual work.

### Stage 3: Launch a narrow pilot

- Publish a small set of curated commerce pages and modules.
- Keep the pilot tied to high-intent franchises and upcoming releases.
- Measure clicks before expanding the schema or adding more providers.

### Stage 4: Refine automation and cleanup

- If Amazon API quality is acceptable, improve `scripts/add-amazon-links.ts` for manual review workflows rather than blind bulk writes.
- Add a broken-link and stale-link audit step if the pilot grows.

## Validation Gates

- `bun run build`
- Manual QA for a page with no commerce links, one watch link, and a richer curated commerce module
- Confirm disclosure copy is present
- Confirm the homepage remains unaffected
- Confirm affiliate links open correctly and do not leak malformed query parameters

## Deliverables

- A clearer commerce data model
- UI for curated commerce blocks
- The first high-intent commerce pages or modules
- A decision on how much Amazon automation should remain in the loop

## Risks And Open Questions

- Amazon commissions may remain too small to justify broad automation.
- Curated buying guides create editorial maintenance cost, especially around stock, bundle, and format changes.
- More providers increase operational complexity quickly unless there is a strong business case.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Existing Amazon script: `scripts/add-amazon-links.ts`
- Existing watch-link rendering: `src/components/listing-content.vue`
