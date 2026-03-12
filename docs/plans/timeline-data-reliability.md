# Timeline Data Reliability Plan

Research checked on March 12, 2026.

## Original Prompt

> All right, I want you to plan out, maybe do some data experiments and plan out about doing a, like, make some fixes to this, the timeline and the entries that are getting rendered and show it up. I want to explore using semantic matching with embedding Gemma for the build process. and then I want to explore using just mathematical similarity algorithms to match titles. And then I want to explore using time series entries with the markdown. So treating the markdown as time series entries and then matching them that way and try to to get the correct most up-to-date data. and they just look through the look through the existing data and find the and create some tests for what's good what's good and what doesn't need to be duplicated and just the outputs. and then let's and then focus on the titles that have already been released so the data is very stable be sure to check online for Marvel release dates and movie entitled release dates to make sure you have the correct information. and then from there let's go through some ideas about the goal of this whole thing is to is for it to automatically update itself and be reliable anytime. times so it's like you can just keep keep on running and running and be a reliable source for people so put and then research that investigate that Let's get some data put together and put all that into a plan plan file

## Goal

Make the timeline and rendered entry pipeline reliable for already released Marvel titles by:

- removing duplicate or unstable title matches
- grounding release dates in authoritative sources instead of whichever source won the last merge
- treating markdown-backed data as a history of observations instead of one mutable truth blob
- adding repeatable tests and benchmark outputs so auto-updates can run safely

## Non-Goals

- Predicting unreleased schedules or solving future renames in this first pass.
- Replacing TMDB as a discovery source for every field in the repo.
- Redesigning the site UI or changing the overall listing experience.
- Shipping a mandatory ML runtime in every build before a deterministic baseline is green.

## Repo Findings

- `src/helpers/node/mcu-timeline-sheet.ts` and `src/helpers/node/in-universe-timeline.ts` both rely on substring title matching plus date matching.
- That date matching is weaker than it looks. `src/helpers/node/listing.ts#getYearAndMonth()` currently returns only the year, so the timeline matchers are effectively doing `same year + slug containment`, not year-month matching.
- Title matching logic is duplicated and inconsistent across:
  - `src/helpers/matching.ts`
  - `src/helpers/node/listing-files.ts`
  - `src/helpers/node/mcu-timeline-sheet.ts`
  - `src/helpers/node/in-universe-timeline.ts`
- `src/helpers/node/movies-fandom-timeline.ts` already turns scraped source content into normalized entry records, but its listing match step is still title-centric and not driven by canonical identity or source provenance.
- The public MCU release-order page at `src/pages/marvel-cinematic-universe-movies-in-order.astro` renders whatever survives filtering from the raw markdown catalog, so catalog duplicates or bad identity matches leak straight into the user-facing row.
- `scripts/pull.ts` currently treats the latest TMDB pull as current truth and, before this plan update, had no built-in pacing or exponential backoff for TMDB requests.
- The TMDB pull path also has no quarantine step for removals, spam edits, or sudden title churn. If a TMDB entry disappears or is renamed aggressively, the repo currently has no explicit audit to distinguish `real deletion` from `temporary source regression`.
- Current automated validation is not ready to guard this work:
  - `bun run test --run` currently fails in 8 suites because Vitest is not resolving the `~/` path aliases in tests.
  - Only `test/layout.test.ts` passed in the March 12, 2026 baseline run.

## Data Experiments

Local catalog audit on March 12, 2026:

- `386` markdown listing files under `src/pages/en/*.md`
- `329` listings with precise release dates on or before March 12, 2026
- `25` exact duplicate released-title groups
- `29` normalized duplicate released-title groups
- `14` duplicate released TMDB id groups
- `10` released listings where top-level frontmatter date disagrees with embedded TMDB date

Representative duplicate groups:

- Exact-title duplicates with different ids:
  - `Marvel's Daredevil` -> ids `1230445` and `61889`
  - `Marvel's Luke Cage` -> ids `1231494` and `62126`
  - `Marvel's Iron Fist` -> ids `1231499` and `62127`
  - `Marvel's The Punisher` -> ids `1230704` and `67178`
  - `I Am Groot` -> ids `209930` and `232125`
- Same-id duplicates spread across multiple markdown files:
  - id `980017` appears in three Doctor Strange Assembled variants
  - id `1001912` appears in three Ms. Marvel Assembled variants
  - id `964943` appears in three Moon Knight Assembled variants
  - id `1651` appears as both `Fantastic Four` and `The Fantastic Four`

Representative released date drifts:

- `Iron Man` frontmatter says `2008-05-02` while embedded TMDB says `2008-04-30`
- `Marvel Studios Assembled: The Making of Loki: Season 2` frontmatter says `2023-11-29`, embedded TMDB says `2023-11-22`, and official Disney+ press says `2023-11-09`
- `Voices Rising: The Music of Wakanda Forever` frontmatter says `2023-02-22` while embedded TMDB says `2023-02-28`

Current released-MCU matching experiment against `src/json/mcu-timeline-sheet.json`:

- `212` released ordered entries in the stored sheet snapshot
- `15` ambiguous matches when using the current year-plus-substring logic
- `158` unmatched entries because the sheet mixes films, series, promos, ads, and extras that the repo does not currently classify separately

Representative ambiguous matches:

- `Loki` matches both `Loki` and `The Making of Loki`
- `What If...?` matches the series plus two Assembled variants
- `Echo` matches `Echo` and `Marvel Studios Assembled: The Making of Echo`
- `Agatha` matches `Agatha All Along` and its Assembled variant

Released-title benchmark using existing `mcuTimelineOrder` assignments as a silver label set (`34` samples):

| Matcher | Top-1 accuracy |
| --- | --- |
| Current slug plus year matcher | `82.4%` |
| Normalized Levenshtein title-only | `73.5%` |
| Token Jaccard title-only | `73.5%` |
| Hybrid math score: title similarity plus date proximity | `97.1%` |

Interpretation:

- Pure title similarity is not enough on its own.
- A deterministic date-aware math score already beats the current matcher by a wide margin on stable released titles.
- Same-string duplicates and official-source conflicts still cannot be solved by title similarity alone, whether lexical or semantic.

Homepage cleanup experiment using the March 12 transcript as a `43`-check benchmark:

| Pipeline | Homepage cards | Transcript benchmark |
| --- | --- | --- |
| Raw homepage feed (`src/pages/index.astro` before cleanup) | `362` | `9 / 43` |
| Existing default filters only | `283` | `13 / 43` |
| Proposed homepage rules plus local snapshot tie-breaker | `208` | `43 / 43` |

Rule buckets that moved the benchmark without live API traffic:

- Local duplicate collapse:
  - same-id merge with `src/json/listings.json` title preference fixed `Agatha` -> `Agatha All Along`, `Avengers 5` -> `Avengers: Doomsday`, `Spider-Man 4` -> `Spider-Man: Brand New Day`, and `Spider-Man: Freshman Year` -> `Your Friendly Neighborhood Spider-Man`
  - a second canonical-title pass collapsed title-and-date duplicates such as `Marvel's The Punisher` and `What If...?`
- Homepage-only batch filters:
  - `4` alternate-cut cards dropped from terms like `more fun stuff version` and `in color`
  - `6` kids or LEGO cards dropped from terms like `lego`, `awesome friends`, `mightiest friends`, and `avengers team-up`
  - `6` `What If...?` episode cards dropped by treating non-canonical `What If... X?` titles as episode spillover, not homepage cards
  - updating the stale Groot episode filter to include the `September 6, 2023` season-2 shorts removed the leftover `I Am Groot` episode cards
  - `3` released low-confidence cards dropped because they had no description, no overview, `vote_average: 0`, and no current snapshot title
- Future-title confidence gate:
  - hide placeholder sequel names, `Untitled ...` placeholders, and snapshot-missing low-confidence TBA cards
  - preserve future cards only when they still look current enough to trust locally
  - in the March 12 catalog snapshot, that left `8` future or undated homepage cards: `Avengers: Doomsday`, `Avengers: Secret Wars`, `Blade`, `Armor Wars`, `Spider-Man: Beyond the Spider-Verse`, `Spider-Man: Brand New Day`, `VisionQuest`, and `Eyes of Wakanda`

Interpretation:

- The homepage can be cleaned up substantially without extra API traffic by reusing checked-in data and adding a thin homepage-specific policy layer.
- The most valuable tie-breaker for same-id title churn is the checked-in TMDB snapshot, not a fresh network request.
- Some future titles will still need manual or source-backed review, but the homepage should default to hiding low-confidence placeholders instead of surfacing them.

## External Research

Primary-source findings that materially change the plan:

| Source | Finding | Plan impact |
| --- | --- | --- |
| Google AI docs for EmbeddingGemma | EmbeddingGemma is a lightweight embedding model intended for local embedding workloads and integrates with Sentence Transformers, Ollama, and Transformers.js. | It is viable as an offline or cached build-time resolver, but it should not be the first or only matching layer. |
| Google Developer Blog on EmbeddingGemma | Google explicitly recommends the Gemini Embedding API for server-side use cases. | For this repo's Bun-based build, EmbeddingGemma should be optional and cached; do not make every CI build depend on a heavyweight semantic pass. |
| TMDB official rate-limit docs | TMDB says the old fixed `40 requests every 10 seconds` limit is disabled, but they still enforce upper limits around `40 requests per second`. | Keep the repo far below that ceiling anyway, add conservative pacing, and retry with exponential backoff on `429`, `5xx`, or transient failures. |
| Marvel official Iron Man page | `Iron Man` official release date is `May 2, 2008`. | The repo should prefer Marvel or studio release dates over TMDB for theatrical release truth. |
| Marvel official `I Am Groot` pages | Season 1 is `August 10, 2022`; Season 2 is `September 6, 2023`. | The repo needs canonical series-season identity, not a single title string for both sets of shorts. |
| Disney+ Press monthly schedule pages | Official Disney+ dates confirm several Assembled releases, including `Moon Knight` (`May 25, 2022`), `Doctor Strange in the Multiverse of Madness` (`July 8, 2022`), `Loki: Season 2` (`November 9, 2023`), `Echo` (`January 31, 2024`), `The Marvels` (`February 7, 2024`), `Secret Invasion` (`September 20, 2023`), and `Guardians of the Galaxy Vol. 3` (`September 6, 2023`). | Disney+ documentaries and specials need a different source hierarchy from theatrical films. |
| Marvel page plus article for `Voices Rising: The Music of Wakanda Forever` | Marvel pages say `February 28, 2023`. Disney+ Press says `February 22, 2023`. | Source conflicts are real even among official sources; the data model must retain provenance, conflict state, and manual resolution, not just a single scalar date. |

## Recommendation

Do not start with embeddings.

Start with a canonical identity and observation model, then add a single deterministic matcher with a math-based score. Add EmbeddingGemma only as a third-stage resolver for unresolved or low-confidence cases.

Why:

- The biggest current bug is not lack of semantics. It is weak identity discipline:
  - year-only date matching
  - duplicated title matching code
  - docs and promos competing with canonical releases
  - conflicting sources being flattened into one field
- TMDB should stay a discovery and enrichment source, not a delete-on-sight source of truth. A single missing or spam-altered TMDB record should create a quarantined diff, not an automatic public removal.
- The released-title benchmark already shows that title-plus-date math is enough to get close to production quality on stable titles.
- Embeddings will not solve same-title duplicates with identical or near-identical strings, and they will not solve official-source conflicts. Those need canonical ids, source ranking, and observation history.

## Proposed Data Model

### 1. Canonical entity

One canonical record per public title or season-level release target.

Suggested shape:

```ts
interface CanonicalReleaseEntity {
  canonicalId: string
  canonicalTitle: string
  mediaType: 'movie' | 'series' | 'season' | 'short' | 'special' | 'doc' | 'promo'
  franchiseGroup: 'mcu' | 'sony' | 'fox' | 'legacy' | 'other'
  tmdbId?: number
  marvelSlug?: string
  aliases: string[]
  activeObservationId?: string
  lockedFields?: string[]
}
```

### 2. Release observation

Treat markdown as time-series observations instead of storing one merged truth blob per page.

Suggested shape:

```ts
interface ReleaseObservation {
  observationId: string
  canonicalId?: string
  observedTitle: string
  observedReleaseDate: string
  observedMediaType?: string
  sourceKind: 'marvel' | 'disney_press' | 'tmdb' | 'sheet' | 'fandom' | 'manual'
  sourceUrl: string
  sourcePublishedAt?: string
  fetchedAt: string
  confidence: number
  status: 'accepted' | 'candidate' | 'conflicted' | 'superseded'
  notes?: string[]
}
```

### 3. Build artifact

Generate a canonical resolved index from observations:

- `src/generated/release-index.json`
- `src/generated/matching-report.json`
- `src/generated/source-conflicts.json`

The public pages should render from generated canonical data, not directly from raw observation pages.

## Rollout Plan

### Stage 1: Stabilize the baseline and add audit outputs

- Fix Vitest path alias resolution so the repo has a working test harness before matcher work begins.
- Add an audit script such as `scripts/audit-release-catalog.ts` that prints:
  - released title counts
  - duplicate id groups
  - duplicate normalized title groups
  - frontmatter-vs-TMDB date mismatches
  - ambiguous matcher outputs
- Add a TMDB regression audit that compares the previous snapshot to the latest pull and flags:
  - ids that disappeared from TMDB
  - movie-to-tv or tv-to-movie type flips
  - abrupt title changes after normalization
  - release dates that move backwards or become blank
  - obvious spam patterns or adult-flag flips
- Save one checked-in JSON snapshot for the released-title baseline so future work can show movement instead of anecdotes.
- Add a small allowlist for legitimate same-title distinct works across different eras, since exact title duplication alone is not always wrong.

### Stage 2: Create a single canonical matcher API

- Replace the ad hoc matcher spread across `matching.ts`, `listing-files.ts`, `mcu-timeline-sheet.ts`, and `in-universe-timeline.ts` with one matcher module.
- Fix date comparison first:
  - compare full ISO dates when available
  - otherwise compare year-month, not year-only
  - never let a title-only match override a hard date mismatch unless the source is explicitly marked uncertain
- Add deterministic filters before scoring:
  - separate docs, promos, specials, and extras from primary releases
  - require media-type compatibility where possible
  - block obvious false-positive prefixes such as `Assembled`, `Making of`, and promo-only titles from competing with canonical films and series
- Normalize TMDB identity churn before matching:
  - keep a stable normalized title fingerprint
  - keep the last accepted TMDB title as an alias, not just the latest title string
  - if TMDB removes or mutates a record, downgrade it to `candidate` or `conflicted` instead of deleting the canonical entity

### Stage 3: Land the math-based title scorer

- Implement a deterministic score using:
  - normalized edit similarity
  - token overlap or Jaccard
  - date proximity
  - media-type compatibility bonus or penalty
  - source-priority bonus or penalty
- Return both a chosen match and a confidence breakdown so the build can explain why a record won.
- Keep an ambiguity threshold:
  - if top two candidates are too close, emit a conflict instead of silently picking one
- Use this scorer as the default released-title matcher before any semantic layer is introduced.

### Stage 4: Pilot EmbeddingGemma as an optional third-stage resolver

- Add an experiment-only script that embeds only unresolved titles and aliases, not the entire catalog on every build.
- Cache embeddings by normalized input plus model version so repeated builds are cheap.
- Gate the feature behind an env var and keep the deterministic matcher as the production default.
- Evaluate EmbeddingGemma only on the unresolved subset:
  - title variants
  - franchise naming drift
  - legacy alternate branding
- Keep it only if it improves ambiguous or unresolved cases without increasing false positives.

### Stage 5: Move markdown to time-series observations

- Introduce an observation folder such as `src/data/release-observations/` with one markdown record per source observation.
- Store:
  - observed title
  - observed date
  - source URL
  - fetch date
  - confidence
  - canonical id if already known
- Stop treating the embedded TMDB block inside `src/pages/en/*.md` as the only historical record.
- Keep the public markdown page as the editorial surface for display text, links, and manual overrides, but derive release truth from resolved observations.

### Stage 6: Make auto-update safe

- Build a scheduled updater that:
  - fetches source observations
  - writes new observation records
  - resolves canonical entities
  - runs duplicate and benchmark checks
  - refuses to update public canonical output if conflicts exceed threshold
- Use a rate-aware TMDB client for all pull paths:
  - conservative minimum spacing between requests
  - exponential backoff with jitter
  - `Retry-After` support when present
  - no burst loops that can fire hundreds of requests in a few minutes
- Emit a machine-readable report for each run:
  - newly matched titles
  - unresolved titles
  - source conflicts
  - changed release dates
  - TMDB removals or churn events held for review
- Keep a manual review gate for:
  - official-source conflicts
  - same-title different-work collisions
  - renamed or rebranded projects
  - TMDB removals, spam edits, or suspicious title rewrites

## Validation Gates

- Must pass: fixed `bun run test --run`
- Must pass: catalog audit script with stable JSON output
- Must pass: no duplicate released TMDB ids outside an explicit allowlist
- Must pass: no ambiguous accepted matches on released titles shown in public MCU pages
- Must pass: the hybrid deterministic scorer matches or beats the current baseline and stays at or above the current `97%` silver-set top-1 target after the benchmark is cleaned up
- Must pass: timeline rendering outputs unique canonical ids, not just unique titles
- Must pass: no canonical title is deleted or unpublished from a single TMDB disappearance without a quarantine window or secondary source confirmation
- Must pass: TMDB pull logs show conservative pacing and successful backoff behavior under forced `429` or `5xx` tests
- Must surface, not silently collapse:
  - conflicting official release dates
  - low-margin matches
  - doc versus film or series collisions
  - TMDB removals and title-churn regressions

## Tests To Add

- `test/release-audit.test.ts`
  - verifies duplicate-id audit output
  - verifies released duplicate-title allowlist behavior
- `test/title-matcher-benchmark.test.ts`
  - runs the released-title benchmark and checks threshold scores
- `test/source-resolution.test.ts`
  - verifies source ranking for theatrical film, Disney+ doc, and conflicting official-source examples
- `test/tmdb-regression-audit.test.ts`
  - verifies missing ids become quarantined events instead of hard deletes
  - verifies suspicious title churn is surfaced after normalization
  - verifies adult-flag or media-type flips are reported
- `test/time-series-resolution.test.ts`
  - verifies latest accepted observation wins when sources agree
  - verifies conflict state is emitted when official sources disagree
- `test/timeline-rendering-uniqueness.test.ts`
  - verifies generated timeline rows do not contain duplicate canonical ids or duplicate rendered cards for the same canonical entity

## Deliverables

- One canonical matcher module used by timeline, in-universe, and entry-matching code paths
- Audit and benchmark scripts with checked-in baseline outputs for released titles
- Observation schema and generated canonical release index
- A source-priority policy for Marvel, Disney+ Press, TMDB, and manual overrides
- A rate-limited TMDB client with exponential backoff and removal-churn audit output
- Optional EmbeddingGemma experiment script with cached artifacts and a keep-or-drop decision

## Risks And Open Questions

- The repo has real same-title distinct works, so naive duplicate-title tests will create noise unless they are date- and franchise-aware.
- The current `mcuTimelineOrder` labels are useful as a silver benchmark, but not clean enough to serve as a perfect gold set without manual review.
- EmbeddingGemma may require Python or extra runtime tooling that does not fit the current Bun-only workflow cleanly. If that friction is high, keep semantic matching out of the main build and run it in a precomputed maintenance job.
- Official sources can disagree. `Voices Rising` is already a concrete example. The updater therefore needs provenance and conflict handling, not only ranking.
- TMDB can remove, merge, or spam-mutate records. If the pipeline trusts the latest TMDB response too much, it can accidentally unpublish a stable title or rewrite the canonical title with bad data.
- Same-id multi-file variants like the Assembled pages may reflect historical rename churn, but they also create public duplicate risk. Decide whether these collapse into aliases or stay as separate editorial pages that point to one canonical entity.
- Decide whether docs and promos should continue appearing in the same release/timeline systems as films and series, or whether they should move into a parallel content lane with separate matching rules.

## Sources

- https://ai.google.dev/gemma/docs/embeddinggemma
- https://developers.googleblog.com/en/introducing-embeddinggemma/
- https://developer.themoviedb.org/docs/rate-limiting
- https://www.marvel.com/shop/iron-man-movies
- https://www.marvel.com/amp/articles/tv-shows/i-am-groot-episode-posters-disney-plus
- https://www.marvel.com/tv-shows/i-am-groot/2
- https://press.disneyplus.com/news/next-on-disney-plus-may-2022
- https://press.disneyplus.com/news/next-on-disney-plus-july-2022
- https://press.disneyplus.com/news/next-on-disney-plus-september-2023
- https://press.disneyplus.com/news/next-on-disney-plus-november-2023
- https://press.disneyplus.com/news/next-on-disney-plus-january-2024
- https://press.disneyplus.com/news/next-on-disney-plus-february-2024
- https://press.disneyplus.com/news/next-on-disney-plus-february-2023
- https://www.marvel.com/articles/tv-shows/voices-rising-the-music-of-wakanda-forever-disney-plus
- https://www.marvel.com/tv-shows/voices-rising-the-music-of-wakanda-forever/1
