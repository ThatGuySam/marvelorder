# Growth Timeline Changelog Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Publish monthly or quarterly timeline changelogs and share them where relevant.

## Goal

Turn release-order and timeline changes into a public changelog surface that supports search, alerts, and community sharing.

## Non-Goals

- Publishing every tiny TMDB fluctuation as a public update.
- Building a full newsroom or commentary section.
- Depending on live API calls at request time.

## Repo Findings

- `scripts/pull.ts` already writes a `tmdb-regression-report.json`, which captures data changes but is not currently rendered as public site content.
- The repo already leans on checked-in snapshots and generated artifacts, which fits changelog generation well.
- There is no existing public changelog route, feed, or update index.
- The timeline-data reliability plan already proposes generated reports and conflict artifacts, which can feed directly into this experiment.

## External Research

The shared research recommends versioned schedule snapshots, monthly or quarterly change summaries, and citeable update assets as both a growth channel and a retention layer.

## Recommendation

Build the changelog as a generated artifact plus a human-readable page family.

The internal artifact should decide what changed.
The public page should explain why it matters.

This keeps the render path offline-friendly and consistent with repo rules.

## Rollout Plan

### Stage 0: Define public change significance

- Decide which changes become public entries:
  - release-date changes
  - title confirmations or renames
  - major order changes
  - newly added or newly removed titles
- Exclude noisy or low-confidence churn until it is verified.

### Stage 1: Generate machine-readable changelog data

- Add a generated changelog artifact under `src/generated/` or another checked-in build artifact path.
- Source it from existing snapshots and pull reports rather than live requests.
- Store enough metadata to support later alerting and feed generation.

### Stage 2: Build the public changelog routes

- Add an index page plus individual entry pages or date-grouped pages.
- Use standard HTML routes rather than AMP stories.
- Include:
  - what changed
  - previous value
  - new value
  - why it matters for viewers
  - source or verification date where relevant

### Stage 3: Add distribution hooks

- Generate JSON and or RSS feed output from the changelog data.
- Add a lightweight community-sharing checklist for each significant update.
- Link changelog items to affected prep guides and title pages.

### Stage 4: Connect to alerts and community workflows

- Use changelog entries as the source for release alert messages.
- Use the same entries for Reddit or community update posts when appropriate.

## Validation Gates

- `bun run build`
- Confirm a known historical change renders correctly in the public changelog
- Confirm the changelog works without live API calls
- Confirm feed output is stable if feed routes are added
- Confirm changelog entries link cleanly to affected title pages or guides

## Deliverables

- Generated changelog artifact
- Public changelog index and entry routes
- Optional feed output
- A significance rubric for which changes become public

## Risks And Open Questions

- If significance rules are too loose, the changelog will become noisy and unhelpful.
- If significance rules are too strict, the changelog may miss the updates that actually drive repeat visits.
- The public changelog depends on the release-data pipeline staying trustworthy and auditable.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Existing pull artifact generation: `scripts/pull.ts`
- Related plan: [Timeline Data Reliability](./timeline-data-reliability.md)
