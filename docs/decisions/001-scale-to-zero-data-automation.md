# ADR-001: Design data automation to scale to zero

## Status

Accepted

## Date

2026-07-27

## Context

Marvel Order is maintained with limited and irregular human attention. The
owner may not open the repository, inspect a pull request, or review a candidate
queue for months at a time.

The release catalog still needs to discover renamed and newly announced titles,
correct dates, and better logos. Its upstream sources can also be incomplete,
temporarily unavailable, contradictory, or vandalized. A conventional
automation design that creates review work merely moves maintenance from data
entry into an inbox.

For this project, "scale to zero" means:

- normal operation requires no recurring human review or approval
- the public site remains useful when every updater is idle or broken
- unattended updates are conservative, deterministic, and bounded
- uncertainty reduces freshness or coverage instead of corrupting public data
- returning after several months does not require clearing an accumulated
  operational queue

The static site and checked-in data already provide a useful foundation: the
render path can remain independent of live APIs, and Git history can retain an
audit trail without requiring a separate operational service.

## Decision

Design the release-data system for unattended convergence around a
last-known-good checked-in snapshot.

### 1. Human review is not part of the normal publication path

The scheduled workflow will discover, resolve, validate, and publish
high-confidence changes automatically. A pull request may be used as an
implementation detail when repository protection requires it, but it must
auto-merge after deterministic checks. It must not wait for a person.

### 2. Ambiguous data is suppressed, not queued

Low-confidence, conflicting, or suspicious observations remain non-public.
They are retained in a rolling machine-readable candidate snapshot and
re-evaluated on later runs as more evidence arrives.

Suppressed candidates are diagnostic state, not assigned work. Reports may
explain why a candidate was suppressed, but the system must not depend on
someone reviewing or resolving them.

### 3. Public data changes only through monotonic safety rules

An observation may automatically change a public field only when it is at
least as trustworthy as the selected value. In particular:

- empty upstream fields never erase meaningful values
- lower-precision dates never replace higher-precision dates without a
  stronger source
- title renames require stable media identity and sufficient corroboration
- logos carry across observations only within the same media identity
- a missing upstream record never deletes a public title by itself
- media identity is always namespaced by media type and external id

This deliberately favors false negatives over false positives.

### 4. Failed or anomalous runs preserve the last-known-good site

Fetching and resolution occur before any public artifact is replaced. The
workflow publishes only after the complete generated dataset passes schema,
duplicate, regression-budget, test, and build checks.

If a source times out, credentials expire, a parser breaks, or a change exceeds
the allowed blast radius, the workflow exits without changing public data.
Netlify continues to build and serve the previous checked-in snapshot.

### 5. The updater has a bounded blast radius

The workflow refuses the whole publication when changes exceed deterministic
budgets, including unexpected mass removals, date clearing, media-type flips,
duplicate canonical identities, or excessive title churn.

It does not partially publish a dataset whose consistency checks failed.

### 6. Observability is passive and bounded

Every run emits a concise summary and machine-readable audit artifact. Routine
successes require no notification. Repeated failures may produce a single
informational issue or notification, but that notification is not required to
keep the current site online.

Candidate and audit history uses bounded retention or rolling snapshots so
months of unattended operation do not create an ever-growing repository or
review backlog.

### 7. Runtime and dependency complexity stay small

The public build performs no live source fetches. Sync traffic belongs in the
scheduled workflow. Prefer one repository-owned Bun sync command, pinned
dependencies and actions, deterministic fixtures, conservative request pacing,
and no always-on database, queue, worker, or review application.

## Publication Approaches

### Preferred: validated direct data commit

The scheduled workflow checks out the latest default branch, generates all
artifacts in one run, validates the complete site, and commits only generated
data when every gate passes. Concurrency and an expected-head check prevent
racing another update.

This has the fewest moving parts and no pull-request lifecycle to maintain.

### Compatible alternative: automatically merged bot pull request

If branch protection requires pull requests, the workflow updates one
short-lived bot branch, runs the same checks, enables auto-merge, and deletes
the branch after merge. No review is requested and stale bot pull requests are
replaced rather than accumulated.

This provides a richer GitHub diff surface but adds token, trigger, and
auto-merge configuration that must itself remain healthy.

## Alternatives Considered

### Human-reviewed candidate pull requests

- Benefit: a person can adjudicate every uncertain change
- Cost: creates a recurring inbox and stops publishing when the owner is away
- Rejected: directly conflicts with scale-to-zero operation

### Publish every latest upstream value

- Benefit: maximum freshness and simple implementation
- Cost: transient omissions, title vandalism, duplicate ids, and source churn
  can immediately damage the public site
- Rejected: unattended operation requires conservative failure behavior

### Fetch live data during every site request or build

- Benefit: no generated snapshot to commit
- Cost: availability and correctness become coupled to upstream APIs,
  credentials, rate limits, and parser behavior
- Rejected: the site must remain useful when synchronization stops

### Keep all uncertain entries visible with warnings

- Benefit: broader coverage
- Cost: turns source noise into public noise and makes warnings permanent
  interface debt
- Rejected: uncertain additions should be absent until evidence improves

## Consequences

- The site may temporarily omit a legitimate new title or retain an older date
  when evidence is insufficient.
- Existing correct data remains durable through source outages and scraper
  regressions.
- New titles, title renames, dates, and logos with strong evidence can publish
  without owner involvement.
- Suppressed candidates can resolve themselves when later observations add
  corroboration.
- Git history and bounded audit artifacts provide evidence without creating a
  required review queue.
- External credential or source failures can reduce freshness indefinitely, but
  they do not take down or corrupt the public site.
- Rules and tests must be written against generalized signals and historical
  fixtures so they continue to handle unseen titles.

## Acceptance Criteria

The architecture satisfies this decision when:

- three months of successful scheduled runs require no human action
- three months of failed scheduled runs leave the last-known-good site usable
- no successful run can publish duplicate canonical media identities
- no single missing or empty upstream observation can remove good public data
- strong new titles, title changes, dates, and logos publish automatically
- ambiguous candidates remain non-public and do not accumulate as assigned work
- generated data, audit output, and Git history explain every automatic change
