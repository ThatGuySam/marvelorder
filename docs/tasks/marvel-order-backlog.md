# Marvel Order Backlog

Captured from Apple Notes on March 12, 2026.

This document preserves backlog items, completed work, ideas, and references from the original notes. Some entries overlap and are intentionally repeated where they appeared in the source notes.

## User Feedback

- Spider-Man list
- Clicking an element makes it scroll to the page extremity, making it hard to click
- An element's info does not say if it is a movie or series
- An element's info does not say if it is a Marvel Studios production or something else
- There is no way to sort by chronological order instead of release order
- Global release date handling

## Open Tasks

- [ ] Try auto-merging titles that have same week and similar title
- [ ] Only show new listings if they are a month or older
- [ ] Remove Simpsons
- [ ] MCU Connected List
- [ ] Tags on listings
  - [ ] Studio
  - [ ] Movie or series
- [ ] Fix AMP `img` tag without `src`
  - [ ] jackpot - `marvelorder.com/stories/has-any-genres/`
  - [ ] https://search.google.com/test/amp?url=https%3A%2F%2Fmarvelorder.com%2Fstories%2Fhas-any-genres%2F
- [ ] Fix Ahrefs issues
  - [ ] https://app.ahrefs.com/site-audit/3762888/12/overview
- [ ] User feedback: Spider-Man list
- [ ] Try virtual scrolling to improve performance
  - [ ] https://github.com/nowaalex/af-utils
- [ ] Fix `/stories/multiverse-saga`
- [ ] Show human/seasonal dates on README
- [ ] Make column opening more consistent
- [ ] Show series/movie
- [ ] Show Marvel Studios or production house name
- [ ] Add on-page sorting
- [ ] Add Fandom content to strengthen endpoint content
- [ ] Add before and after links
- [ ] Show list picker in UI
- [ ] Disable day count when day is not part of date
- [ ] Ignore auto-prioritize more specific dates
- [ ] Add support for seasonal dates like `Summer 2023`
- [ ] Add support for seasons
- [ ] Fix Core Web Vitals not passing
  - [ ] Try using slots to load columns
  - [ ] Test by logging mounts
- [ ] Show image carousel
- [ ] Try Unhead
  - [ ] https://github.com/unjs/unhead
- [ ] Try Lenis for smoother scrolling
  - [ ] https://github.com/studio-freight/lenis
- [ ] Track Seen uses via Google Analytics
- [ ] Autosource fan art logos using TMDb IDs
- [ ] Delete missing listings
  - [ ] Check if listing is in JSON list
- [ ] Generate markdown list files from import filter names
- [ ] Also *not* endpoint
- [ ] Phase / timeline navigation at bottom
- [ ] Try adding Embed button to test interest
- [ ] Add rental/purchase links for `none`
- [ ] Rebuild logos
  - [ ] Cap 44
  - [ ] Spider-Man 77
  - [ ] Return of Hulk
  - [ ] Amazon Spider-Man 78
  - [ ] Dr Strange
  - [ ] Cap 79
  - [ ] Cap 79 2
  - [ ] Bride of Hulk
  - [ ] Frankenstein
  - [ ] Trial of Hulk
  - [ ] AoS Slingshot
  - [ ] Peter's To Do List
- [ ] Try Westures for multitouch
  - [ ] Pinch + scroll X
  - [ ] Maybe scale the row on the page
- [ ] Watch stats + Web Share
- [ ] Try function for DeviantArt + credit
  - [ ] https://www.deviantart.com/andrewvm/art/AVENGERS-6-SECRET-WARS-Teaser-Poster-Official-2025-923612592

## Completed Tasks

- [x] User feedback: fix not showing No Way Home
  - [x] https://marvelorder.com/marvel-cinematic-universe-movies-in-order/
- [x] Fix manual story updates getting reverted by action script
  - [x] https://github.com/ThatGuySam/marvelorder/commit/d254471b5daf3863ab7c612a5ad5f99f9aafbd51
- [x] Fix `<b>Unknown</b>`
  - [x] https://marvelorder.com/en/what-if-91363
- [x] Fix Action Deno type error
- [x] Try Thor web story and list
- [x] Add upcoming films and series to README
- [x] Add in-universe order to README
- [x] Let Aaron from Discord know
- [x] Add MCU spreadsheet credit
- [x] Merge in MCU spreadsheet data
- [x] Amazon affiliate links
- [x] Listings show days until for upcoming listings with specific dates
- [x] Fix provider links
- [x] Add Iron Man TAS
- [x] Add "The Marvel Superheroes"
- [x] Complete logos
- [x] Second Reddit post
- [x] Mark watched
- [x] Mark seen
- [x] Add Fanart and TMDb credit links
- [x] Howard the Duck
- [x] Classic Hulk
- [x] Spider-Man 78 TV show
- [x] Deadpool 1 & 2
- [x] Into the Spider-Verse
- [x] Generation X TV movie
- [x] Import TMDB lists
- [x] Scroll buttons
- [x] Ensure disabled pages do not render
  - [x] https://marvelorder.com/en/morbius-and-wong-981611/
- [x] Add to TMDb directory
- [x] Add Marvel disclaimer
- [x] Credit TMDb
- [x] Add padding to edges

## Ideas

- List analysis and breakdown videos on each respective listing

## Post Launch

- Preceding and succeeding listings
  - Movie
  - Show
  - All
- Show badges for respective tags on endpoints

## Kind of Marvel

- Men in Black
- Kingsman
- Denziman
- Sun Vulcan
- Kick-Ass

## Reference Links and Experiments

- Stars test
  - https://codepen.io/ThatGuySam/pen/wvyQaBO?editors=0100
- Type logo test
  - https://codepen.io/ThatGuySam/pen/rNJQaRx?editors=0100
- Cursor timeline UI idea
  - Reference image in Apple Notes
- CSS text shadows
  - https://codepen.io/juanbrujo/pen/DBKxxM?editors=0100
- Westures
  - `mvanderkamp/westures: Delightfully robust multitouch gestures for JavaScript`
