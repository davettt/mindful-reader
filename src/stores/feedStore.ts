import { create } from 'zustand';

import type { Feed } from '../types';
import * as api from '../services/api';

interface FeedState {
  feeds: Record<string, Feed[]>;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  addFeed: (url: string, category: string) => Promise<Feed>;
  removeFeed: (id: string) => Promise<void>;
  refresh: () => Promise<{ refreshed: number; newArticles: number }>;
}

export const useFeedStore = create<FeedState>((set) => ({
  feeds: {},
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const feeds = await api.getFeeds();
      set({ feeds, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  addFeed: async (url, category) => {
    const feed = await api.addFeed(url, category);
    const feeds = await api.getFeeds();
    set({ feeds });
    return feed;
  },
  removeFeed: async (id) => {
    await api.deleteFeed(id);
    const feeds = await api.getFeeds();
    set({ feeds });
  },
  refresh: async () => {
    const result = await api.refreshFeeds();
    const feeds = await api.getFeeds();
    set({ feeds });
    return result;
  },
}));
