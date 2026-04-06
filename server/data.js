import fs from 'fs/promises';
import path from 'path';
import { DATA_DIR } from './config.js';

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJSON(filename) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeJSON(filename, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getFeeds() {
  return (await readJSON('feeds.json')) || [];
}

export async function saveFeeds(feeds) {
  await writeJSON('feeds.json', feeds);
}

export async function getArticles() {
  return (await readJSON('articles.json')) || [];
}

export async function saveArticles(articles) {
  await writeJSON('articles.json', articles);
}

export async function getRatings() {
  return (await readJSON('ratings.json')) || [];
}

export async function saveRatings(ratings) {
  await writeJSON('ratings.json', ratings);
}

export async function getSettings() {
  return (
    (await readJSON('settings.json')) || {
      onboardingComplete: false,
      categories: [],
      dailyArticleCount: 3,
      lastDailyRefresh: null,
      dailyArticleIds: [],
      dailyBatchIndex: 0,
    }
  );
}

export async function saveSettings(settings) {
  await writeJSON('settings.json', settings);
}

export async function getNotes() {
  return (await readJSON('notes.json')) || [];
}

export async function saveNotes(notes) {
  await writeJSON('notes.json', notes);
}
