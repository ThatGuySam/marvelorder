# Growth Selective Ads Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Test ads only on long-tail search pages and detail pages, not on the homepage.

## Goal

Create a controlled ad experiment that can be turned on for selected routes without degrading the homepage timeline or locking the codebase to one provider prematurely.

## Non-Goals

- Putting ads on the homepage or main horizontal timeline.
- Committing to a production ad network before traffic and page inventory justify it.
- Hiding ads inside editorial modules or making sponsor units look organic.

## Repo Findings

- There is no current ad-rendering infrastructure in the repo.
- The main surfaces are:
  - homepage timeline via `src/pages/index.astro`
  - title pages via `src/layouts/MainLayout.astro`
  - AMP story pages via `src/layouts/list-story.astro`
- Google Analytics already exists, so ad tests can at least be paired with basic traffic and behavior measurement.
- The research and the repo both point toward keeping the homepage as the clean product surface.

## External Research

The shared research says ads are the most proven revenue source at scale for entertainment reference traffic, but only if they stay off the experience that users actually love.

## Recommendation

Do the code work in two parts:

1. Build an ad-slot abstraction and route allowlist now only if it is cheap to maintain.
2. Do not turn it on until traffic, content inventory, and network eligibility are clear.

This separates future readiness from premature monetization.

## Rollout Plan

### Stage 0: Decide whether the business case exists yet

- Check traffic and pageview thresholds against likely networks.
- Decide whether the first experiment is:
  - no-op infrastructure only
  - a small pilot with a low-threshold network
  - deferred until guides and changelogs are established

### Stage 1: Define ad policy in code

- Create a route allowlist:
  - title pages
  - HTML guides
  - changelog pages
- Explicitly exclude:
  - homepage timeline
  - AMP story pages on the first pass
- Define placement rules and size constraints before integrating a provider.

### Stage 2: Build the ad-slot abstraction

- Add a shared `AdSlot` component or equivalent partial.
- Gate rendering behind environment flags and route checks.
- Make the default behavior a no-op when ads are disabled.

### Stage 3: Pilot on a small set of routes

- Turn on ads only for a narrow page subset.
- Check mobile behavior, CLS, loading, and layout overlap.
- Keep ad density low enough that the site still feels intentionally built.

### Stage 4: Measure and decide

- Compare revenue signal, page speed, and user engagement before expanding.
- Roll back quickly if the test harms usability or page quality.

## Validation Gates

- `bun run build`
- Confirm the homepage never renders an ad slot
- Manual mobile and desktop QA on pilot pages
- Measure CLS and page layout stability before and after the pilot
- Confirm ad-provider scripts only load where the route allowlist permits them

## Deliverables

- A route-gated ad-slot abstraction
- A written placement policy
- A pilot result summary before any broader rollout

## Risks And Open Questions

- If traffic is still below meaningful thresholds, the engineering work may land before the revenue case exists.
- Ad-provider scripts can hurt Core Web Vitals quickly if they are not heavily constrained.
- AMP story pages may need a separate ad strategy or may be better left ad-free.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Existing homepage route: `src/pages/index.astro`
- Existing analytics: `src/components/meta/google-analytics.astro`
