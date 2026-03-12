Galaxy / Star Background - Marvel Order


Related

- Input-aware parallax note: [input-aware-parallax.md](/Users/athena/Code/marvelorder/docs/research/input-aware-parallax.md)


Goal

Match the official Marvel timeline graphic look:
- deep-space nebula backdrop
- sparse bright stars with some depth
- slow motion so the page feels alive
- enough headroom for the existing horizontal list UI and expanded cards


Current template constraints

- The homepage already renders a large horizontal list in [src/components/listing-row.vue](/Users/athena/Code/marvelorder/src/components/listing-row.vue).
- Each item in [src/components/listing-column.vue](/Users/athena/Code/marvelorder/src/components/listing-column.vue) can expand into heavier content with backdrops, text, buttons, and transitions.
- The background currently lives at the layout level in [src/layouts/HorizontalScroll.astro](/Users/athena/Code/marvelorder/src/layouts/HorizontalScroll.astro) as a simple gradient on `#grid-main`.

That means the effect should be one global background layer behind the whole timeline, not a per-card effect.


What makes the official graphics work

The official timeline art is not really "lots of particles." The look mostly comes from:
- 2-3 large nebula color fields
- a star layer with a few bright hero stars and lots of faint points
- slight drift, shimmer, and depth separation
- additive/lighten-style blending

The expensive-looking part is mostly compositing, not simulation.


Recommendation

Use a hybrid background:

1. One fixed background root attached to `#grid-main`.
2. Two or three oversized nebula texture layers that only animate with `transform` and `opacity`.
3. One global canvas or Pixi layer for sparse stars, dust, and occasional twinkle.
4. No DOM particles and no per-listing animated backgrounds.

This is the best fit for Marvel Order because the page cost is already in the listing DOM. The background needs to stay mostly on the compositor or GPU.


Best implementation order

Phase 1: Cheapest version with the highest overhead
- Pre-render 2-3 nebula textures from artwork, gradients, noise, or composited scans.
- Use CSS transforms to drift them slowly on a fixed background layer.
- Add a single canvas for stars only.
- Animate stars at low frequency and low density.

Phase 2: Add depth
- Add a second star band for tiny parallax differences.
- Add 8-20 larger glow stars with very slow pulse variance.
- Tie a tiny amount of parallax to horizontal scroll position, not pointer position.

Phase 3: Only if Phase 1 still feels too flat
- Move the star canvas to PixiJS for easier additive blending, sprite batching, and better particle scaling.
- Keep the nebula layers as textures, not procedural shader clouds.


Why this is the right tradeoff

CSS-only background
- Pros: cheapest possible runtime, trivial to ship.
- Cons: nebula drift looks good, but stars and sparkle depth get fake fast.
- Verdict: good base layer, not enough by itself.

Canvas 2D
- Pros: low dependency cost, enough for stars, dust, twinkle, and subtle parallax.
- Cons: you still need to manage draw count and device pixel ratio.
- Verdict: best first implementation.

PixiJS
- Pros: better batching, additive blending, sprite textures, and particle scale if the effect grows.
- Cons: extra dependency and more surface area than canvas.
- Verdict: best second step if canvas cannot hit the look.

Three.js / shader-heavy procedural nebula
- Pros: dramatic visuals.
- Cons: wrong cost profile for a page that already has a large interactive DOM tree.
- Verdict: avoid for this page unless the timeline UI is drastically simplified.

SVG / DOM particle systems
- Pros: easy to inspect.
- Cons: directly competes with the many existing DOM nodes on the page.
- Verdict: avoid.


Recommended layer stack

Layer 1: static deep-space base
- large dark blue / teal / violet image or gradient base
- no animation required

Layer 2: nebula texture A
- oversized AVIF/WebP/PNG texture
- slow `translate3d` drift over 40-90 seconds
- low opacity

Layer 3: nebula texture B
- different color family and scale
- even slower drift in the opposite direction
- optional `mix-blend-mode: screen` or `lighten`

Layer 4: star canvas
- one global fixed canvas
- capped DPR
- 500-1500 tiny stars, depending on viewport size
- 10-30 brighter stars with soft glow sprites
- optional dust specks moving at a different speed band

Layer 5: foreground content
- existing list UI
- no background-related filters on the listing cards themselves


Animation rules

- Favor `transform` and `opacity` for nebula movement.
- Keep nebula motion almost imperceptible. The official look reads as atmospheric, not "particle demo."
- Run stars at a lower internal resolution than the main viewport if needed.
- Cap device pixel ratio for the background renderer. A DPR clamp like `Math.min(window.devicePixelRatio, 1.5)` is usually the first free win.
- Pause or heavily throttle animation when the tab is hidden.
- Honor `prefers-reduced-motion` by freezing drift and keeping only a static star field.


Performance rules for this template

- Mount one background instance at layout level only.
- Do not create one canvas per row, per section, or per listing.
- Do not use CSS `box-shadow` starfields with hundreds of generated shadow points.
- Do not animate CSS filters like blur, hue rotate, or large drop shadows every frame.
- Avoid full-screen SVG filters on every frame.
- Keep the canvas visually rich by using textured sprites and a low particle count instead of brute-force dots.


How to get the "official art" feel without the cost

Use authored textures, not simulated clouds.

The Marvel graphics feel rich because the nebula layer is painterly and uneven. The cheapest way to get that is:
- build 2-3 large nebula plates offline
- export them as compressed textures
- move them slowly with transforms
- let the canvas handle only stars and sparkle

That gives most of the look for a fraction of the runtime cost of procedural clouds.


Canvas-specific approach

Use canvas if the target is "looks expensive, runs cheap."

Suggested behavior:
- pre-generate star positions once
- separate stars into static, slow drift, and twinkle groups
- draw tiny stars as plain fills
- draw brighter stars from a tiny glow sprite atlas
- redraw only once per frame, or even less often for subtle motion
- recompute layout only on resize

Good extras:
- use `createImageBitmap()` for background/star sprite assets before drawing
- use `OffscreenCanvas` as a progressive enhancement if the animation loop ever competes with interaction

I would not make `OffscreenCanvas` the baseline requirement. It is best treated as an optimization layer, not the only path.


Pixi-specific approach

Use Pixi only if you want more animation richness after the canvas version lands.

Best Pixi shape for this page:
- one full-screen `Application`
- one container for static nebula sprites
- one `ParticleContainer` for stars
- one optional sprite layer for glow flares
- no heavy filters, no shader experiments in the first pass

If Pixi is used, keep the star sprites extremely simple and batchable. The value is in cheap additive compositing and sprite throughput, not in building a mini game scene.


Extra budget to buy back

The background should still be the cheap part, but there are a few adjacent wins:
- test `content-visibility` on heavy card internals, not the outer horizontal sizing elements
- isolate the background root with `contain` so its paints stay local
- avoid expensive overlay effects on expanded cards while the background is animating

These are secondary. The main win is still choosing the right background architecture.


What I would build first in this repo

1. Replace the current `#grid-main` gradient with a dedicated fixed background root in `HorizontalScroll.astro`.
2. Add two drifting nebula texture layers with CSS only.
3. Add one global star canvas behind the list.
4. Clamp DPR and pause on hidden tabs.
5. Ship that and profile before considering Pixi.

Expected result:
- very close to the official timeline mood
- animation that still leaves headroom for the card UI
- much lower risk than a fully procedural or DOM-heavy approach


What I would avoid

- `particles.js`-style DOM overlays
- per-card animated galaxy backdrops
- full procedural cloud shaders as the first implementation
- pointer-reactive parallax on every layer
- large blur filters updated every frame


Suggested asset pipeline

- Build the nebula art offline at larger-than-viewport size.
- Export AVIF first, WebP/PNG fallback if needed.
- Keep the star glow atlas tiny.
- Preload only the assets needed for the active layout.
- If using Pixi later, pre-decode textures before first render.


Research sources

Official / primary references
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN `content-visibility`: https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility
- MDN `mix-blend-mode`: https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
- MDN `createImageBitmap()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap
- MDN Page Visibility API: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- MDN `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- web.dev canvas performance: https://web.dev/articles/canvas-performance
- web.dev rendering performance: https://web.dev/articles/rendering-performance
- web.dev animation performance guide: https://web.dev/articles/animations-guide
- PixiJS performance tips: https://pixijs.com/8.x/guides/concepts/performance-tips
- PixiJS `ParticleContainer`: https://pixijs.com/8.x/guides/components/scene-objects/particle-container
- PixiJS textures guide: https://pixijs.com/8.x/guides/components/textures

Existing idea references
- Clouds: https://codepen.io/omarshe7ta/pen/xVeWWy
- Clouds: https://codepen.io/pat_hg/pen/VvRamN?editors=0010
- Pixi starfield: https://github.com/JVMartin/starfield
- CSS + SVG clouds: https://css-tricks.com/drawing-realistic-clouds-with-svg-and-css/
- CSS + SVG clouds demo: https://codepen.io/yuanchuan/pen/OBRrrO/f70a1f9435dc90197b253b26b4d69d42
- Pixi star warp: https://pixijs.io/examples/#/demos-advanced/star-warp.js
- Existing test pen: https://codepen.io/ThatGuySam/pen/RwQxXeK?editors=0010
- particles.js: https://github.com/VincentGarreau/particles.js/
- Stars demo: https://codepen.io/giana/pen/qbWNYy
- Floating dust: https://codepen.io/bob6664569/pen/rOzmve


Bottom line

For Marvel Order, the best path is:
- authored nebula textures for the expensive-looking part
- one global animated star layer for life
- layout-level mounting only
- canvas first, Pixi only if needed

That should get most of the official Marvel timeline feel without spending the frame budget that the listing UI needs.

One Safari-specific caveat: if the final implementation uses wheel listeners for desktop scroll smoothing, test it against WebKit's async scrolling behavior and prefer a positioned background layer over `background-attachment: fixed` if scrolling performance regresses.
