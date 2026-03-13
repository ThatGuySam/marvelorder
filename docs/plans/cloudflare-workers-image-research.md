# Cloudflare Workers Image Research

Research checked on March 12, 2026.

Companion to [Cloudflare Workers Migration Plan](./cloudflare-workers-migration.md).

## Original Prompt

> Research how much of our image work we could do with the photon wasm library on the workers.
>
> Also explore additional options on Hacker News.
>
> Add all that to a new research doc next to our plan file

## Follow-up Prompt

> We can drop avif support if needed.
>
> Research other options for getting for the transparency including writing our own rust code for photon.
>
> Research just building the logos with sharp in a GitHub Action or at Cloudflare build time.
>
> Go ahead and spike+deploy a test cf worker for this and let's add a ?worker-images param that loads all the images via the worker instead of netlify

## Goal

Evaluate whether `@cf-wasm/photon` is a practical replacement for the current `sharp`-based image work during a Cloudflare Workers migration, identify realistic transparency and build-time alternatives, and capture other image-stack options surfaced by Hacker News.

## Non-Goals

- Completing the full provider migration.
- Claiming visual parity before a representative acceptance pass.
- Choosing a permanent production vendor before a spike exists.

## Repo Findings

- The current runtime image work is concentrated in two API routes:
  - `src/pages/api/tmdb-image/[...slug].ts`
  - `src/pages/api/fanart/[...slug].ts`
- Both routes currently do more than simple resize:
  - fetch a remote source image
  - sniff the real image type
  - redirect `svg` and `gif` requests back to the original remote URL
  - support fractional `crop.top` and `crop.bottom`
  - resize without enlargement
  - rotate before output
  - encode WebP at quality `95`
  - enforce a `6 MB` response cap
  - attach immutable cache headers plus `etag`
- The TMDB route has one extra parity-critical step:
  - when `transparent=1` it trims the image, extracts the red channel, adjusts contrast and brightness, and joins that derived channel back as alpha
- The fanart route is simpler but still relies on `sharp.trim()` after resize.
- Usage in `src/` is broad enough that the image contract matters:
  - `tmdb-image/`: 153 references
  - `fanart/`: 93 references
  - `crop.top`: 31 references
  - `crop.bottom`: 45 references
  - `transparent`: 44 references

## Current Image Surface

| Current behavior | TMDB | Fanart | Why it matters |
| --- | --- | --- | --- |
| Remote fetch with extension fallback | Yes | Yes | Still needed no matter which library we use |
| SVG/GIF passthrough redirect | Yes | Yes | This is app logic, not just image processing |
| Fractional top/bottom crop | Yes | Yes | Content already depends on this contract |
| Resize without enlargement | Yes | Yes | Must be preserved |
| EXIF-aware rotate | Yes | Yes | Preserves source orientation |
| Trim whitespace/background | Yes | Yes | Fanart depends on it directly; TMDB uses it before transparency work |
| Generate alpha from channel math | Yes | No | This is the hardest part of the current TMDB route |
| Encode WebP | Yes | Yes | Current output contract |
| Cache headers, `etag`, 6 MB guard | Yes | Yes | Still needed in Worker code |

## Photon On Workers

### What Photon clearly supports

The current `@cf-wasm/photon` package is built for Workers via `@cf-wasm/photon/workerd`, and its exported surface directly includes:

- decode image bytes into `PhotonImage`
- explicit pixel crop via `crop(...)`
- resize via `resize(...)`
- rotate via `rotate(...)`
- brightness and contrast adjustment
- several RGB channel operations
- output bytes as PNG, JPEG, or WebP
- raw pixel read/write through `PhotonImage.get_raw_pixels()`, the `PhotonImage` constructor, and `set_imgdata(...)`

The package tarball also shows a relatively modest runtime footprint for Workers:

- package unpacked size: about `11.4 MB`
- bundled wasm file: about `1.6 MB` raw
- gzipped wasm file from the published tarball: about `650 KB`

That makes bundle size less scary than memory pressure. The package README explicitly warns about Workers' typical `128 MB` memory limit and requires manual `free()` calls on `PhotonImage` instances.

### Gaps relative to this repo

| Need from current repo | Photon direct support | Notes |
| --- | --- | --- |
| JPEG/PNG/WebP input decode | Yes | Supported by `photon-rs` image features |
| AVIF input decode | No clear support | This is less important now because we are willing to drop AVIF if needed |
| Explicit crop rectangle | Yes | We can preserve `crop.top` and `crop.bottom` by converting fractions into pixel bounds |
| Resize and rotate | Yes | Straightforward fit |
| Brightness / contrast / channel math | Yes | Useful for approximating parts of the TMDB path |
| Built-in trim like `sharp.trim()` | No direct API found | This is a real gap for both current routes |
| Alpha composition like `ensureAlpha().joinChannel(...)` | No direct API found | This is the main TMDB parity gap |
| SVG/GIF passthrough redirect | No | Still separate Worker logic |
| Cache headers, `etag`, response-size guard | No | Still separate Worker logic |

### How much of our work could Photon cover?

If the question is "can Photon do the basic image transforms on Workers?", the answer is yes. It looks like a good fit for decode, crop, resize, rotate, and WebP/JPEG/PNG output.

If the question is "can Photon replace the current routes without changing behavior?", the answer is no, at least not directly.

Repo-specific assessment:

- `fanart` route:
  - Photon can cover the obvious transform steps.
  - Exact parity still depends on replacing `sharp.trim()`.
  - Because Photon exposes raw pixels, we could write our own trim pass around it, but that would be custom Worker image code, not a clean library swap.
- `tmdb-image` route:
  - Photon can cover crop, resize, rotate, and some of the brightness/contrast/channel operations.
  - The current transparent-logo behavior depends on trim plus alpha-channel composition that Photon does not expose as a direct primitive.
  - Recreating this exactly would likely require custom raw-pixel manipulation in JS/WASM, which increases complexity and memory churn.

The practical conclusion is:

- Photon is a strong fit for the "simple transforms" portion of almost every request.
- Photon is not a clean drop-in for the parity-critical parts of this app, especially trim and TMDB transparency extraction.
- Photon becomes more plausible if we are willing to narrow the contract:
  - keep Photon for `fanart`
  - keep Photon for `tmdb-image` when `transparent=0`
  - use a different path for transparent logos

## Transparency Options

There are four realistic ways to get the current transparent-logo effect off `sharp`.

### 1. Custom JS pixel work on top of Photon

This is the fastest route to a working Worker because Photon already gives us:

- decode to RGBA
- resize/crop
- raw pixel access
- WebP output

What we still have to write ourselves:

- a trim pass that approximates `sharp.trim()` using the top-left pixel as background
- alpha derivation from a color channel
- cache and response plumbing

This is the approach used in the March 12, 2026 spike Worker in this repo. It is practical, but it moves the hardest parity logic into custom TypeScript instead of into the WASM library itself.

### 2. Fork Photon / `@cf-wasm/photon` and add Rust primitives

This is the cleanest long-term Photon path if we want to stay in WASM and keep Worker memory copies lower.

Why this is viable:

- upstream `photon-rs` is already a Rust crate built to WebAssembly
- the `@cf-wasm/photon` package vendors the Photon crate and builds it with `wasm-pack`
- Photon explicitly describes itself as a high-level wrapper around the Rust `image` crate while still exposing low-level pixel access

What we would add in Rust:

- `trim_like_sharp(background?, threshold?)`
- `mask_from_channel(channel, contrast, brightness)`
- `join_alpha(mask)`
- possibly a single fused operation for the current TMDB logo path to avoid extra allocations

This is the best route if the spike proves the behavior is valuable enough to keep and we want a maintainable Worker implementation rather than an ever-growing JS pixel pipeline.

### 3. Cloudflare Image Resizing / Images

Cloudflare already has two promising transparency-adjacent features:

- `segment=foreground`
- `trim=border`

That makes Cloudflare’s managed transforms the most credible "no custom pixel code" replacement for TMDB transparency. The tradeoff is control: it is an approximation, not a guaranteed match to the current red-channel mask pipeline.

### 4. Pre-generate transparent logos with Sharp

This is the most conservative path if transparent logo quality matters more than runtime flexibility.

Instead of reproducing the effect at request time, we can:

- fetch the remote logo once during CI/build
- run the existing `sharp` pipeline in Node
- write the final WebP derivatives into `public/` or object storage
- let Cloudflare serve them as static assets

This removes the most complex image behavior from the Worker entirely.

## Build-Time Sharp Options

Build-time Sharp is viable in both of the likely CI environments.

### GitHub Actions

This repo already runs scheduled automation in GitHub Actions on `ubuntu-latest` with Bun. Sharp’s install docs say Linux x64 prebuilt binaries are available, and this repo already uses `sharp` successfully in local/build contexts. That makes a GitHub Action the lowest-risk place to pre-generate logos.

### Cloudflare Workers Builds

Cloudflare’s Workers Builds build image currently includes:

- Ubuntu 24.04
- x86_64
- Bun 1.2.15 by default
- `libvips-dev` as a preinstalled package

That means Cloudflare’s own build environment is also a credible place to run Sharp generation during build, especially for a static-first deploy.

Preferred build-time direction:

1. GitHub Actions if we want the generation step to be explicit and auditable
2. Workers Builds if we want a single Cloudflare-native pipeline
3. Keep runtime Worker image work only for variants that genuinely need on-demand sizing

## Spike Result

A test Worker was implemented and deployed on March 12, 2026:

- Worker config: `wrangler.image-spike.jsonc`
- Worker entrypoint: `workers/image-spike/src/index.ts`
- Deployed URL: `https://marvelorder-image-spike.samcarlton.workers.dev`

What the spike currently does:

- supports the existing `/.netlify/functions/tmdb-image/*` and `/.netlify/functions/fanart/*` path shapes
- fetches remote TMDB and fanart source images directly
- preserves `width`, `crop.top`, and `crop.bottom`
- returns WebP with immutable cache headers and an SHA-1-based `etag`
- redirects SVG and GIF sources to the upstream original URL
- uses Photon for decode/crop/resize/output
- uses custom JS pixel logic for:
  - fanart trim
  - TMDB trim
  - TMDB alpha generation from the red channel

App-side toggle work also landed:

- `src/layouts/MainLayout.astro` now rewrites image URLs when `?worker-images` is present
- by default it uses `src/config.ts -> IMAGE_WORKER_ORIGIN`
- it also accepts an explicit origin override via `?worker-images=https://...`

What this proves:

- a standalone Workers.dev image Worker is feasible with Photon plus custom pixel logic
- the current Netlify-style URL contract can be preserved during a migration spike
- we can compare worker-served images in the browser without first codemodding all content

What this does not prove yet:

- visual parity with the current TMDB transparent-logo pipeline
- memory behavior across a large representative sample set
- whether custom JS pixel work is better than pre-generation or Cloudflare Images long-term

## Additional Options Surfaced On Hacker News

HN is useful here as operator signal, not as primary technical proof. The recurring options are mostly the same ones teams have used for years:

| Option | HN signal | Fit for this repo |
| --- | --- | --- |
| `imgproxy` | Shows up as a dedicated on-demand image server and as a self-hosted alternative for resizing/conversion | Good if we want a purpose-built image service outside Workers; weaker if the goal is "keep everything inside Cloudflare" |
| `thumbor` | Long-running open-source image resizing/cropping stack | Similar tradeoff to imgproxy, but with more operational surface than a pure Workers approach |
| `libvips` / VIPS-based pipelines | HN continues to treat vips as the performance-oriented base layer for serious image work | Good if we move toward build-time or batch pre-generation; not something we can run directly inside Workers the way we use `sharp` today |
| Cloudflare Images / Image Resizing | HN discussion shows real interest, plus some caution about pricing/fit and operational sharp edges | Best aligned with the rest of the Workers migration, but still needs visual and cost validation |
| `imgix` | HN has treated it as a mature managed on-demand imaging CDN for a long time | Strong buy-vs-build option if we want to outsource the image layer entirely |

What matters for this repo:

- HN reinforces that there are really two viable directions:
  - keep image processing as a dedicated service problem
  - simplify the app so most image work is pre-generated or delegated to a managed edge product
- HN does not make a strong case that custom in-Worker pixel pipelines are the default happy path for image-heavy apps.

## Recommendation

Do not make Photon the default migration path for the entire image layer yet, but keep the new Worker spike as a comparison harness.

Recommended next steps:

1. Run the deployed Worker against the Stage 0 acceptance set from the migration plan using `?worker-images`.
2. Compare three transparency paths on the same sample set:
   - current Worker spike: Photon plus custom JS pixel logic
   - Cloudflare-managed: `segment=foreground` plus `trim=border`
   - build-time Sharp pre-generation
3. If the Worker spike is visually close but not stable enough, choose one of two hardening paths:
   - move the custom pixel primitives into Rust by forking Photon / `@cf-wasm/photon`
   - stop doing transparency at request time and pre-generate the assets with Sharp
4. Keep the Worker runtime narrow even if build-time generation wins:
   - legacy `/.netlify/functions/*` compatibility
   - width-based variants only where they still add value

Current recommendation order:

1. Static or pre-generated transparent logos with Sharp if exact output matters
2. Cloudflare-native transforms if visual output is acceptable without exact parity
3. Photon plus custom pixel logic for a stopgap or limited runtime subset
4. Forked Rust Photon work only if runtime parity is important enough to justify maintaining custom WASM

## Validation Gates For A Spike

- Keep the Worker bundle within Cloudflare limits after bundling the wasm module.
- Measure isolate memory on a representative large image set.
- Compare before/after output on the existing acceptance set from the migration plan.
- Specifically verify:
  - trim behavior on fanart logos
  - transparent TMDB logos
  - crop math for `crop.top` and `crop.bottom`
  - cache headers and `etag`
  - behavior when upstream returns SVG or GIF
  - whether the `?worker-images` toggle catches all image URLs that still point at Netlify

## Risks And Open Questions

- Dropping AVIF removes one compatibility concern, but does not change the harder trim and transparency gaps.
- The missing trim primitive is a bigger issue than it first appears because both routes depend on it.
- Photon can reproduce more of the current behavior through raw-pixel work, and the spike proves that path is viable, but it shifts complexity into custom Worker code and may erase the simplicity benefit.
- A Photon fork with custom Rust functions is technically viable, but only worth it if runtime transparency is strategically important.
- Build-time Sharp is likely the safest parity path, but it changes the content pipeline and cache invalidation story.
- Cloudflare Worker memory is a more immediate risk than Photon package size.
- If transparent TMDB logos are visually important, the migration should not assume a Worker-only WASM path until that output is proven with real examples.

## Sources

- `@cf-wasm/photon` package metadata: https://registry.npmjs.org/%40cf-wasm%2Fphoton/latest
- `@cf-wasm/photon` README: https://raw.githubusercontent.com/fineshopdesign/cf-wasm/main/packages/photon/README.md
- `photon-rs` docs: https://docs.rs/photon-rs/latest/photon_rs/
- `photon-rs` crate features at the commit referenced by `@cf-wasm/photon`: https://raw.githubusercontent.com/silvia-odwyer/photon/8347f46e73fedb3b095fb816b728ae08c1c029af/crate/Cargo.toml
- `@cf-wasm/photon` build config: https://github.com/fineshopdesign/cf-wasm/blob/main/packages/photon/tsup.config.ts
- `photon-rs` crate README: https://github.com/silvia-odwyer/photon/blob/master/crate/README.md
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers CI/CD overview: https://developers.cloudflare.com/workers/ci-cd/
- Cloudflare Workers Builds: https://developers.cloudflare.com/workers/ci-cd/builds/
- Cloudflare Workers Builds build image: https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- Cloudflare Image Resizing: https://developers.cloudflare.com/images/transform-images/transform-via-url/
- Cloudflare Image Resizing via Workers: https://developers.cloudflare.com/images/transform-images/transform-via-workers/
- sharp install docs: https://sharp.pixelplumbing.com/install/
- sharp trim behavior: https://sharp.pixelplumbing.com/api-resize/#trim
- sharp rotate behavior: https://sharp.pixelplumbing.com/api-operation/#rotate
- HN: "Imgproxy: A fast and secure standalone server for resizing and converting images" https://news.ycombinator.com/item?id=29380900
- HN: "Show HN: Thumbor - open-source on-demand image cropping, resizing, and filters" https://news.ycombinator.com/item?id=8294170
- HN: "Issues with Cloudflare Images" https://news.ycombinator.com/item?id=29474743
- HN: "Cloudflare Images Now Available to Everyone" https://news.ycombinator.com/item?id=28562917
- HN: "Show HN: Imgix Sandbox - Explore on-demand image processing" https://news.ycombinator.com/item?id=9963680
- HN: "VIPS - very fast image processing with any amount of RAM" https://news.ycombinator.com/item?id=7819822
