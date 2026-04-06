import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { readJSON, writeJSON } from './data.js';

// ── AI Config (stored in local_data/ai-config.json) ──────

let cachedConfig = null;

export async function getAIConfig() {
  if (!cachedConfig) {
    cachedConfig = (await readJSON('ai-config.json')) || {
      provider: null,
      apiKey: null,
    };
  }
  return cachedConfig;
}

export async function saveAIConfig(config) {
  cachedConfig = config;
  await writeJSON('ai-config.json', config);
}

export async function validateAIKey(provider, apiKey) {
  try {
    if (provider === 'claude') {
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      return { valid: true };
    } else if (provider === 'openai') {
      const client = new OpenAI({ apiKey });
      await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }],
      });
      return { valid: true };
    }
    return { valid: false, error: 'Unknown provider' };
  } catch (err) {
    return { valid: false, error: err.message || 'Invalid API key' };
  }
}

// ── Unified AI call ──────────────────────────────────────

async function callAI(prompt, systemPrompt) {
  const config = await getAIConfig();
  if (!config.provider || !config.apiKey) return null;

  try {
    if (config.provider === 'claude') {
      const client = new Anthropic({ apiKey: config.apiKey });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      return parseJSON(text);
    } else if (config.provider === 'openai') {
      const client = new OpenAI({ apiKey: config.apiKey });
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      });
      const text = response.choices[0]?.message?.content || '';
      return parseJSON(text);
    }
    return null;
  } catch (err) {
    console.error('AI call failed:', err.message);
    return null;
  }
}

function parseJSON(text) {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      /* fall through */
    }
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {
      /* fall through */
    }
  }
  return null;
}

// ── Fallback data ────────────────────────────────────────

const FALLBACK_CATEGORIES = [
  { name: 'Minimalism', description: 'Living with less, intentional possessions' },
  { name: 'Mindfulness', description: 'Present-moment awareness, meditation, calm' },
  { name: 'Slow Living', description: 'Unhurried lifestyle, savouring simple moments' },
  { name: 'Self-Improvement', description: 'Personal growth, habits, and meaningful change' },
  { name: 'Creativity', description: 'Art, writing, making things by hand' },
  { name: 'Simple Living', description: 'Frugality, homesteading, back to basics' },
  { name: 'Wellness', description: 'Physical and mental health, movement, rest' },
  { name: 'Intentional Tech', description: 'Thoughtful relationship with technology' },
];

const FALLBACK_FEEDS = {
  Minimalism: [
    { name: 'No Sidebar', url: 'https://nosidebar.com/feed/', description: 'Living with less' },
    {
      name: 'Becoming Minimalist',
      url: 'https://www.becomingminimalist.com/feed/',
      description: 'Inspiring others to live more by owning less',
    },
    {
      name: 'The Minimalists',
      url: 'https://www.theminimalists.com/feed/',
      description: 'Less is now',
    },
  ],
  Mindfulness: [
    {
      name: 'Plum Village',
      url: 'https://plumvillage.org/feed/',
      description: "Mindfulness practices from Thich Nhat Hanh's tradition",
    },
    {
      name: 'Tiny Buddha',
      url: 'https://tinybuddha.com/feed/',
      description: 'Simple wisdom for complex lives',
    },
    {
      name: 'Mindful',
      url: 'https://www.mindful.org/feed/',
      description: 'Healthy mind, healthy life',
    },
  ],
  'Slow Living': [
    {
      name: 'Slow Your Home',
      url: 'https://www.slowyourhome.com/feed/',
      description: 'Slowing down in a fast world',
    },
    {
      name: 'Reading My Tea Leaves',
      url: 'https://readingmytealeaves.com/feed',
      description: 'Small space, slow living',
    },
    {
      name: 'A Considered Life',
      url: 'https://www.aconsideredlife.co.uk/feeds/posts/default?alt=rss',
      description: 'Intentional and considered living',
    },
  ],
  'Self-Improvement': [
    {
      name: 'James Clear',
      url: 'https://jamesclear.com/feed',
      description: 'Atomic habits and continuous improvement',
    },
    {
      name: 'Mark Manson',
      url: 'https://markmanson.net/feed',
      description: "Life advice that doesn't suck",
    },
    {
      name: 'The Marginalian',
      url: 'https://www.themarginalian.org/feed/',
      description: 'Cross-pollinating science, art, philosophy',
    },
  ],
  Creativity: [
    {
      name: 'Austin Kleon',
      url: 'https://austinkleon.com/feed/',
      description: 'Steal like an artist',
    },
    {
      name: 'The Creative Independent',
      url: 'https://thecreativeindependent.com/feed/',
      description: 'Emotional and practical guidance for creatives',
    },
    {
      name: 'Colossal',
      url: 'https://www.thisiscolossal.com/feed/',
      description: 'Art, design, and visual culture',
    },
  ],
  'Simple Living': [
    {
      name: 'Rowdy Kittens',
      url: 'https://rowdykittens.com/feed/',
      description: 'Small house, big life',
    },
    {
      name: 'Be More with Less',
      url: 'https://bemorewithless.com/feed/',
      description: 'Simplify everything',
    },
    {
      name: 'Miss Minimalist',
      url: 'https://www.missminimalist.com/feed/',
      description: 'Living on less',
    },
  ],
  Wellness: [
    {
      name: 'Well + Good',
      url: 'https://www.wellandgood.com/feed/',
      description: 'Healthy lifestyle guidance',
    },
    {
      name: 'Greatist',
      url: 'https://greatist.com/feed',
      description: 'Health and fitness made approachable',
    },
    {
      name: 'Pick the Brain',
      url: 'https://www.pickthebrain.com/blog/feed/',
      description: 'Self-improvement and motivation',
    },
  ],
  'Intentional Tech': [
    {
      name: 'Cal Newport',
      url: 'https://calnewport.com/feed/',
      description: 'Deep work and digital minimalism',
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com/rss/index.xml',
      description: 'Technology news and culture',
    },
    {
      name: 'Humane Tech',
      url: 'https://www.humanetech.com/feed',
      description: 'Technology that serves humanity',
    },
  ],
};

// ── Public API ───────────────────────────────────────────

export async function suggestCategories() {
  const result = await callAI(
    'Suggest 8 blog/RSS feed categories for someone interested in mindful, intentional living. Return a JSON array of objects with "name" and "description" fields.',
    'You are a helpful assistant that suggests blog categories. Return only valid JSON.',
  );

  return result || FALLBACK_CATEGORIES;
}

export async function suggestFeeds(category) {
  const result = await callAI(
    `Suggest 3 RSS feeds/blogs for the category "${category}". Focus on thoughtful, personal blogs — not corporate or news sites. Return a JSON array of objects with "name", "url" (the RSS feed URL), and "description" fields.`,
    'You are a helpful assistant that suggests RSS feeds. Return only valid JSON.',
  );

  return result || FALLBACK_FEEDS[category] || [];
}

export async function tagArticles(articles, category) {
  if (!articles.length) return articles;

  const articlesForPrompt = articles.map((a, i) => ({
    index: i,
    title: a.title,
    excerpt: a.excerpt?.slice(0, 150),
  }));

  const result = await callAI(
    `Given these articles from a "${category}" blog, generate 2-3 descriptive tags per article. Return a JSON array of objects with "index" (number) and "tags" (string array).\n\nArticles:\n${JSON.stringify(articlesForPrompt)}`,
    'You are a helpful assistant that tags blog articles. Return only valid JSON.',
  );

  if (!result || !Array.isArray(result)) return articles;

  return articles.map((article, i) => {
    const tagData = result.find((r) => r.index === i);
    return {
      ...article,
      tags: tagData?.tags || [category.toLowerCase()],
    };
  });
}

export async function summarizeNotes(category, notes) {
  const noteTexts = notes.map((n) => {
    const context = n.articleTitle ? ` (from "${n.articleTitle}")` : '';
    return `- ${n.text}${context}`;
  });

  const result = await callAI(
    `Here are a reader's personal notes from the "${category}" category:\n\n${noteTexts.join('\n')}\n\nSummarise these into key themes and takeaways. Be concise and thoughtful — these are personal reflections. Return a JSON object with a "summary" field containing a short markdown summary (2-4 paragraphs, use **bold** for key phrases).`,
    "You are a thoughtful reading companion. Summarise the user's notes with warmth and insight. Return only valid JSON.",
  );

  return (
    result?.summary ||
    'Could not generate a summary. Make sure you have an AI provider configured in settings.'
  );
}

export async function generateInsight(category, oldAvg, newAvg) {
  const result = await callAI(
    `A user's reading impact in "${category}" has declined from ${oldAvg.toFixed(1)} to ${newAvg.toFixed(1)} over the past month. Suggest a brief, encouraging insight (1-2 sentences) about refreshing their feeds. Return a JSON object with an "insight" field.`,
    'You are a supportive reading coach. Be encouraging, not judgmental. Return only valid JSON.',
  );

  return (
    result?.insight ||
    `Your "${category}" reading impact has been declining. Consider exploring new voices in this category.`
  );
}
