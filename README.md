# Mindful Reader

A calm RSS feed reader that respects your attention. No unread counts, no inbox pressure — just a few thoughtful articles each day.

Inspired by the philosophy of _listen, feel, breathe_ — Mindful Reader presents 3-5 articles daily with variety across your interests, tracks how much each feed actually impacts your thinking, and gently suggests when it's time to let a feed go.

## Features

- **Daily reading doses** — 3 articles at a time, drawn from across your categories
- **Impact ratings** — rate each article (None / Mild / Moderate / Strong) to track what resonates
- **Feed health** — automatic prompts to unsubscribe from feeds that aren't serving you
- **Reading notes** — capture thoughts while reading, view per-category, get AI summaries
- **AI-powered setup** — category and feed suggestions via Claude or ChatGPT (optional)
- **Insights dashboard** — daily impact trends and per-category breakdown
- **In-app reader** — read articles without leaving the app, with clean serif typography
- **RSS auto-discovery** — paste any website URL and the feed is found automatically

## Quick Start

```bash
npm install
npm run build
node server/index.js
```

Open [http://localhost:3008](http://localhost:3008) and follow the onboarding flow.

### Production (PM2)

```bash
npm run build
pm2 start ecosystem.config.js --only mindful-reader
```

## Tech Stack

| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend  | Express 5, Node.js (ES modules)       |
| State    | Zustand                               |
| Charts   | Recharts                              |
| RSS      | rss-parser                            |
| AI       | Anthropic Claude / OpenAI (optional)  |
| Storage  | JSON files in `local_data/`           |

## Configuration

**AI providers** — add an API key during onboarding or later in the feeds page. Supports Claude (Haiku 4.5) and ChatGPT (gpt-4o-mini). Without a key, curated fallback suggestions are used.

**DATA_DIR** — all data is stored in `local_data/` by default. Set the `DATA_DIR` environment variable to change the storage location (designed for future Electron packaging where `app.getPath('userData')` would be used).

**Port** — defaults to `3008`. Override with the `PORT` environment variable.

## Project Structure

```
src/                    # React frontend
  pages/                # Home (daily read), Feeds, Insights, Onboarding
  components/           # ArticleCard, ArticleReader, ImpactRating, Notes, etc.
  stores/               # Zustand stores (settings, feeds, articles)
  services/api.ts       # All API calls
  types/index.ts        # Shared TypeScript types

server/                 # Express backend
  router.js             # All API routes
  rss.js                # RSS fetching, parsing, auto-discovery
  ai.js                 # AI integration with fallbacks
  data.js               # JSON file read/write helpers
  config.js             # DATA_DIR and PORT configuration

local_data/             # Runtime data (gitignored)
  feeds.json            # Feed subscriptions
  articles.json         # Cached articles
  ratings.json          # Impact ratings
  settings.json         # User preferences and daily state
  notes.json            # Reading notes
  ai-config.json        # AI provider configuration
```

## Design Philosophy

- **No unread counts** — nowhere in the UI tells you how many articles are waiting
- **Intentional pacing** — you see 3 articles, read them, then choose whether to see more
- **Feed accountability** — low-impact feeds get flagged, encouraging curation over accumulation
- **Calm aesthetics** — stone colour palette, serif typography, generous whitespace

## License

MIT License. See [LICENSE](LICENSE) for details.

The source code is freely available. A packaged Mac App Store version may be offered as a commercial product in the future.
