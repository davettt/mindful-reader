export interface Feed {
  id: string;
  url: string;
  title: string;
  description: string;
  siteUrl: string;
  category: string;
  addedAt: string;
  active: boolean;
  avgImpact: number | null;
  totalRatings: number;
  lowImpactCount: number;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  fetchedAt: string;
  tags: string[];
  presented: boolean;
  presentedAt: string | null;
  readAt?: string | null;
  rated?: boolean;
  feedTitle?: string;
  feedCategory?: string;
}

export interface Rating {
  id: string;
  articleId: string;
  feedId: string;
  category: string;
  impact: ImpactLevel;
  ratedAt: string;
}

export type ImpactLevel = 0 | 1 | 2 | 3;

export interface ImpactOption {
  value: ImpactLevel;
  label: string;
  description: string;
}

export const IMPACT_OPTIONS: ImpactOption[] = [
  { value: 0, label: 'No impact', description: 'Just skimmed' },
  { value: 1, label: 'Mild', description: 'Interesting but forgettable' },
  { value: 2, label: 'Moderate', description: 'Made me think' },
  { value: 3, label: 'Strong', description: 'Shifted my perspective' },
];

export interface FeedHealthWarning {
  level: 'gentle' | 'strong';
  message: string;
}

export interface RateResponse {
  rating: Rating;
  warning: FeedHealthWarning | null;
}

export interface DailyResponse {
  articles: Article[];
  hasMore: boolean;
  batchIndex: number;
}

export interface CategorySuggestion {
  name: string;
  description: string;
}

export interface FeedSuggestion {
  name: string;
  url: string;
  description: string;
}

export interface Settings {
  onboardingComplete: boolean;
  categories: string[];
  dailyArticleCount: number;
  lastDailyRefresh: string | null;
  dailyArticleIds: string[];
  dailyBatchIndex: number;
}

export type AIProvider = 'claude' | 'openai';

export interface AIConfig {
  provider: AIProvider | null;
  hasKey: boolean;
  keyHint: string | null;
}

export interface WeeklyInsight {
  week: string;
  avg: number;
  count: number;
}

export interface CategoryInsight {
  avg: number;
  recentAvg: number;
  trend: 'improving' | 'steady' | 'declining';
  totalRatings: number;
}

export interface Note {
  id: string;
  category: string;
  text: string;
  articleId: string | null;
  articleTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightsData {
  overall: WeeklyInsight[];
  byCategory: Record<string, CategoryInsight>;
  insights: Record<string, string>;
}
