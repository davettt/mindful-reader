import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getFeeds,
  saveFeeds,
  getArticles,
  saveArticles,
  getRatings,
  saveRatings,
  getSettings,
  saveSettings,
  getNotes,
  saveNotes,
} from './data.js';
import { fetchFeed, validateFeedUrl } from './rss.js';
import {
  suggestCategories,
  suggestFeeds,
  tagArticles,
  generateInsight,
  summarizeNotes,
  getAIConfig,
  saveAIConfig,
  validateAIKey,
} from './ai.js';

const router = Router();

// ── Settings ──────────────────────────────────────────────

router.get('/api/settings', async (_req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

router.put('/api/settings', async (req, res) => {
  const current = await getSettings();
  const updated = { ...current, ...req.body };
  await saveSettings(updated);
  res.json(updated);
});

// ── Categories ────────────────────────────────────────────

router.get('/api/categories', async (_req, res) => {
  const settings = await getSettings();
  res.json(settings.categories || []);
});

router.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });

  const settings = await getSettings();
  if (settings.categories.includes(name)) {
    return res.status(409).json({ error: 'Category already exists' });
  }

  settings.categories.push(name);
  await saveSettings(settings);
  res.json({ categories: settings.categories });
});

router.put('/api/categories/:name', async (req, res) => {
  const { name } = req.params;
  const { newName } = req.body;
  if (!newName || !newName.trim()) return res.status(400).json({ error: 'New name required' });

  const trimmed = newName.trim();
  const settings = await getSettings();

  if (trimmed !== name && settings.categories.includes(trimmed)) {
    return res.status(409).json({ error: 'Category already exists' });
  }

  settings.categories = settings.categories.map((c) => (c === name ? trimmed : c));
  await saveSettings(settings);

  // Update all feeds in this category
  const feeds = await getFeeds();
  for (const feed of feeds) {
    if (feed.category === name) feed.category = trimmed;
  }
  await saveFeeds(feeds);

  // Update ratings too
  const ratings = await getRatings();
  for (const rating of ratings) {
    if (rating.category === name) rating.category = trimmed;
  }
  await saveRatings(ratings);

  // Update notes
  const notes = await getNotes();
  for (const note of notes) {
    if (note.category === name) note.category = trimmed;
  }
  await saveNotes(notes);

  res.json({ categories: settings.categories });
});

router.delete('/api/categories/:name', async (req, res) => {
  const { name } = req.params;
  const settings = await getSettings();
  settings.categories = settings.categories.filter((c) => c !== name);
  await saveSettings(settings);

  const feeds = await getFeeds();
  const remaining = feeds.filter((f) => f.category !== name);
  await saveFeeds(remaining);

  // Remove notes for deleted category
  const notes = await getNotes();
  const remainingNotes = notes.filter((n) => n.category !== name);
  await saveNotes(remainingNotes);

  res.json({ categories: settings.categories });
});

// ── Feeds ─────────────────────────────────────────────────

router.get('/api/feeds', async (_req, res) => {
  const feeds = await getFeeds();
  const ratings = await getRatings();

  const grouped = {};
  for (const feed of feeds) {
    if (!grouped[feed.category]) grouped[feed.category] = [];
    const feedRatings = ratings.filter((r) => r.feedId === feed.id);
    const avgImpact =
      feedRatings.length > 0
        ? feedRatings.reduce((sum, r) => sum + r.impact, 0) / feedRatings.length
        : null;
    const lowImpactCount = feedRatings.filter((r) => r.impact <= 1).length;

    grouped[feed.category].push({
      ...feed,
      avgImpact,
      totalRatings: feedRatings.length,
      lowImpactCount,
    });
  }

  res.json(grouped);
});

router.post('/api/feeds', async (req, res) => {
  const { url, category } = req.body;
  if (!url || !category) return res.status(400).json({ error: 'URL and category required' });

  const feeds = await getFeeds();
  const categoryFeeds = feeds.filter((f) => f.category === category);
  if (categoryFeeds.length >= 5) {
    return res.status(400).json({ error: 'Maximum 5 feeds per category' });
  }

  const validation = await validateFeedUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Use the discovered feed URL (may differ from input if auto-detected)
  const resolvedUrl = validation.feedUrl || url;

  const existing = feeds.find((f) => f.url === resolvedUrl);
  if (existing) {
    // If the feed exists but under a different category, move it
    if (existing.category !== category) {
      existing.category = category;
      await saveFeeds(feeds);
      return res.json(existing);
    }
    return res.status(409).json({ error: 'Feed already subscribed' });
  }

  const feed = {
    id: uuidv4(),
    url: resolvedUrl,
    title: validation.title,
    description: validation.description,
    siteUrl: validation.siteUrl,
    category,
    addedAt: new Date().toISOString(),
    active: true,
  };

  feeds.push(feed);
  await saveFeeds(feeds);

  // Fetch and store articles in background
  fetchAndStoreArticles(feed).catch((err) =>
    console.error(`Failed to fetch articles for ${feed.title}:`, err.message),
  );

  res.json(feed);
});

router.delete('/api/feeds/:id', async (req, res) => {
  const { id } = req.params;
  const feeds = await getFeeds();
  const remaining = feeds.filter((f) => f.id !== id);
  await saveFeeds(remaining);

  const articles = await getArticles();
  const remainingArticles = articles.filter((a) => a.feedId !== id);
  await saveArticles(remainingArticles);

  res.json({ success: true });
});

router.get('/api/feeds/:id/health', async (req, res) => {
  const { id } = req.params;
  const ratings = await getRatings();
  const feedRatings = ratings
    .filter((r) => r.feedId === id)
    .sort((a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime());

  const totalRatings = feedRatings.length;
  const avgImpact =
    totalRatings > 0 ? feedRatings.reduce((sum, r) => sum + r.impact, 0) / totalRatings : null;
  const lowImpactCount = feedRatings.filter((r) => r.impact <= 1).length;

  let healthStatus = 'good';
  if (lowImpactCount >= 8) healthStatus = 'poor';
  else if (lowImpactCount >= 3) healthStatus = 'declining';

  res.json({ avgImpact, totalRatings, lowImpactCount, healthStatus });
});

// ── Daily Articles ────────────────────────────────────────

router.get('/api/daily', async (_req, res) => {
  const settings = await getSettings();
  const today = localDateString();
  const feeds = await getFeeds();
  const activeFeeds = feeds.filter((f) => f.active);

  const isNewDay = settings.lastDailyRefresh !== today || !settings.dailyArticleIds?.length;

  if (isNewDay) {
    // Generate fresh daily selection for a new day
    const selected = await selectDailyArticles(settings);
    settings.dailyArticleIds = selected.map((a) => a.id);
    settings.dailyBatchIndex = 0;
    settings.lastDailyRefresh = today;
    await saveSettings(settings);
  }

  // Position-based: show articles 0..watermark from dailyArticleIds
  // Watermark only advances when user clicks "show more"
  const articles = await getArticles();
  const ratings = await getRatings();
  const batchSize = settings.dailyArticleCount || 3;
  const batchIndex = settings.dailyBatchIndex || 0;
  const watermark = (batchIndex + 1) * batchSize;

  const visibleIds = settings.dailyArticleIds.slice(0, watermark);
  const visibleArticles = visibleIds.map((id) => articles.find((a) => a.id === id)).filter(Boolean);

  const enriched = visibleArticles.map((article) => {
    const feed = feeds.find((f) => f.id === article.feedId);
    const rated = ratings.some((r) => r.articleId === article.id);
    return {
      ...article,
      feedTitle: feed?.title,
      feedCategory: feed?.category,
      readAt: article.readAt || null,
      rated,
    };
  });

  res.json({
    articles: enriched,
    hasMore: watermark < settings.dailyArticleIds.length,
    batchIndex,
  });
});

router.post('/api/daily/more', async (_req, res) => {
  const settings = await getSettings();
  const batchSize = settings.dailyArticleCount || 3;
  const newBatchIndex = (settings.dailyBatchIndex || 0) + 1;
  const start = newBatchIndex * batchSize;
  const end = (newBatchIndex + 1) * batchSize;

  // If the existing pool is exhausted, top up by re-running selection
  // (which fetches fresh items + picks only unshown articles).
  let dailyIds = settings.dailyArticleIds || [];
  if (start >= dailyIds.length) {
    const additional = await selectDailyArticles(settings);
    const existing = new Set(dailyIds);
    const newIds = additional.map((a) => a.id).filter((id) => !existing.has(id));
    dailyIds = [...dailyIds, ...newIds];
    settings.dailyArticleIds = dailyIds;
  }

  settings.dailyBatchIndex = newBatchIndex;
  await saveSettings(settings);

  const articles = await getArticles();
  const ratings = await getRatings();
  const feeds = await getFeeds();

  const batchIds = dailyIds.slice(start, end);
  const batchArticles = batchIds.map((id) => articles.find((a) => a.id === id)).filter(Boolean);

  const enriched = batchArticles.map((article) => {
    const feed = feeds.find((f) => f.id === article.feedId);
    const rated = ratings.some((r) => r.articleId === article.id);
    return {
      ...article,
      feedTitle: feed?.title,
      feedCategory: feed?.category,
      readAt: article.readAt || null,
      rated,
    };
  });

  res.json({
    articles: enriched,
    hasMore: end < dailyIds.length,
    batchIndex: newBatchIndex,
  });
});

// ── Single Article ────────────────────────────────────────

router.get('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const articles = await getArticles();
  const article = articles.find((a) => a.id === id);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  const feeds = await getFeeds();
  const feed = feeds.find((f) => f.id === article.feedId);
  const ratings = await getRatings();
  const rated = ratings.some((r) => r.articleId === id);
  res.json({
    ...article,
    feedTitle: feed?.title,
    feedCategory: feed?.category,
    rated,
  });
});

router.post('/api/articles/:id/read', async (req, res) => {
  const { id } = req.params;
  const articles = await getArticles();
  const article = articles.find((a) => a.id === id);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  if (!article.readAt) {
    article.readAt = new Date().toISOString();
    await saveArticles(articles);
  }

  res.json({ success: true });
});

// ── Ratings ───────────────────────────────────────────────

router.post('/api/rate', async (req, res) => {
  const { articleId, feedId, category, impact } = req.body;
  if (!articleId || !feedId || impact === undefined) {
    return res.status(400).json({ error: 'articleId, feedId, and impact required' });
  }

  const ratings = await getRatings();
  const existing = ratings.findIndex((r) => r.articleId === articleId);
  const rating = {
    id: existing >= 0 ? ratings[existing].id : uuidv4(),
    articleId,
    feedId,
    category: category || '',
    impact: Number(impact),
    ratedAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    ratings[existing] = rating;
  } else {
    ratings.push(rating);
  }

  await saveRatings(ratings);

  // Check feed health and return warning if needed
  const feedRatings = ratings.filter((r) => r.feedId === feedId);
  const lowImpactCount = feedRatings.filter((r) => r.impact <= 1).length;

  let warning = null;
  if (lowImpactCount >= 8) {
    warning = {
      level: 'strong',
      message: 'Consider unsubscribing — this feed rarely impacts you.',
    };
  } else if (lowImpactCount >= 3) {
    warning = {
      level: 'gentle',
      message: "This feed hasn't been resonating lately. Still want to keep it?",
    };
  }

  res.json({ rating, warning });
});

// ── Insights ──────────────────────────────────────────────

router.get('/api/insights', async (_req, res) => {
  const ratings = await getRatings();
  const settings = await getSettings();

  if (ratings.length === 0) {
    return res.json({ overall: [], byCategory: {}, trends: {} });
  }

  // Group ratings by day for finer granularity
  const dailyBuckets = {};
  for (const rating of ratings) {
    const key = rating.ratedAt.split('T')[0]; // YYYY-MM-DD
    if (!dailyBuckets[key]) dailyBuckets[key] = [];
    dailyBuckets[key].push(rating);
  }

  const overall = Object.entries(dailyBuckets)
    .map(([day, dayRatings]) => ({
      week: day, // keep field name for client compatibility
      avg: dayRatings.reduce((sum, r) => sum + r.impact, 0) / dayRatings.length,
      count: dayRatings.length,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Per-category breakdown
  const byCategory = {};
  for (const cat of settings.categories || []) {
    const catRatings = ratings.filter((r) => r.category === cat);
    if (catRatings.length === 0) continue;

    const avg = catRatings.reduce((sum, r) => sum + r.impact, 0) / catRatings.length;
    const sorted = [...catRatings].sort(
      (a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime(),
    );

    // Adaptive split: split in half so trend works even with few ratings
    let trend = 'insufficient';
    let recentAvg = avg;
    if (catRatings.length >= 4) {
      const half = Math.floor(catRatings.length / 2);
      const recent = sorted.slice(0, half);
      const older = sorted.slice(half);
      recentAvg = recent.reduce((sum, r) => sum + r.impact, 0) / recent.length;
      const olderAvg = older.reduce((sum, r) => sum + r.impact, 0) / older.length;

      trend = 'steady';
      if (recentAvg > olderAvg + 0.3) trend = 'improving';
      else if (recentAvg < olderAvg - 0.3) trend = 'declining';
    }

    byCategory[cat] = { avg, recentAvg, trend, totalRatings: catRatings.length };
  }

  // Generate AI insights for declining categories
  const insights = {};
  for (const [cat, data] of Object.entries(byCategory)) {
    if (data.trend === 'declining') {
      insights[cat] = await generateInsight(cat, data.avg, data.recentAvg);
    }
  }

  res.json({ overall, byCategory, insights });
});

// ── AI Config ─────────────────────────────────────────────

router.get('/api/ai/config', async (_req, res) => {
  const config = await getAIConfig();
  // Never send the full key to the frontend
  res.json({
    provider: config.provider,
    hasKey: !!config.apiKey,
    keyHint: config.apiKey ? `...${config.apiKey.slice(-4)}` : null,
  });
});

router.post('/api/ai/config', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'Provider and API key required' });
  }
  if (!['claude', 'openai'].includes(provider)) {
    return res.status(400).json({ error: 'Provider must be "claude" or "openai"' });
  }

  const validation = await validateAIKey(provider, apiKey);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  await saveAIConfig({ provider, apiKey });
  res.json({ success: true, provider });
});

router.delete('/api/ai/config', async (_req, res) => {
  await saveAIConfig({ provider: null, apiKey: null });
  res.json({ success: true });
});

// ── AI Suggestions ────────────────────────────────────────

router.post('/api/ai/suggest-categories', async (_req, res) => {
  const categories = await suggestCategories();
  res.json(categories);
});

router.post('/api/ai/suggest-feeds', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'Category required' });

  const suggestions = await suggestFeeds(category);
  res.json(suggestions);
});

// ── Notes ────────────────────────────────────────────────

router.get('/api/notes', async (req, res) => {
  const notes = await getNotes();
  const { category } = req.query;
  if (category) {
    return res.json(notes.filter((n) => n.category === category));
  }
  res.json(notes);
});

router.post('/api/notes', async (req, res) => {
  const { category, text, articleId, articleTitle } = req.body;
  if (!category || !text?.trim()) {
    return res.status(400).json({ error: 'Category and text required' });
  }

  const notes = await getNotes();
  const note = {
    id: uuidv4(),
    category,
    text: text.trim(),
    articleId: articleId || null,
    articleTitle: articleTitle || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.push(note);
  await saveNotes(notes);
  res.json(note);
});

router.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

  const notes = await getNotes();
  const note = notes.find((n) => n.id === id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  note.text = text.trim();
  note.updatedAt = new Date().toISOString();
  await saveNotes(notes);
  res.json(note);
});

router.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const notes = await getNotes();
  const remaining = notes.filter((n) => n.id !== id);
  await saveNotes(remaining);
  res.json({ success: true });
});

router.post('/api/notes/summarize', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'Category required' });

  const notes = await getNotes();
  const catNotes = notes.filter((n) => n.category === category);
  if (catNotes.length === 0) {
    return res.status(400).json({ error: 'No notes in this category' });
  }

  const summary = await summarizeNotes(category, catNotes);
  res.json({ summary });
});

// ── Feed Refresh ──────────────────────────────────────────

router.post('/api/feeds/refresh', async (_req, res) => {
  const feeds = await getFeeds();
  let totalNew = 0;

  for (const feed of feeds.filter((f) => f.active)) {
    try {
      const count = await fetchAndStoreArticles(feed);
      totalNew += count;
    } catch (err) {
      console.error(`Refresh failed for ${feed.title}:`, err.message);
    }
  }

  res.json({ refreshed: feeds.length, newArticles: totalNew });
});

// ── Helpers ───────────────────────────────────────────────

async function fetchAndStoreArticles(feed) {
  const feedData = await fetchFeed(feed.url);
  const articles = await getArticles();
  const existingUrls = new Set(articles.map((a) => a.url));

  let newArticles = feedData.items
    .filter((item) => !existingUrls.has(item.url))
    .map((item) => ({
      ...item,
      feedId: feed.id,
      fetchedAt: new Date().toISOString(),
      presented: false,
      presentedAt: null,
      tags: [],
    }));

  if (newArticles.length > 0) {
    newArticles = await tagArticles(newArticles, feed.category);
    articles.push(...newArticles);
    await saveArticles(articles);
  }

  return newArticles.length;
}

async function selectDailyArticles(settings) {
  const feeds = await getFeeds();
  const articles = await getArticles();
  const activeFeeds = feeds.filter((f) => f.active);

  if (activeFeeds.length === 0) return [];

  // Fetch fresh items from every active feed (dedup by URL in fetchAndStoreArticles)
  for (const feed of activeFeeds) {
    try {
      await fetchAndStoreArticles(feed);
    } catch (err) {
      console.error(`Failed to fetch ${feed.title}:`, err.message);
    }
  }

  const freshArticles = await getArticles();
  const categories = settings.categories || [];
  const selected = [];
  const usedFeedIds = new Set();

  // Phase 1: One article per feed, spread across categories (round-robin)
  const categoriesWithFeeds = categories.filter((cat) =>
    activeFeeds.some((f) => f.category === cat),
  );

  for (const cat of categoriesWithFeeds) {
    const catFeeds = activeFeeds
      .filter((f) => f.category === cat && !usedFeedIds.has(f.id))
      .sort(() => Math.random() - 0.5);

    for (const feed of catFeeds) {
      const unshown = freshArticles
        .filter((a) => a.feedId === feed.id && !a.presented)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      if (unshown.length > 0) {
        const article = unshown[0];
        article.presented = true;
        article.presentedAt = new Date().toISOString();
        selected.push(article);
        usedFeedIds.add(feed.id);
        break; // One per category in this phase
      }
    }
  }

  // Phase 2: Fill remaining feeds that weren't covered in phase 1
  for (const feed of activeFeeds) {
    if (usedFeedIds.has(feed.id)) continue;

    const unshown = freshArticles
      .filter((a) => a.feedId === feed.id && !a.presented)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    if (unshown.length > 0) {
      const article = unshown[0];
      article.presented = true;
      article.presentedAt = new Date().toISOString();
      selected.push(article);
      usedFeedIds.add(feed.id);
    }
  }

  await saveArticles(freshArticles);
  return selected;
}

function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;
