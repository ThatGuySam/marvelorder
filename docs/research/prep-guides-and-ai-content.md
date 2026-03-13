Prep Guides And AI Content Research - Marvel Order

As of March 12, 2026.


Context

- Marvel Order already has title pages under `src/pages/en/*.md`.
- It also has prep-guide-like content under [src/pages/stories/no-way-home-watch-list.md](/Users/athena/Code/marvelorder/src/pages/stories/no-way-home-watch-list.md) and related `stories/*.md` files.
- Those `stories/*.md` pages currently render through [src/layouts/list-story.astro](/Users/athena/Code/marvelorder/src/layouts/list-story.astro), which outputs AMP Web Stories, not long-form HTML guide pages.
- That matters because the best "what to watch before X" pages for search and sharing need to be:
  - crawlable
  - source-stamped
  - easy to update
  - obviously written by a human who understands the franchise


Executive Summary

- The best prep guides for Marvel Order should answer one exact viewer question fast:
  - `Do I need to watch this?`
  - `What is the shortest path?`
  - `What is the fuller path if I want more context?`
  - `What can I skip without being confused?`
- Google does not ban AI-assisted content, but it is explicit that scaled, low-value, search-first content is spam.
- The strongest source-backed AI workflow is:
  - human builds the source packet
  - AI helps with outlining, critique, reader simulation, and cleanup
  - human writes or decisively rewrites the published draft
  - human verifies every fact and source
- The highest-priority guide targets right now are:
  - Daredevil: Born Again | Season 2
  - Spider-Man: Brand New Day
  - VisionQuest
  - Avengers: Doomsday
- The best evergreen guide targets after that are:
  - Your Friendly Neighborhood Spider-Man | Season 2
  - X-Men '97 | Season 2
  - Spider-Man: Beyond the Spider-Verse
  - Avengers: Secret Wars


What A Good Prep Guide Looks Like For This Site

1. It solves a specific viewer job.

- Bad framing:
  - "Everything to know about X"
  - "All Marvel content ranked"
- Better framing:
  - `What to watch before Avengers: Doomsday`
  - `The shortest Daredevil catch-up before Born Again Season 2`
  - `Do you need to watch WandaVision before VisionQuest?`
  - `Spider-Man movies in order before Brand New Day`

2. It gives more than one route.

- One guide should usually include:
  - shortest path
  - fuller path
  - optional extras
- This is especially important for Marvel Order because the audience is split between:
  - people who want only the essentials
  - fans who want the complete franchise path
  - people who want spoiler-safe recommendations

3. Every inclusion should have a reason.

- Do not just list titles.
- Add one short sentence for each item:
  - what it sets up
  - which character it matters for
  - whether it is optional
  - what type of spoiler risk it carries

4. The guide should label continuity clearly.

- Marvel Order spans MCU, Sony, Fox, Netflix, Hulu, animation, and specials.
- Prep guides need plain-language labels like:
  - MCU core
  - MCU optional
  - Sony multiverse context
  - Netflix street-level context
  - alternate continuity

5. The guide needs a freshness signal.

- Add:
  - last verified date
  - source links
  - "current as of" note
- This matters because official sources can drift.
- Example:
  - Marvel's current movie page for `Avengers: Doomsday` says `December 18, 2026`.
  - An older March 26, 2025 Marvel article still says `May 1, 2026`.
- A prep guide without a verification stamp will age badly and lose trust.

6. It should be opinionated, but only where the opinion helps.

- Good opinions:
  - what is skippable
  - what is only for completists
  - what matters emotionally versus only lore-wise
  - what is safe for first-timers
- Bad opinions:
  - filler rankings with no user payoff
  - plot speculation presented as fact

7. It should make the next action obvious.

- At the top of the page:
  - one-sentence answer
  - shortest path block
  - estimated watch commitment
- Then:
  - fuller path
  - title-by-title explanations
  - internal links to the actual listing pages


Recommended Prep Guide Template

Use this shape for Marvel Order's first HTML guide pages.

- Title:
  - `What to Watch Before [Title]`
- One-sentence verdict:
  - `If you only watch three things, watch these.`
- Release note:
  - `Current as of March 12, 2026. [Title] is scheduled for...`
- Shortest path:
  - 3-6 titles
- Fuller path:
  - 6-12 titles
- Optional extras:
  - explicit completist branch
- Per-title notes:
  - 1-2 sentences each
- FAQ:
  - `Do I need to watch ...?`
  - `Can I skip ...?`
  - `Is this Sony/Fox/Netflix required or just bonus context?`
- Sources and update note


Source-Backed AI Dos And Don'ts

Google Search Central

- Google explicitly says generative AI can help with research and structure.
- Google is also explicit that using AI to create many pages without adding value can violate the scaled content abuse policy.
- Google's people-first content guidance maps almost perfectly onto prep guides:
  - original information
  - analysis
  - value beyond the obvious
  - trust signals
  - expertise and sourcing
- Google also says not to create pages that promise answers when the answer does not exist yet.
- For Marvel Order, that means:
  - okay: `What to watch before Spider-Man: Brand New Day`
  - not okay: `Brand New Day post-credit scenes explained` before the movie exists
  - okay: `What we know so far about Armor Wars`
  - not okay: `What to watch before Armor Wars` if Marvel still has not given a release date or clear production state

Hacker News

- HN is not an authority on search, but it is a useful read on how technical readers react to AI-written text.
- The recurring signals are:
  - AI is useful as a translator, editor, critic, and source-finder
  - low-context prompting produces fluff
  - published AI slop adds little value because readers could ask a model directly
  - overly polished AI cleanup often sounds sterile and less human than the original draft
- The strongest practical HN pattern for Marvel Order is:
  - use AI to shape and critique drafts
  - do not publish cached model output that adds no human judgment

Substack

- Ethan Mollick's One Useful Thing is the clearest Substack-backed pattern found.
- He states directly that he writes every post himself and only asks AI for feedback after a complete draft.
- His writing-tool posts recommend using AI as:
  - a writing coach
  - a reader simulator
  - a jargon finder
  - an analogy generator
  - a critic
- He explicitly does not recommend treating AI as just a better thesaurus or grammar checker, and he repeatedly keeps the human in charge of the actual rewrite.
- This is a strong fit for Marvel Order because prep guides need taste and sequencing judgment more than raw text generation.

Other sources

- AP's guidance is blunt:
  - do not use AI to create publishable content
  - treat AI output as unvetted source material
- AFP's guidance is similar:
  - AI can help research, summarize, translate, and suggest interview questions
  - it should not be relied on as an authoritative source
  - AFP social posts must be written by the author, not by chatbots
- Every's 2026 editorial writeup is the best practical modern workflow:
  - use AI for thesis checks, structure, jargon cleanup, style checks, and brainstorming
  - final quality bar is still:
    - is it true?
    - is it useful?
    - does it sound like a specific human?


Practical AI Workflow For Marvel Order

Recommended workflow for prep guides:

1. Human creates the source packet.

- Official title page
- Official Marvel article if there is a newer or conflicting date
- Existing Marvel Order title pages
- Relevant franchise pages already in the repo
- Optional:
  - public official synopsis or cast list
  - official Disney+ or studio page

2. AI helps with angle selection, not facts.

- Good AI jobs:
  - propose 3-5 guide angles
  - cluster likely user intents
  - generate FAQ questions
  - stress-test whether the shortest path is too long

3. Human picks the route and writes the thesis.

- The first paragraph should come from a human.
- The shortest path and the reasoning behind it should come from a human.

4. AI critiques the draft.

- Ask AI to act as:
  - a confused casual fan
  - a spoiler-sensitive first-timer
  - a completist who hates being told to skip things
- Use it to surface:
  - jargon
  - assumed knowledge
  - missing disclaimers
  - unclear reasoning

5. Human verifies every sentence tied to a fact.

- Release dates
- season numbers
- cast confirmations
- whether a title is actually connected or only fan-assumed

6. Human gives the page its final voice.

- Remove canned transitions.
- Rewrite generic phrasing.
- Add the one-line reasons that only a real fan/editor would write.


AI Do

- Do use AI after you have assembled verified sources.
- Do use AI to outline, critique, and compress.
- Do use AI to generate alternate headlines and FAQ prompts.
- Do use AI to simulate different reader types.
- Do use AI to spot unclear pronouns, jargon, passive voice, or repetitive phrasing.
- Do keep a human-authored source note and verification date on every prep guide.
- Do prefer one strong guide over ten lightly differentiated AI pages.

AI Don't

- Do not let AI decide canon, continuity, or importance on its own.
- Do not let AI invent release dates, casting, or connections.
- Do not mass-produce "what to watch before" pages for every rumor or placeholder title.
- Do not publish AI copy that sounds like generalized fandom sludge.
- Do not use AI as a substitute for reading the actual source pages.
- Do not quietly change dates or major guide recommendations without substantive edits.
- Do not create pages that answer questions that even Marvel has not answered yet.


Current Upcoming-Title Backlog

Important note on source freshness:

- Marvel's broad TV and movie landing pages can lag individual title pages or articles.
- Example:
  - Marvel's TV landing page still lists `Wonder Man` under `2026`.
  - But Marvel articles published January 27, 2026 and March 4, 2026 say all eight episodes are already streaming.
- For guide work, prefer:
  - title-level pages
  - newer official articles
  - then broader landing pages

Write Now: Highest urgency

- Daredevil: Born Again | Season 2
  - Official status: Marvel title page says `March 24, 2026`.
  - Repo page: [daredevil-born-again-202555.md](/Users/athena/Code/marvelorder/src/pages/en/daredevil-born-again-202555.md)
  - Why now:
    - As of March 12, 2026, release is in 12 days.
  - Best guide angles:
    - `What to watch before Daredevil: Born Again Season 2`
    - `The shortest Daredevil catch-up before Born Again Season 2`
    - `Do you need to watch Netflix Daredevil before Born Again Season 2?`
  - Core path candidates:
    - Daredevil Season 1
    - Daredevil Season 2
    - The Defenders
    - Daredevil Season 3
    - Daredevil: Born Again Season 1
  - Optional branch:
    - Echo
    - The Punisher
    - Jessica Jones if the page needs broader street-level context

- Spider-Man: Brand New Day
  - Official status: Marvel movie page says `July 31, 2026`.
  - Repo page: [spider-man-brand-new-day-969681.md](/Users/athena/Code/marvelorder/src/pages/en/spider-man-brand-new-day-969681.md)
  - Best guide angles:
    - `What to watch before Spider-Man: Brand New Day`
    - `The shortest Tom Holland Spider-Man catch-up`
    - `Spider-Man movies in order before Brand New Day`
  - Core path candidates:
    - Captain America: Civil War
    - Spider-Man: Homecoming
    - Avengers: Infinity War
    - Avengers: Endgame
    - Spider-Man: Far From Home
    - Spider-Man: No Way Home
  - Optional branch:
    - Tobey and Andrew Spider-Man films for multiverse context
    - Daredevil / street-level context only if Marvel confirms deeper connection

- VisionQuest
  - Official status: Marvel title page says `2026`; NYCC 2025 article says it arrives on Disney+ in `2026`.
  - Repo page: [visionquest-213375.md](/Users/athena/Code/marvelorder/src/pages/en/visionquest-213375.md)
  - Best guide angles:
    - `What to watch before VisionQuest`
    - `Do you need to watch WandaVision before VisionQuest?`
    - `The WandaVision -> Agatha -> VisionQuest path`
  - Core path candidates:
    - Avengers: Age of Ultron
    - Captain America: Civil War
    - Avengers: Infinity War
    - WandaVision
    - Agatha All Along
  - Optional branch:
    - Avengers: Endgame for Vision/Wanda aftermath

- Avengers: Doomsday
  - Official status: current Marvel movie page says `December 18, 2026`.
  - Repo page: [avengers-doomsday-1003596.md](/Users/athena/Code/marvelorder/src/pages/en/avengers-doomsday-1003596.md)
  - Best guide angles:
    - `What to watch before Avengers: Doomsday`
    - `The shortest MCU path to Avengers: Doomsday`
    - `Do you need to watch the X-Men movies before Avengers: Doomsday?`
    - `What to watch before Avengers: Doomsday if you skipped the Disney+ shows`
  - Core path candidates:
    - The Avengers
    - Avengers: Age of Ultron
    - Avengers: Infinity War
    - Avengers: Endgame
    - Captain America: Brave New World
    - Thunderbolts*
    - The Fantastic Four: First Steps
  - Optional branches:
    - Loki
    - WandaVision / Doctor Strange in the Multiverse of Madness
    - Deadpool & Wolverine
    - X-Men legacy branch

Build Now, Update As Dates Firm Up

- Your Friendly Neighborhood Spider-Man | Season 2
  - Official status: Marvel title page says `Fall 2026`.
  - Repo page: [your-friendly-neighborhood-spider-man-138503.md](/Users/athena/Code/marvelorder/src/pages/en/your-friendly-neighborhood-spider-man-138503.md)
  - Best guide angles:
    - `What to watch before Your Friendly Neighborhood Spider-Man Season 2`
    - `Do you need any MCU movies before Your Friendly Neighborhood Spider-Man?`
  - Core path candidates:
    - Season 1
    - optional prequel comic tie-in if the site expands into comics guides
  - Important note:
    - This is a continuity-separation page. The guide should explain that this is not required MCU homework.

- X-Men '97 | Season 2
  - Official status: current Marvel pages show `2026`.
  - Repo page: [x-men-97-138502.md](/Users/athena/Code/marvelorder/src/pages/en/x-men-97-138502.md)
  - Best guide angles:
    - `What to watch before X-Men '97 Season 2`
    - `The shortest X-Men: The Animated Series catch-up before X-Men '97`
  - Core path candidates:
    - a curated episode list from the 1990s animated series
    - X-Men '97 Season 1
  - Important note:
    - This is a good guide to prove Marvel Order can handle episode-level prep later, but the first version can stay season-level plus "must-watch episodes."

- Spider-Man: Beyond the Spider-Verse
  - Official status: Marvel's April 2025 CinemaCon article says `June 4, 2027`.
  - Repo page: [spider-man-beyond-the-spider-verse-911916.md](/Users/athena/Code/marvelorder/src/pages/en/spider-man-beyond-the-spider-verse-911916.md)
  - Best guide angles:
    - `What to watch before Spider-Man: Beyond the Spider-Verse`
    - `The Spider-Verse watch order`
  - Core path candidates:
    - Spider-Man: Into the Spider-Verse
    - Spider-Man: Across the Spider-Verse
  - Optional branch:
    - broader live-action Spider-Man multiverse explainer

- Avengers: Secret Wars
  - Official status: current Marvel movie page says `December 17, 2027`.
  - Repo page: [avengers-secret-wars-1003598.md](/Users/athena/Code/marvelorder/src/pages/en/avengers-secret-wars-1003598.md)
  - Best guide angles:
    - `What to watch before Avengers: Secret Wars`
    - `The shortest multiverse path to Secret Wars`
  - Important note:
    - This should be a living guide, not a frozen one.
    - It will likely need major updates after `Avengers: Doomsday` and after more official cast or plot signals arrive.

Watchlist Only: Do not make priority prep guides yet

- Armor Wars
  - Official status:
    - Marvel still has the 2022 theatrical-shift article.
    - The current Marvel movie page exists, but the public snippet shows no release date.
  - Repo page: [armor-wars-1030022.md](/Users/athena/Code/marvelorder/src/pages/en/armor-wars-1030022.md)
  - Recommendation:
    - good candidate for a living explainer
    - not a priority `what to watch before` page yet

- Blade
  - Official status:
    - older Marvel schedule article gave it `November 7, 2025`, but that is stale and no longer useful as a current prep target
  - Recommendation:
    - keep as a watchlist topic until Marvel publishes a fresh official date or production update


Recommended Publishing Order

1. `What to watch before Daredevil: Born Again Season 2`
2. `What to watch before Spider-Man: Brand New Day`
3. `What to watch before VisionQuest`
4. `What to watch before Avengers: Doomsday`
5. `What to watch before Your Friendly Neighborhood Spider-Man Season 2`
6. `What to watch before X-Men '97 Season 2`
7. `What to watch before Spider-Man: Beyond the Spider-Verse`
8. `What to watch before Avengers: Secret Wars`


Sources

Google Search Central

- Google Search's guidance on using generative AI content on your website:
  https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Creating helpful, reliable, people-first content:
  https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Spam policies for Google web search:
  https://developers.google.com/search/docs/essentials/spam-policies

Hacker News

- Writing with LLM is like doing a mapping from human prompt -> document:
  https://news.ycombinator.com/item?id=44798932
- AI generated web content has got to be one of the most counterproductive things...:
  https://news.ycombinator.com/item?id=44226230
- Don't post generated/AI-edited comments. HN is for conversation between humans:
  https://news.ycombinator.com/item?id=47340079

Substack

- One Useful Thing about page:
  https://www.oneusefulthing.org/about
- Embracing weirdness: What it means to use AI as a (writing) tool:
  https://www.oneusefulthing.org/p/embracing-weirdness-what-it-means
- An Opinionated Guide to Using AI Right Now:
  https://www.oneusefulthing.org/p/an-opinionated-guide-to-using-ai

Other sources

- AP standards around generative AI:
  https://www.ap.org/the-definitive-source/behind-the-news/standards-around-generative-ai/
- AFP editorial standards and best practices:
  https://www.afp.com/communication/afp_ethic_February_2025.pdf
- Every editorial AI workflows:
  https://every.to/p/this-is-how-the-every-editorial-team-uses-ai
- Every on context engineering and hollow AI prose:
  https://every.to/p/how-to-make-ai-write-less-like-ai

Official Marvel and studio slate sources

- Marvel TV landing page:
  https://www.marvel.com/tv-shows
- Daredevil: Born Again | Season 2:
  https://www.marvel.com/tv-shows/daredevil-born-again/2
- VisionQuest:
  https://www.marvel.com/tv-shows/visionquest/1
- VisionQuest NYCC announcement:
  https://www.marvel.com/articles/tv-shows/marvel-television-visionquest-concludes-wandavision-trilogy-new-york-comic-con-2025
- Your Friendly Neighborhood Spider-Man | Season 2:
  https://www.marvel.com/tv-shows/animation/your-friendly-neighborhood-spider-man/2
- X-Men '97 pages showing Season 2:
  https://www.marvel.com/tv-shows/x-men-97/1
- Avengers: Doomsday:
  https://www.marvel.com/movies/avengers-doomsday
- Spider-Man: Brand New Day:
  https://www.marvel.com/movies/spider-man-brand-new-day
- Spider-Man: Brand New Day and Spider-Man: Beyond the Spider-Verse CinemaCon article:
  https://www.marvel.com/articles/movies/spider-man-brand-new-day-title-spider-man-beyond-the-spider-verse-unveiled-first-look-cinemacon-2025
- Avengers: Secret Wars:
  https://www.marvel.com/movies/avengers-secret-wars
- Armor Wars title page:
  https://www.marvel.com/movies/armor-wars
- Armor Wars theatrical shift article:
  https://www.marvel.com/articles/movies/armor-wars-theatrical-release-don-cheadle
- Wonder Man now-streaming confirmation:
  https://www.marvel.com/articles/tv-shows/marvel-television-wonder-man-first-episode-streaming-free
