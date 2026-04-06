import { create } from 'zustand';

import type { Article, FeedHealthWarning, ImpactLevel } from '../types';
import * as api from '../services/api';

interface ArticleState {
  articles: Article[];
  hasMore: boolean;
  loading: boolean;
  warning: FeedHealthWarning | null;
  fetchDaily: () => Promise<void>;
  fetchMore: () => Promise<void>;
  rateArticle: (
    articleId: string,
    feedId: string,
    category: string,
    impact: ImpactLevel,
  ) => Promise<void>;
  dismissWarning: () => void;
}

export const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  hasMore: false,
  loading: true,
  warning: null,
  fetchDaily: async () => {
    set({ loading: true });
    try {
      const data = await api.getDaily();
      set({ articles: data.articles, hasMore: data.hasMore, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchMore: async () => {
    set({ loading: true });
    try {
      const data = await api.getMore();
      set((state) => ({
        articles: [...state.articles, ...data.articles],
        hasMore: data.hasMore,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },
  rateArticle: async (articleId, feedId, category, impact) => {
    const result = await api.rateArticle(articleId, feedId, category, impact);
    if (result.warning) {
      set({ warning: result.warning });
    }
  },
  dismissWarning: () => set({ warning: null }),
}));
