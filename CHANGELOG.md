# Changelog

All notable changes to Mindful Reader will be documented in this file.

## [1.4.0] - 2026-04-18

### Added

- **Welcome quote** — a rotating mindful/reading quote (seeded by date) shown at the top of Home until the initial batch of 3 articles has all been read, then fades out for the rest of the day
- **Carryover logic** — on a new day, any unread articles from yesterday's selection are surfaced in today's initial 3, with fresh articles filling the remaining slots (one grace day only, tracked via a new `carriedAt` field on articles)
- **Robust stale-day detection** — `articleStore` now tracks `lastFetchDate`; Home triggers a refresh via `focus`, `visibilitychange`, and a 5-minute interval whenever the stored date is no longer today, so tabs that stay visible across midnight (pinned tabs, PWAs) still pick up the new day without a manual reload

## [1.3.0] - 2026-04-17

### Changed

- **Daily selection now fetches fresh RSS items from every active feed at the start of each day** — previously only fetched feeds that had zero cached articles, which caused the reading pool to stagnate over time as existing feeds exhausted their `presented: false` inventory. Dedup by URL means no re-served articles

### Added

- **"Check for new articles" button** on the Home page when all daily articles are read and the server reports no more available — invokes the top-up path to fetch fresh RSS items and extend today's selection with any unshown arrivals
- **`/api/daily/more` top-up** — when the current daily pool is exhausted, the endpoint re-runs selection (refresh + pick from unshown) and appends newly-selected article IDs to `dailyArticleIds`, so an active feed network never leaves you stuck on "That's all for today" while new posts exist

## [1.2.0] - 2026-04-15

### Added

- **Stale build detection** — amber banner in the UI (and server-side console warning) prompts `npm run restart:pm2` when files in `src/` or `server/` have changed since the last build; new `GET /api/build-status` endpoint and `.last-build` marker written by `npm run build`

## [1.1.0] - 2026-04-10

### Added

- **Notes system** — capture thoughts while reading, per-category notes with edit/delete, AI-powered summaries
- **Read state persistence** — articles marked as read survive page refreshes
- **PWA support** — favicon, manifest, apple-touch-icon for installable web app
- **Insights chart** — daily impact tracking with labeled scale (None/Mild/Moderate/Strong)
- **Feed impact bars** — visual impact indicators on feeds page with "No ratings yet" for unrated feeds
- **Auto-refresh on tab focus** — daily articles regenerate on new day when returning to the app
- **Category rename** — inline editing of category names on feeds page

### Fixed

- Daily articles no longer regenerate mid-day and wipe read progress
- Timezone bug: daily refresh now uses local date instead of UTC
- Articles no longer auto-appear when navigating between tabs (position-based batching)
- Onboarding feed failures now always show notification to user
- Duplicate featured images removed from article reader
- RSS auto-discovery with 15s budget and parallel path probing
- Font consistency: excerpts now use serif to match article reader

## [1.0.0] - 2026-04-06

### Added

- Core RSS reader with daily article selection (3 per batch, round-robin across categories)
- Impact rating system (0-3 scale: None, Mild, Moderate, Strong)
- Feed health tracking with gentle (3+) and strong (8+) low-impact warnings
- AI-powered onboarding: category suggestions and feed discovery (Claude or ChatGPT)
- Hardcoded fallback categories and feeds when no AI key configured
- In-app article reader with sanitized HTML content
- Feed management with max 5 feeds per category
- Insights page with impact trends and per-category breakdown
- RSS auto-discovery from website URLs
- Express 5 backend with JSON file storage
- Vite + React + TypeScript + Tailwind CSS frontend
- PM2 production deployment on port 3008
- DATA_DIR abstraction for future Electron packaging
