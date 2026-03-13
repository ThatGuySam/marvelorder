# Growth Embed Widget Plan

Research checked on March 12, 2026.

Companion to [Monetization And Growth Research](../research/monetization-growth.md).

## Original Prompt

> Build a plan from this research for each of experiements
>
> Experiment: Prototype an embeddable widget once the site has enough pages worth citing.

## Goal

Create a minimal embeddable Marvel Order surface that can earn backlinks, referrals, and future sponsorship or data-product opportunities.

## Non-Goals

- Launching a full public API first.
- Embedding the entire homepage experience in third-party sites.
- Supporting arbitrary third-party customization on the first version.

## Repo Findings

- The backlog already includes "Try adding Embed button", so this experiment has direct product continuity.
- The existing homepage UI is a large interactive horizontal Vue surface and is too heavy to treat as the first embed target.
- The repo already has reusable listing data and image helpers, so a lighter embed can reuse the data layer without reusing the entire homepage UI.
- There are no existing embed routes, iframe helpers, or usage metrics in the repo.

## External Research

The shared research points to embeds and badges as a way to compound both discovery and monetization, especially once the site has stable guide or schedule assets worth citing.

## Recommendation

Start with an iframe-based embed for a narrow use case.

Good first candidates:

- "What to watch before X"
- a compact upcoming-release list
- a compact franchise-order widget

Avoid script-based embeds on the first version. An iframe is easier to version, safer to isolate, and less likely to break host sites.

## Rollout Plan

### Stage 0: Choose the first embed contract

- Decide which embed is most likely to be shared:
  - prep guide list
  - upcoming titles
  - franchise order
- Decide whether the embed points at a fixed slug or accepts a small query-parameter contract.

### Stage 1: Build a lightweight embed route

- Create dedicated embed page routes, likely under `src/pages/embed/`.
- Use a stripped-down layout with clear attribution and minimal dependencies.
- Keep the initial height, width, and theme options intentionally small.

### Stage 2: Add safe parameter handling

- Validate all incoming parameters.
- Avoid allowing arbitrary remote styling or script injection.
- Keep the widget cacheable and static where possible.

### Stage 3: Add an embed CTA on eligible pages

- Add "Embed" UI only on pages that have a stable widget form.
- Provide copy-paste iframe code.
- Track clicks so usage can be measured before expanding the feature.

### Stage 4: Evaluate expansion paths

- If embeds attract use, consider:
  - more widget types
  - sponsor inventory
  - a JSON endpoint or tiny public API
- Keep those as follow-on work, not first-version requirements.

## Validation Gates

- `bun run build`
- Manual QA by embedding the widget in a simple external HTML file
- Confirm attribution is visible
- Confirm the widget remains legible on small host widths
- Confirm query parameters cannot break layout or route behavior

## Deliverables

- A lightweight embed route
- Copy-paste iframe markup for one or more stable use cases
- Basic usage tracking
- A short note on whether the first embed earned any real adoption

## Risks And Open Questions

- The best embed contract may depend on which guides and changelog pages exist first.
- Third-party hosts may impose CSP or iframe styling constraints that need testing.
- If the widget is too visually close to the homepage timeline, it may be too heavy for broad adoption.

## Sources

- Shared research: [Monetization And Growth Research](../research/monetization-growth.md)
- Backlog context: [Marvel Order Backlog](../tasks/marvel-order-backlog.md)
- Existing homepage UI: `src/pages/index.astro`
