Input-Aware Parallax - Marvel Order


Goal

Add subtle parallax to the horizontal timeline with this behavior:
- smooth stepped scrolling for notched mouse wheels
- native scrolling for touchscreens
- native scrolling for precision devices like Mac trackpads
- one parallax system that does not fight the current scroll-snap timeline


Repo context

- The main horizontal timeline lives in [src/components/listing-row.vue](/Users/athena/Code/marvelorder/src/components/listing-row.vue).
- It already uses a horizontal overflow container plus `scroll-snap-type: x mandatory`.
- Buttons already call `scrollBy({ behavior: 'smooth' })`.

That means the clean design is:
- keep native scrolling as the default
- only smooth the discrete wheel path
- drive parallax from the actual scroll position, not directly from wheel deltas


Recommendation

Use a split model:

1. The timeline's real `scrollLeft` is the source of truth for parallax.
2. Wheel input is only used to decide whether to intervene in scrolling.
3. If the input looks like a notched wheel, convert it into short smooth programmatic horizontal steps.
4. If the input looks like a trackpad or touch gesture, do not intercept it.

This avoids double-smoothing on trackpads while still making coarse mouse-wheel scrolling feel more polished.


Why this matters

The platform does not expose a single reliable "this is a trackpad" flag.

What the platform does expose:
- `wheel` events fire for mice and trackpads.
- `WheelEvent.deltaMode` tells you whether the deltas are in pixels, lines, or pages.
- `pointer` and `any-pointer` only describe pointer accuracy, not "mouse vs trackpad."
- touch input can be kept native with `touch-action`.

So the safest approach is classification by event shape, not device sniffing.


What to use as the classifier

Strong signal for a notched wheel
- `event.deltaMode === WheelEvent.DOM_DELTA_LINE`
- `event.deltaMode === WheelEvent.DOM_DELTA_PAGE`

Strong signal for a precision device
- `event.deltaMode === WheelEvent.DOM_DELTA_PIXEL`
- small or fractional deltas
- highly variable delta sizes
- visible momentum / deceleration behavior

Default rule
- line/page deltas: treat as discrete wheel
- pixel deltas: treat as native precision scrolling unless repeated event samples clearly look discrete


Important distinction

Do not drive the parallax effect from `wheel` deltas.

Why:
- `wheel` does not always equal scroll
- wheel events can also represent zoom gestures
- the delta direction does not necessarily match final content movement

The parallax layer should read `scrollLeft` during `scroll` or in `requestAnimationFrame()`, then ease the background toward that value.


Recommended behavior by input type

Touchscreen
- keep native panning
- set `touch-action: pan-x pinch-zoom` on the horizontal scroller if custom gesture handling is introduced
- no JS smooth scrolling
- parallax follows actual scroll position only

Mac trackpad / precision scroll device
- keep native scrolling and momentum
- do not call `preventDefault()` on the wheel stream
- do not add extra smoothing on top
- parallax follows actual scroll position only

Notched mouse wheel
- intercept the wheel event on the row
- convert the wheel step into a horizontal pixel step
- animate the row toward a target scroll position with a short easing curve
- let parallax continue to follow actual `scrollLeft`


Why not rely on media queries alone

`pointer: fine` and `any-pointer: fine` are too broad for this decision.

They tell you the pointer is accurate enough to target small UI, but that can mean:
- mouse
- trackpad
- stylus-adjacent laptop setups

So they are good for layout defaults, but not for deciding whether to custom-smooth wheel input.


Best pattern for Marvel Order

Use two loops:

Loop 1: scrolling policy
- listens to `wheel`
- decides whether to leave the event alone or convert it to a smooth step

Loop 2: parallax policy
- listens to `scroll` or polls `scrollLeft` in `requestAnimationFrame()`
- eases the background toward `scrollLeft * parallaxRatio`

This keeps the background effect consistent across all input methods.


Suggested wheel classification heuristic

Good enough first pass:

1. Ignore wheel events that are not intended as scrolling.
2. If `deltaMode` is line or page, classify as discrete wheel.
3. If `deltaMode` is pixel, assume native precision scrolling.
4. Optional refinement:
   If pixel-mode events arrive in large, repeated, near-identical jumps with no momentum tail, treat them as discrete anyway.

Conservative is better here. It is safer to miss some wheel mice than to break trackpad scrolling.


Suggested implementation model

Programmatic smooth stepping for discrete wheels:

```ts
function onWheel(event: WheelEvent): void {
  if (event.ctrlKey) {
    return
  }

  if (!isDiscreteWheel(event)) {
    return
  }

  event.preventDefault()

  const row = rowEl.value
  if (!row) {
    return
  }

  const step = normalizeWheelStep(event)
  targetScrollLeft = clamp(
    targetScrollLeft + step,
    0,
    row.scrollWidth - row.clientWidth,
  )

  ensureScrollAnimation()
}
```

Parallax loop:

```ts
function tick(): void {
  const nextTarget = row.scrollLeft * 0.03
  renderedParallax += (nextTarget - renderedParallax) * 0.08
  backgroundEl.style.transform = `translate3d(${renderedParallax}px, 0, 0)`
  requestAnimationFrame(tick)
}
```

The key detail is that both native trackpad scroll and custom wheel smoothing eventually update the same `scrollLeft`, so the parallax code does not need separate device branches.


How to normalize wheel steps

For discrete wheel events:
- line mode: multiply by a tuned pixel value like `48` to `96`
- page mode: multiply by a fraction of the row width
- invert sign if needed to match the current horizontal direction mapping

For this specific UI, a good starting point is one half to three quarters of a card cluster per wheel notch, not one full screen.


How to keep it subtle

- keep parallax ratio low, around `0.02` to `0.05`
- move only the background layer, not the cards
- ease toward the target instead of matching it exactly
- do not attach parallax to pointermove on this page

The effect should read as atmosphere, not as a carousel gimmick.


Interaction with scroll snap

This page already uses scroll snap, so the custom wheel path should be short and controlled.

Recommended approach:
- move toward a target with a modest easing duration
- let the browser finish snap alignment naturally

Avoid long inertial JS animations that compete with snap logic.


Things to avoid

- global `scroll-behavior: smooth` as the whole solution
- intercepting every wheel event
- classifying by user agent
- classifying by `pointer: fine` alone
- deriving parallax from `deltaX` or `deltaY` instead of actual `scrollLeft`
- heavy work inside the wheel handler


Performance notes

- If you call `preventDefault()` on wheel events, the listener must be non-passive.
- Keep the wheel handler extremely small because cancelable wheel handlers can delay scrolling.
- Clamp derived `scrollLeft` values before using them for parallax.
- Safari can expose overscroll values, so the background transform should use clamped scroll bounds.
- WebKit notes that fixed backgrounds and wheel listeners can affect the fast async scrolling path on macOS, so any non-passive wheel listener should be attached only to the row, not to `window` or `document`.


What I would implement first in this repo

1. Add a wheel classifier on the row in [src/components/listing-row.vue](/Users/athena/Code/marvelorder/src/components/listing-row.vue).
2. Only intercept line/page wheel events.
3. Leave pixel-mode wheel events fully native.
4. Add one `requestAnimationFrame()` parallax loop on the layout-level background.
5. Keep touch input native with `touch-action: pan-x pinch-zoom` if needed.

That should give:
- smoother desktop wheel behavior for coarse mice
- untouched trackpad momentum
- untouched touch scrolling
- one background motion system that stays cheap


Research sources

Official / primary references
- MDN `wheel` event: https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
- MDN `WheelEvent`: https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
- MDN `WheelEvent.deltaMode`: https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
- MDN `scroll-behavior`: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
- MDN `Element.scrollBy()`: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollBy
- MDN `Element.scrollLeft`: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
- MDN `requestAnimationFrame()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- MDN `pointer`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer
- MDN `any-pointer`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/any-pointer
- MDN `touch-action`: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
- MDN `Navigator.maxTouchPoints`: https://developer.mozilla.org/docs/Web/API/Navigator/maxTouchPoints
- WebKit scrolling notes: https://trac.webkit.org/wiki/Scrolling
- WebKit scrolling on macOS notes: https://trac.webkit.org/wiki/WhatsChangingwithscrollingonmacOS


Bottom line

For Marvel Order, the right design is not "smooth scroll on desktop, native on mobile."

It is:
- smooth only the discrete wheel path
- leave precision and touch paths native
- make parallax read from actual scroll position for every device

That is the cleanest way to get subtle depth without breaking Mac trackpad behavior.
