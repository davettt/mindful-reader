# Changelog

All notable changes to Mindful Reader will be documented in this file.

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
