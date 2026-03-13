# Growth Title Notes Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Add original notes to key title pages: continuity, optional versus essential, spoiler status, relation to the next release.

## Goal

Add structured editorial notes to the highest-value title pages so Marvel Order offers original guidance beyond upstream metadata.

## Non-Goals

- Annotating the full catalog in one pass.
- Replacing the existing title description or timeline modules.
- Auto-generating subjective notes from TMDB data.

## Repo Findings

- `src/helpers/types.ts` keeps `ListingFrontMatter` small today, with no first-class fields for continuity, spoiler policy, importance, or release relevance.
- `src/components/listing-content.vue` renders title, release countdown, Prime link, description, credits, and secondary links, but not editorial guidance.
- Title markdown files already have space above the embedded `## TMDB Data` block, so some notes can live in markdown body content if needed.
- The layout path for title pages is stable:
  - markdown file in `src/pages/en/*.md`
  - `src/layouts/MainLayout.astro`
  - `src/components/PageContent/PageContent.astro`
  - `src/components/listing-content.vue`

## External Research

The shared research makes two constraints clear:

- pages need original value if they are going to rank and earn
- the original value should be specifically useful for watch-order decisions, not generic trivia

## Recommendation

Introduce a small, typed editorial note schema in frontmatter and render it as a dedicated module above the generic description.

Start with fields that map directly to user decisions:

- continuity or universe
- essential versus optional
- spoiler scope
- why it matters
- what upcoming release it prepares you for
- last verified date or source note

Keep the schema small on the first pass so the repo does not create an unmaintainable annotation burden.

## Rollout Plan

### Stage 0: Design the note schema

- Extend `ListingFrontMatter` and `Listing` with a compact note model.
- Decide whether notes live as flat fields or a nested object such as `editorialNotes`.
- Document authoring expectations so tone and labels stay consistent.

### Stage 1: Render the note module

- Add a new section to `src/components/listing-content.vue` or an extracted child component.
- Make the module visually distinct from TMDB-derived description text.
- Ensure it works on both listing pages and any future guide surfaces that reuse listing content.

### Stage 2: Pilot the highest-value titles

- Annotate a small, intentional set of pages first:
  - the next major MCU release
  - the supporting titles needed for the next prep guides
  - one or two franchise-order pages with recurring demand
- Prefer pages that already attract watch-order questions.

### Stage 3: Connect notes to adjacent surfaces

- Surface the notes in prep guides where useful.
- Reuse note data in changelog and alert copy when a title becomes newly relevant.
- Decide whether any note fragments belong on cards, tooltips, or search snippets later.

## Validation Gates

- `bun run build`
- Manual QA on at least three title pages with and without note data
- Confirm old markdown files without notes still render cleanly
- Confirm the note copy is clearly separate from TMDB metadata and does not break layout spacing

## Deliverables

- Extended listing frontmatter and types
- A rendered note module on title pages
- A short authoring rubric
- The first annotated set of high-value titles

## Risks And Open Questions

- Too many note categories will slow content entry and drift into inconsistency.
- Subjective labels such as "essential" need a documented definition.
- If notes remain in markdown body instead of structured fields, they will be harder to reuse across guides and embeds later.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Listing types: `src/helpers/types.ts`
- Title-page rendering: `src/components/listing-content.vue`
