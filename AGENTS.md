# Repo Instructions

## Homepage And Timeline Data

- Prefer generalized signal-based rules over title-specific deny lists. Use metadata, provenance, release timing, company tags, genres, observation history, and description or overview fingerprints when filtering or deduping homepage cards.
- Treat duplicate markdown files and TMDB churn as time-series observations. Merge stronger observations together instead of trusting a single latest title string or letting empty frontmatter blank out a better upstream date.
- Prefer rules that generalize to unseen future titles. Exact title or id exceptions are a last resort and should live in a dedicated override layer with a source URL and verification date.
- Keep the render path offline-friendly. Reuse checked-in snapshots and generated artifacts at build time; live API traffic belongs in low-frequency sync scripts with pacing, backoff, and audit outputs.
