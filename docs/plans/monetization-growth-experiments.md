# Monetization And Growth Experiments Plan Set

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Research Indie Hackers, Hacker News, Reddit, Online Communities, and other sources for how people monetize and grow a site like this.
>
> Save that research
>
> Build a plan from this research for each of experiements

## Goal

Turn the monetization and growth research into repo-local execution plans that can be picked up independently without redoing the discovery work.

## Non-Goals

- Shipping the experiments in this plan file.
- Choosing every vendor up front for email, ads, or sponsorship tooling.
- Turning Marvel Order into a generic content farm or ad-heavy fandom site.

## Repo Findings

- Title pages are markdown-backed files under `src/pages/en/*.md` and render through `src/layouts/MainLayout.astro`, `src/components/PageContent/PageContent.astro`, and `src/components/listing-content.vue`.
- The current watch-link system already supports affiliate-style links in frontmatter via `watchLinks`, and the UI currently exposes Amazon or Prime links from `src/components/listing-content.vue` and `src/layouts/list-story.astro`.
- Existing "watch list" and anthology content under `src/pages/stories/*.md` uses `src/layouts/list-story.astro`, which outputs AMP Web Stories rather than long-form HTML articles.
- There is no current email, push, RSS, public changelog, embed widget, or ad-rendering system in the repo.
- Google Analytics is already wired in through `src/components/meta/google-analytics.astro`.
- The backlog already contains adjacent ideas:
  - "Try adding Embed button"
  - "Add rental/purchase links for `none`"
  - "Track Seen uses via Google Analytics"

## Shared Research Conclusions

- Search plus community distribution is the best near-term growth loop for a site like Marvel Order.
- Display ads are the most proven large-scale revenue source for entertainment reference traffic, but only if they stay off the core product surface.
- Affiliate links are worth expanding only on high-intent pages.
- Original editorial value is mandatory if the site wants durable search growth while reusing TMDB and other upstream data.
- Email, RSS, or alert-style owned audience capture should follow quickly after the first repeatable content layer.

## Recommendation

Run the experiments in three waves.

Wave 1: Build the content moat.

- [Growth Prep Guides Plan](./growth-prep-guides.md)
- [Growth Title Notes Plan](./growth-title-notes.md)
- [Growth Timeline Changelog Plan](./growth-timeline-changelog.md)

Wave 2: Add repeat visits and commerce.

- [Growth Release Alerts Plan](./growth-release-alerts.md)
- [Growth Affiliate Expansion Plan](./growth-affiliate-expansion.md)

Wave 3: Monetize and distribute at larger scale.

- [Growth Selective Ads Plan](./growth-selective-ads.md)
- [Growth Embed Widget Plan](./growth-embed-widget.md)

This order matches the research and the repo:

- the site needs HTML guide and changelog surfaces before it has enough inventory for alerts, sponsors, or ads
- title-page notes improve both prep guides and changelogs
- ads and embeds are much easier to judge once the site has stable long-tail pages and recurring updates

## Rollout Plan

### Stage 0: Create the reusable content surfaces

- Build the first non-AMP guide template.
- Extend title frontmatter for editorial notes.
- Define a changelog artifact and route shape.

### Stage 1: Publish the first search and community assets

- Ship 5-10 prep guides around the next Marvel release cycle.
- Annotate the highest-value title pages those guides depend on.
- Publish the first changelog page and feed.

### Stage 2: Add repeat-visit hooks

- Launch release-date and prep-guide alerts using a provider-backed email workflow plus a site-owned feed.
- Add measurement for signups, guide clicks, and returning visits.

### Stage 3: Expand commerce carefully

- Add curated commerce modules to the highest-intent guide and title pages.
- Keep the homepage and main timeline uncluttered.

### Stage 4: Test larger-scale monetization and distribution

- Introduce an ad-slot abstraction behind route gating and feature flags.
- Prototype an embeddable widget once guides and changelogs are stable enough to cite externally.

## Validation Gates

- Every experiment should preserve `bun run build` as a baseline check.
- No experiment should place ads or clutter on the homepage timeline unless a later plan explicitly changes that decision.
- New content surfaces should have a clear canonical route and should not rely on AMP story pages as the only HTML output for search-heavy content.
- Email or alert features should not ship without unsubscribe, disclosure, and basic measurement.

## Deliverables

- [Growth Prep Guides Plan](./growth-prep-guides.md)
- [Growth Release Alerts Plan](./growth-release-alerts.md)
- [Growth Title Notes Plan](./growth-title-notes.md)
- [Growth Affiliate Expansion Plan](./growth-affiliate-expansion.md)
- [Growth Selective Ads Plan](./growth-selective-ads.md)
- [Growth Timeline Changelog Plan](./growth-timeline-changelog.md)
- [Growth Embed Widget Plan](./growth-embed-widget.md)

## Risks And Open Questions

- The current `stories/` system is optimized for AMP Web Stories, not long-form guide pages. The prep-guide plan needs to establish the canonical HTML format first.
- Ads should probably wait until traffic and page inventory justify them; otherwise the implementation work arrives before the business case.
- Email should start with a hosted provider unless the repo is already moving off Netlify and wants first-party delivery later.
- Sponsored or affiliate surfaces need clear labeling because trust is one of the site's differentiators versus noisier fandom properties.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Backlog context: [Marvel Order Backlog](../tasks/marvel-order-backlog.md)
