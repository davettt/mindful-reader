import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'MindfulReader/1.0',
  },
});

export async function fetchFeed(url) {
  const feed = await parser.parseURL(url);
  return {
    title: cleanTitle(feed.title || 'Untitled Feed'),
    description: feed.description || '',
    siteUrl: feed.link || url,
    items: (feed.items || []).slice(0, 10).map((item) => ({
      id: uuidv4(),
      title: item.title || 'Untitled',
      excerpt: stripHtml(item.contentSnippet || item.content || '').slice(0, 300),
      content: item['content:encoded'] || item.content || '',
      url: item.link || '',
      imageUrl: extractImage(item),
      publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    })),
  };
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(title) {
  return (
    title
      .replace(/\s*RSS\s*Feed\s*/i, '')
      .replace(/\s*RSS\s*$/i, '')
      .replace(/\s*Atom\s*Feed\s*/i, '')
      .replace(/\s*Feed\s*$/i, '')
      .trim() || title
  );
}

function extractImage(item) {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;

  const content = item['content:encoded'] || item.content || '';
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (match) return match[1];

  if (item['media:content'] && item['media:content'].$) {
    return item['media:content'].$.url;
  }

  return null;
}

// Common RSS feed path patterns to try (most likely first)
const COMMON_FEED_PATHS = [
  '/feed/',
  '/feed',
  '/rss/',
  '/rss',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/rss.xml',
  '/?feed=rss2',
  '/blog/feed/',
];

/**
 * Try to discover an RSS feed URL from a website URL.
 * Has a total time budget of 15 seconds to avoid stalling the UI.
 */
export async function discoverFeedUrl(url) {
  let baseUrl = url.trim();
  if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

  const deadline = Date.now() + 15000; // 15s total budget

  // Step 1: Try the URL directly as an RSS feed
  try {
    const feed = await parser.parseURL(baseUrl);
    if (feed.items && feed.items.length > 0) {
      return {
        found: true,
        feedUrl: baseUrl,
        title: cleanTitle(feed.title || 'Untitled Feed'),
        description: feed.description || '',
        siteUrl: feed.link || baseUrl,
      };
    }
  } catch {
    // Not a feed, continue discovery
  }

  if (Date.now() > deadline) return notFound(baseUrl, null);

  // Step 2: Fetch HTML and look for RSS link tags
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(baseUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MindfulReader/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();
      const linkPatterns = [
        /<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/gi,
        /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/rss\+xml["']/gi,
        /<link[^>]+type=["']application\/atom\+xml["'][^>]+href=["']([^"']+)["']/gi,
        /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/atom\+xml["']/gi,
      ];

      for (const pattern of linkPatterns) {
        if (Date.now() > deadline) return notFound(baseUrl, null);
        const match = pattern.exec(html);
        if (match && match[1]) {
          const feedUrl = resolveUrl(baseUrl, match[1]);
          try {
            const feed = await parser.parseURL(feedUrl);
            if (feed.items && feed.items.length > 0) {
              return {
                found: true,
                feedUrl,
                title: cleanTitle(feed.title || 'Untitled Feed'),
                description: feed.description || '',
                siteUrl: feed.link || baseUrl,
              };
            }
          } catch {
            // Link tag found but couldn't parse, keep trying
          }
        }
      }
    }
  } catch {
    // HTML fetch failed, try common paths
  }

  // Step 3: Try all common feed paths in parallel
  const origin = new URL(baseUrl).origin;
  const pathsToTry = COMMON_FEED_PATHS.map((path) => origin + path);
  const allResults = await Promise.allSettled(pathsToTry.map((p) => tryFeedPath(p)));

  for (const result of allResults) {
    if (result.status === 'fulfilled' && result.value) return result.value;
  }

  return notFound(baseUrl, pathsToTry);
}

async function tryFeedPath(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (feed.items && feed.items.length > 0) {
      return {
        found: true,
        feedUrl,
        title: cleanTitle(feed.title || 'Untitled Feed'),
        description: feed.description || '',
        siteUrl: feed.link || feedUrl,
      };
    }
  } catch {
    // Not a valid feed at this path
  }
  return null;
}

function notFound(baseUrl, triedPaths) {
  const origin = new URL(baseUrl).origin;
  const pathList = triedPaths
    ? triedPaths.map((p) => p.replace(origin, '')).join(', ')
    : '/feed, /rss, /feed.xml, etc.';
  return {
    found: false,
    triedUrl: baseUrl,
    error: `No RSS feed found at ${origin}. Tried: ${baseUrl} and paths: ${pathList}`,
  };
}

function resolveUrl(base, relative) {
  try {
    return new URL(relative, base).toString();
  } catch {
    return relative;
  }
}

export async function validateFeedUrl(url) {
  const discovery = await discoverFeedUrl(url);

  if (discovery.found) {
    return {
      valid: true,
      feedUrl: discovery.feedUrl,
      title: discovery.title,
      description: discovery.description,
      siteUrl: discovery.siteUrl,
    };
  }

  return { valid: false, error: discovery.error };
}
