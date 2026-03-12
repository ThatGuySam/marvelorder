# Astro Upgrade Plan

Research checked on March 12, 2026.

## Original Prompt

> I want you to make a plan to upgrade Astro. research common issues with upgrading and mitigations And then, considering the context of this repo, on how we're doing things, just build a plan to upgrade it.

## Goal

Upgrade the site from the current Astro 2.x setup to the current Astro 5 line with a reproducible Bun-based install, Netlify-compatible SSR behavior, and no regression in markdown-backed pages, framework islands, or `/admin`.

## Non-Goals

- Rewriting markdown content into content collections unless Astro 5 migration work makes that necessary.
- Broad type cleanup unrelated to Astro unless it blocks `bun run build` or the Astro major bump.
- Replacing Preact, React, Vue, or TinaCMS unless compatibility forces targeted changes.
- Redesigning routes, content structure, or data modeling.

## Repo Findings

- The root app is declared as `astro: 2.7.2` in `package.json`, but the installed dependency in `node_modules` is `astro: 2.10.15`. The declared version, lockfiles, and installed graph are already drifting.
- The repo is mid-migration from pnpm to Bun:
  - `packageManager` is `bun@1.2.15`
  - `bun.lock` is present
  - `pnpm-lock.yaml` still exists
  - Netlify and GitHub Actions were edited to run Bun commands
- `astro.config.ts` currently uses:
  - `output: 'hybrid'`
  - `netlifyFunctions(...)` from `@astrojs/netlify`
  - `@astrojs/preact`, `@astrojs/react`, `@astrojs/vue`, `@astrojs/tailwind`, `@astrojs/sitemap`
- The repo now imports a local sitemap shim from `src/integrations/compat-sitemap.ts`, and that shim reaches into `node_modules/@astrojs/sitemap/dist/*` internals. That is brittle across Astro and integration major upgrades.
- The codebase still uses older Astro patterns that are relevant to a v5 upgrade:
  - lowercase API route exports in `src/pages/api/tmdb-image/[...slug].ts` and `src/pages/api/fanart/[...slug].ts`
  - `Astro.glob()` in pages and components
  - Tailwind base CSS imports from `@astrojs/tailwind/base.css` and `@astrojs/tailwind/base.css?inline`
  - a legacy Netlify adapter API shape
- Framework surface area is unusually wide for a small site:
  - Preact is used for `src/components/RightSidebar/TableOfContents.tsx`
  - Vue is used for listing components
  - React is present for search and admin-related tooling
- `@astrojs/node` is declared in `package.json` but does not appear to be used in `astro.config.ts` or the source tree.
- Current baseline:
  - `bun run test --run` passes: 9 files, 39 tests
  - `bun run type-check` fails with existing Astro/TS errors in listing and story layouts/pages
  - `bun run build` fails before any Astro upgrade work with a prerender-time Preact hooks error originating from `src/components/RightSidebar/TableOfContents.tsx`

## External Research

| Common upgrade issue | Why it matters here | Mitigation |
| --- | --- | --- |
| Astro 4 removes lowercase API route method exports. | The repo still exports `get` in both API routes. | Rename route handlers to `GET` before or during the v4 step and smoke-test both endpoints locally and on a Netlify preview. |
| Astro 4 upgrades to Vite 5, and Astro 5 upgrades to Vite 6. | This repo depends on Vite-adjacent tooling (`vite-tsconfig-paths`, Tina admin assets, framework integrations, custom Vite config). | Treat dependency compatibility as a dedicated checkpoint. Upgrade Astro and Vite-sensitive packages together and verify `dev`, `build`, and `/admin` after each major boundary. |
| Astro 5 removes `output: 'hybrid'`. | `astro.config.ts` currently sets `output: 'hybrid'`. | Remove the `output: 'hybrid'` setting during the Astro 5 bump and validate that prerendered plus server-rendered behavior still matches current production expectations. |
| Astro 5 deprecates `Astro.glob()` in favor of `import.meta.glob()` or content collection queries. | The repo uses `Astro.glob()` across pages and components to discover markdown content. | Replace `Astro.glob()` with `import.meta.glob({ eager: true })` where practical during the upgrade. Keep content collections out of scope unless the migration uncovers a real blocker. |
| Current Astro Netlify docs use `import netlify from '@astrojs/netlify'` and `adapter: netlify()`. | The repo still uses `netlifyFunctions(...)`, which reflects an older adapter API. | Migrate `astro.config.ts` to the current adapter API during the Astro 5 bump, then verify `netlify dev`, build output, redirects, and runtime behavior. |
| Current Astro docs require Node `v22.12.0` or higher and do not support odd-numbered versions. | The repo pins Node `24.4.0`, which clears the floor but is newer than many ecosystem examples. | Keep Node 24 only if Astro, Netlify, and native dependencies stay green. If runtime issues appear, add a quick Node 22 CI check before changing production assumptions. |
| Tailwind’s current Astro guide centers on the `@tailwindcss/vite` plugin. | This repo still relies on `@astrojs/tailwind` and package-local Tailwind CSS imports. | Decide up front whether Tailwind migration is in scope. If yes, migrate styling entrypoints atomically and recheck story layouts and global head styles in the same PR. |

## Recommendation

Use a staged Astro 5 upgrade, not a single large dependency bump.

The repo is already red on `astro check` and `astro build`, and the package manager transition is still in flight. A one-shot upgrade would make it hard to distinguish existing failures from Astro regressions. The safer route is to first stabilize the Bun-based baseline, then land Astro compatibility changes in small, reviewable slices.

## Rollout Plan

### Stage 0: Stabilize the pre-upgrade baseline

- Decide whether the Astro upgrade will build on top of the current Bun migration changes or wait until those changes land separately.
- Make the dependency graph truthful:
  - sync `package.json`, lockfile, and installed packages
  - remove or justify unused `@astrojs/node`
  - decide whether `pnpm-lock.yaml` is transitional or should be deleted once Bun installs are reproducible
- Re-run and capture the baseline for:
  - `bun run test --run`
  - `bun run type-check`
  - `bun run build`
- Fix the current Preact prerender failure in `src/components/RightSidebar/TableOfContents.tsx` so `bun run build` is green before the Astro major bump.
- If full `astro check` cleanup is too wide, document the remaining non-upgrade type errors and keep them out of the Astro-upgrade scope.

### Stage 1: Apply compatibility refactors before the major bump

- Rename API route exports from `get` to `GET`.
- Audit `astro.config.ts` for settings that are known to change under Astro 5:
  - remove `output: 'hybrid'` when the v5 bump lands
  - replace `netlifyFunctions(...)` with the current Netlify adapter API
- Audit the local sitemap compatibility layer:
  - confirm why `src/integrations/compat-sitemap.ts` exists
  - remove it if current `@astrojs/sitemap` covers the need
  - otherwise rewrite it against public APIs instead of package-internal files
- Inventory every `Astro.glob()` usage and convert the straightforward cases to `import.meta.glob({ eager: true })`.
- Inventory every `@astrojs/tailwind/base.css` import and decide whether the Tailwind integration stays temporarily or is migrated during the Astro bump.
- Smoke-test representative pages on the current major before changing versions:
  - home page
  - one list page
  - one markdown-backed `/en/...` page
  - one `/stories/...` page

### Stage 2: Upgrade Astro and official integrations in order

- Move cleanly onto the latest Astro 2 patch if the lockfile is still behind the installed graph.
- Upgrade through the major guides in order:
  - Astro 3 guide
  - Astro 4 guide
  - Astro 5 guide
- Upgrade core and official integrations together:
  - `astro`
  - `@astrojs/netlify`
  - `@astrojs/preact`
  - `@astrojs/react`
  - `@astrojs/vue`
  - `@astrojs/sitemap`
  - `eslint-plugin-astro`
  - any Vite-sensitive packages that fail under Vite 5 or Vite 6
- Resolve config, typing, and rendering issues at each major boundary before moving to the next one.
- Keep Tailwind migration separate unless it becomes the only practical way to keep the upgrade moving.

### Stage 3: Validate Astro 5 runtime behavior

- Run full local validation:
  - `bun run test --run`
  - `bun run type-check`
  - `bun run build`
  - `bun run dev`
  - `bun run dev-netlify`
- Manually check:
  - `/`
  - `/marvel-cinematic-universe-in-timeline-order/`
  - one `/en/...` markdown-backed page
  - one `/stories/...` page
  - `/api/tmdb-image/...`
  - `/api/fanart/...`
  - `/admin`
- Confirm the Netlify build still packages the wink model files and markdown inputs needed by server functions.
- Verify client-side hydration for:
  - the Preact table of contents
  - Vue listing components
  - React-powered search or admin surfaces

### Stage 4: Cleanup and document the new baseline

- Remove stale package-manager artifacts and obsolete Astro comments/config left over from the v2-era setup.
- Update contributor-facing docs for the supported Bun, Node, and Astro workflow.
- Add a lightweight CI smoke gate if practical:
  - build
  - one SSR page render
  - one API route hit under Netlify-like local execution

## Validation Gates

- Must pass: `bun run test --run`
- Must pass: `bun run build`
- Should pass, or be documented as accepted carry-forward debt: `bun run type-check`
- Must smoke-test all three renderer surfaces in production-like output: Preact, Vue, React
- Must validate Netlify preview behavior for redirects and both API endpoints
- Must confirm `/admin` still loads the expected Tina assets

## Deliverables

- Astro 5-compatible dependency graph and lockfile
- Updated `astro.config.ts` aligned with the current Netlify adapter API
- Passing Bun-based build/test workflow
- A short follow-up note documenting any intentionally deferred work such as Tailwind modernization or unrelated type debt

## Risks And Open Questions

- The repo already has uncommitted Bun, Tina, and admin changes. Decide whether the Astro upgrade should branch from those changes or wait until they land separately.
- `astro check` is already red for reasons that do not look Astro-major-specific. Decide whether full type-check green is mandatory for this repo or whether documented carry-forward debt is acceptable.
- TinaCMS and the standalone `/admin` page may need extra work once Astro pulls Vite 6 into the tree.
- The local sitemap compatibility layer may fail immediately after the `@astrojs/sitemap` upgrade because it imports internal dist files rather than public APIs.
- If Tailwind migration is bundled into the Astro upgrade, the scope expands from framework upgrade to framework plus styling-toolchain modernization. That should be an explicit choice.
- Node 24 works in the current local environment, but if preview/runtime issues appear, test on Node 22 before changing deployment assumptions.

## Sources

- Astro v3 upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v3/
- Astro v4 upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v4/
- Astro v5 upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v5/
- Astro install and prerequisites: https://docs.astro.build/en/install-and-setup/
- Astro Netlify adapter docs: https://docs.astro.build/en/guides/integrations-guide/netlify/
- Tailwind CSS guide for Astro: https://tailwindcss.com/docs/installation/framework-guides/astro
