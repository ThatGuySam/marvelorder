# Growth Release Alerts Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Add an email or push signup for release-date changes and prep-guide alerts.

## Goal

Create a low-overhead owned-audience system for release-date changes, new prep guides, and other recurring Marvel Order updates.

## Non-Goals

- Building a custom email sending system in this repo on the first pass.
- Shipping first-party web push before the site has a proven alert cadence.
- Launching a broad editorial newsletter unrelated to release and viewing-order updates.

## Repo Findings

- There is no email, RSS, feed, service-worker, or push infrastructure in the repo today.
- `src/components/meta/google-analytics.astro` provides a place to measure signup clicks and downstream engagement.
- `scripts/pull.ts` already generates machine-readable TMDB regression artifacts, which can become inputs to alert-worthy change events once a public changelog exists.
- The repo is still Netlify-oriented in several places, so provider-hosted forms or API-backed signup flows are safer than building mail delivery inside the app immediately.

## External Research

The shared research points to owned audience capture as the retention layer after search and community discovery. It also suggests that the natural repeat hook for Marvel Order is schedule churn, not generic commentary.

## Recommendation

Start with email-first alerts backed by a site-owned feed.

Concretely:

1. Define a machine-readable update feed inside the repo.
2. Use a hosted email platform for signup capture and delivery.
3. Keep web push out of scope until email and changelog events prove there is repeat demand.
4. Let users subscribe to narrow update types rather than one broad newsletter.

## Rollout Plan

### Stage 0: Define the alert model

- Decide which events qualify for alerts:
  - release-date change
  - new prep guide
  - timeline reordering
  - major title rename or confirmation
- Decide whether subscriptions are:
  - global
  - franchise-based
  - release-based
  - both

### Stage 1: Build a site-owned feed

- Generate a public JSON and or RSS feed for significant updates.
- Make changelog entries the canonical record for alertable events.
- Ensure every feed item has:
  - title
  - slug or URL
  - published timestamp
  - summary
  - event type

### Stage 2: Add signup capture

- Add a small signup component to the most relevant surfaces:
  - guide pages
  - changelog pages
  - possibly key title pages for upcoming releases
- Keep the copy specific:
  - "Get release-date change alerts"
  - "Get spoiler-safe prep guide alerts"
- Route signup data through a hosted provider rather than repo-local delivery.

### Stage 3: Launch the first alert workflows

- Wire the provider to the feed or to a small manual publishing checklist.
- Start with one or two alert classes rather than everything at once.
- Keep delivery frequency low and event-driven.

### Stage 4: Measure and refine

- Track signup conversion by page type.
- Track which alert classes get the most engagement.
- Decide later whether RSS alone is enough for some users and whether web push is worth a second implementation.

## Validation Gates

- `bun run build`
- Validate the feed output manually and with an RSS validator if RSS is included
- Confirm signup forms or provider embeds work on mobile and desktop
- Confirm unsubscribe and disclosure copy exist before public launch
- Confirm alert pages do not regress Core Web Vitals or add blocking third-party code to the homepage

## Deliverables

- A public update feed
- Signup UI on selected pages
- A provider-backed alert workflow
- Basic analytics for signup clicks and downstream visits

## Risks And Open Questions

- Provider choice affects form UX, data ownership, and future migration cost.
- If the changelog is noisy, alerts will feel spammy quickly.
- Web push may look attractive but is likely more engineering-heavy than the current audience size justifies.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Existing regression artifact producer: `scripts/pull.ts`
- Existing analytics entry point: `src/components/meta/google-analytics.astro`
