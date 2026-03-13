# Cloudflare Workers R2 Image Cache Plan

Research checked on March 12, 2026.

Companion to:

- [Cloudflare Workers Migration Plan](./cloudflare-workers-migration.md)
- [Cloudflare Workers Image Research](./cloudflare-workers-image-research.md)

## Original Prompt

> Can we back off browser caching and save these to an R2 bucket instead?
>
> Save that to a plan file

## Goal

Reduce browser cache stickiness for Worker-served images while keeping long Cloudflare-side cache behavior and persisting transformed outputs in R2 so the Worker does not have to re-fetch and re-render the same TMDB and Fanart assets repeatedly.

## Non-Goals

- Moving the public site’s static HTML, JS, or CSS into R2.
- Replacing the existing Worker image URL contract.
- Reworking the image transform semantics beyond the minimum needed for stable caching.
- Using Workers Cache API as the primary long-term image store.

## Repo Findings

- The current spike Worker lives at `workers/image-spike/src/index.ts`.
- It already performs deterministic transforms based on:
  - route kind: `tmdb` or `fanart`
  - source image path
  - `width`
  - `crop.top`
  - `crop.bottom`
  - `transparent`
- It already emits:
  - WebP output
  - `ETag`
  - a hard 6 MB response cap
- Browser caching is currently far too sticky for an image pipeline that is still being tuned:
  - `CACHE_CONTROL = 'public, max-age=365000000, immutable'`
  - source: `workers/image-spike/src/index.ts`
- The Worker has no R2 binding yet:
  - `wrangler.image-spike.jsonc` currently declares only the Worker entrypoint and observability
- The current implementation is a good fit for read-through object caching because every transformed response is already content-addressable by request inputs plus transform code version.

## External Research

### Separate browser and Cloudflare cache TTLs

Cloudflare supports `Cloudflare-CDN-Cache-Control` and `CDN-Cache-Control` so edge cache behavior can differ from browser cache behavior. `Cloudflare-CDN-Cache-Control` is the Cloudflare-specific variant and does not get forwarded downstream, while ordinary `Cache-Control` still controls browser caching.

Practical implication for this repo:

- keep browser cache short enough to recover quickly from image pipeline changes
- keep Cloudflare edge cache long enough to avoid repeated origin work

### Workers Cache API is not the right durable store

Cloudflare documents the Workers Cache API as data-center local and explicitly notes that it does not support tiered caching. That makes it useful as an opportunistic local optimization, but weak as the only cache for transformed images we want to reuse globally.

Practical implication for this repo:

- do not rely on `caches.default` alone for the image pipeline
- prefer R2 as the durable backing store

### R2 works well as a Worker-managed image store

Cloudflare’s R2 Workers API supports `put()` and `get()` from Workers, plus HTTP metadata helpers:

- `httpMetadata` on write
- `writeHttpMetadata(headers)` on read

That is enough to store transformed images together with their response metadata and rehydrate them cleanly when serving from the Worker.

### Wrangler supports bucket creation and binding

Cloudflare documents `wrangler r2 bucket create [NAME]`, and Wrangler config supports adding R2 bucket bindings to Workers.

Practical implication for this repo:

- this can be landed without changing the app-side image URL contract
- the Worker can stay public while R2 remains internal

## Recommendation

Implement the image Worker as a read-through R2 cache.

Recommended response strategy:

- Browser header:
  - `Cache-Control: public, max-age=300, stale-while-revalidate=86400`
- Cloudflare edge header:
  - `Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable`

Recommended storage strategy:

- Keep the Worker as the public entrypoint.
- Store transformed outputs in an R2 bucket, not in public static assets.
- Use a versioned cache key so algorithm changes do not require object-by-object purges.
- Optionally add a lightweight debug header during rollout:
  - `X-Image-Cache: r2-hit`
  - `X-Image-Cache: r2-miss`

This splits the problem correctly:

- shorter browser cache fixes iteration pain
- long Cloudflare cache keeps the CDN fast
- R2 prevents repeated transform work across requests and regions

## Proposed Cache Key

Use a deterministic key that includes both request inputs and transform version.

Suggested shape:

```text
v2/{kind}/{normalized-image-path}?w={width}&cropTop={cropTop}&cropBottom={cropBottom}&transparent={transparent}
```

Requirements:

- `v2` changes whenever transform semantics change
- normalized numeric values must serialize consistently
- include every query input that affects bytes
- do not include irrelevant request headers

## Rollout Plan

### Stage 1: Add the bucket and Worker binding

- Create a dedicated R2 bucket, for example `marvelorder-image-cache`.
- Add an R2 binding in `wrangler.image-spike.jsonc`, for example:
  - binding: `IMAGE_CACHE`
  - bucket name: `marvelorder-image-cache`
- Keep the Worker URL unchanged.

### Stage 2: Add cache-key and metadata helpers

- Add a helper that converts a request into a stable cache key.
- Centralize response metadata so cache hits and misses return the same headers:
  - `Content-Type`
  - `Cache-Control`
  - `Cloudflare-CDN-Cache-Control`
  - `ETag`
- Add a single transform version constant near the top of the Worker.

### Stage 3: Implement R2 read-through behavior

- On request:
  - parse options
  - build cache key
  - attempt `env.IMAGE_CACHE.get(key)`
- On hit:
  - write stored HTTP metadata into response headers
  - return the stored body immediately
- On miss:
  - fetch the remote source
  - apply transforms
  - store the output in R2 with HTTP metadata
  - return the generated response

Suggested object metadata:

- HTTP metadata:
  - `contentType: image/webp`
  - `cacheControl: public, max-age=300, stale-while-revalidate=86400`
- custom metadata:
  - `transform-version`
  - `source-kind`
  - optional original source URL for debugging

### Stage 4: Split browser and edge cache behavior

- Replace the current single `Cache-Control` constant with:
  - one browser cache header
  - one Cloudflare-only cache header
- Return both headers on cache hits and misses.
- Keep browser TTL intentionally short during the image-tuning phase.

Suggested starting values:

- browser: 5 minutes
- Cloudflare edge: 1 year

If that still feels sticky during rollout, lower browser TTL further before launch.

### Stage 5: Add invalidation and cleanup rules

- Treat transform-version bumps as the primary invalidation path for code changes.
- Reserve bucket-wide or prefix purges for exceptional cleanup only.
- Consider adding an R2 lifecycle rule later if old transform versions accumulate significantly.

### Stage 6: Roll out with visibility

- Deploy the Worker with R2 in preview first.
- Validate the same sample image set already used for the Worker spike:
  - TMDB transparent logos
  - TMDB `transparent=0`
  - Fanart logos
  - crop variants
- Watch for:
  - first-request latency
  - repeat-request latency
  - object count growth
  - incorrect cache-key collisions

## Validation Gates

- Must pass: `bun run test --run`
- Must pass: `bun run build`
- Must pass: Worker deploy through `bun run deploy:worker-images`
- Must verify headers from the deployed Worker:
  - browser `Cache-Control` is short-lived
  - `Cloudflare-CDN-Cache-Control` is long-lived
  - `Content-Type` remains `image/webp`
- Must verify repeat requests for the same image return identical bytes and `ETag`
- Must verify at least one known transparent TMDB logo still preserves soft alpha
- Must verify at least one `fanart` asset still trims correctly
- Must verify a transform-version bump routes to a new R2 object key

## Deliverables

- R2 bucket for transformed image storage
- Updated `wrangler.image-spike.jsonc` with R2 binding
- Worker read-through cache logic
- Separated browser and Cloudflare cache headers
- Short operational note describing:
  - bucket name
  - cache-key versioning
  - how to invalidate old outputs

## Risks And Open Questions

- Bucket growth:
  - transformed outputs may grow quickly because query params are part of the cache key
- Version discipline:
  - if transform semantics change and the version is not bumped, stale images will linger
- Header consistency:
  - cache hits and misses must return the same metadata or debugging will become confusing
- Preview versus production:
  - decide whether preview and production should share a bucket or use separate buckets
- Optional local cache:
  - we can add `caches.default` later as a secondary optimization, but it should stay secondary to R2

## Sources

- Cloudflare CDN cache control docs:
  - https://developers.cloudflare.com/cache/concepts/cdn-cache-control/
- Cloudflare R2 Workers API usage:
  - https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
- Cloudflare Workers cache behavior:
  - https://developers.cloudflare.com/workers/reference/how-the-cache-works/
- Cloudflare R2 Wrangler commands:
  - https://developers.cloudflare.com/r2/reference/wrangler-commands/
