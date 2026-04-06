import type {
  Article,
  DailyResponse,
  RateResponse,
  Feed,
  Note,
  Settings,
  CategorySuggestion,
  FeedSuggestion,
  InsightsData,
  ImpactLevel,
  AIConfig,
  AIProvider,
} from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error: string }).error || 'Request failed');
  }
  return res.json() as Promise<T>;
}

// Settings
export const getSettings = () => request<Settings>('/settings');
export const updateSettings = (data: Partial<Settings>) =>
  request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) });

// Categories
export const getCategories = () => request<string[]>('/categories');
export const addCategory = (name: string) =>
  request<{ categories: string[] }>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
export const renameCategory = (name: string, newName: string) =>
  request<{ categories: string[] }>(`/categories/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ newName }),
  });
export const deleteCategory = (name: string) =>
  request<{ categories: string[] }>(`/categories/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });

// Feeds
export const getFeeds = () => request<Record<string, Feed[]>>('/feeds');
export const addFeed = (url: string, category: string) =>
  request<Feed>('/feeds', { method: 'POST', body: JSON.stringify({ url, category }) });
export const deleteFeed = (id: string) =>
  request<{ success: boolean }>(`/feeds/${id}`, { method: 'DELETE' });
export const refreshFeeds = () =>
  request<{ refreshed: number; newArticles: number }>('/feeds/refresh', { method: 'POST' });

// Daily
export const getDaily = () => request<DailyResponse>('/daily');
export const getMore = () => request<DailyResponse>('/daily/more', { method: 'POST' });

// Articles
export const getArticle = (id: string) => request<Article>(`/articles/${id}`);

export const markArticleRead = (id: string) =>
  request<{ success: boolean }>(`/articles/${id}/read`, { method: 'POST' });

// Ratings
export const rateArticle = (
  articleId: string,
  feedId: string,
  category: string,
  impact: ImpactLevel,
) =>
  request<RateResponse>('/rate', {
    method: 'POST',
    body: JSON.stringify({ articleId, feedId, category, impact }),
  });

// AI Config
export const getAIConfig = () => request<AIConfig>('/ai/config');
export const saveAIConfig = (provider: AIProvider, apiKey: string) =>
  request<{ success: boolean; provider: string }>('/ai/config', {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey }),
  });
export const removeAIConfig = () =>
  request<{ success: boolean }>('/ai/config', { method: 'DELETE' });

// AI Suggestions
export const suggestCategories = () =>
  request<CategorySuggestion[]>('/ai/suggest-categories', { method: 'POST' });
export const suggestFeeds = (category: string) =>
  request<FeedSuggestion[]>('/ai/suggest-feeds', {
    method: 'POST',
    body: JSON.stringify({ category }),
  });

// Notes
export const getNotes = (category?: string) =>
  request<Note[]>(category ? `/notes?category=${encodeURIComponent(category)}` : '/notes');
export const addNote = (
  category: string,
  text: string,
  articleId?: string,
  articleTitle?: string,
) =>
  request<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify({ category, text, articleId, articleTitle }),
  });
export const updateNote = (id: string, text: string) =>
  request<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify({ text }) });
export const deleteNote = (id: string) =>
  request<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' });
export const summarizeNotes = (category: string) =>
  request<{ summary: string }>('/notes/summarize', {
    method: 'POST',
    body: JSON.stringify({ category }),
  });

// Insights
export const getInsights = () => request<InsightsData>('/insights');
