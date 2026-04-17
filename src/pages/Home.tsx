import { useEffect, useMemo, useState } from 'react';

import type { Article, ImpactLevel } from '../types';
import { useArticleStore } from '../stores/articleStore';
import { useFeedStore } from '../stores/feedStore';
import * as api from '../services/api';
import ArticleCard from '../components/ArticleCard';
import ArticleReader from '../components/ArticleReader';
import ImpactRating from '../components/ImpactRating';
import FeedHealthPrompt from '../components/FeedHealthPrompt';

export default function Home() {
  const {
    articles,
    hasMore,
    loading,
    warning,
    fetchDaily,
    fetchMore,
    rateArticle,
    dismissWarning,
  } = useArticleStore();
  const { removeFeed } = useFeedStore();

  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const [readingArticleId, setReadingArticleId] = useState<string | null>(null);
  const [ratingArticle, setRatingArticle] = useState<Article | null>(null);
  const [lastRatedFeedId, setLastRatedFeedId] = useState<string>('');

  useEffect(() => {
    fetchDaily();

    // Refetch when tab becomes visible again — handles leaving the app open
    // overnight, so a new day triggers regeneration.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDaily();
        setLocalReadIds(new Set());
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchDaily]);

  // Merge server-side readAt with local reads for the combined read set
  const readIds = useMemo(() => {
    const ids = new Set(localReadIds);
    for (const a of articles) {
      if (a.readAt) ids.add(a.id);
    }
    return ids;
  }, [articles, localReadIds]);

  const handleRead = (article: Article) => {
    setReadingArticleId(article.id);
  };

  const handleFinishedReading = (article: Article) => {
    setLocalReadIds((prev) => new Set(prev).add(article.id));
    setReadingArticleId(null);
    // Mark as read on server
    api.markArticleRead(article.id).catch(() => {});
    // Only show rating modal if not already rated
    if (!article.rated) {
      setRatingArticle(article);
    }
  };

  const handleRate = async (impact: ImpactLevel) => {
    if (!ratingArticle) return;
    setLastRatedFeedId(ratingArticle.feedId);
    await rateArticle(
      ratingArticle.id,
      ratingArticle.feedId,
      ratingArticle.feedCategory || '',
      impact,
    );
    setRatingArticle(null);
  };

  const handleUnsubscribe = async (feedId: string) => {
    await removeFeed(feedId);
    dismissWarning();
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const allRead = articles.length > 0 && articles.every((a) => readIds.has(a.id));

  if (loading && articles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-serif text-lg text-stone-400">Curating your reads...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="font-serif text-2xl font-semibold text-stone-800">{today}</h1>

      {articles.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-serif text-xl text-stone-400">Nothing to read yet.</p>
          <p className="mt-2 text-sm text-stone-400">Add some feeds to get started.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {articles.map((article) => {
              const isRead = readIds.has(article.id);

              if (isRead) {
                // Collapsed read card
                return (
                  <div
                    key={article.id}
                    className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-stone-400">{article.title}</p>
                      <p className="text-xs text-stone-300">{article.feedTitle} · Read</p>
                    </div>
                    <button
                      onClick={() => setReadingArticleId(article.id)}
                      className="ml-3 shrink-0 rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-400 transition-colors hover:bg-white"
                    >
                      Re-read
                    </button>
                  </div>
                );
              }

              return <ArticleCard key={article.id} article={article} onRead={handleRead} />;
            })}
          </div>

          {/* Show more section - visible once all current articles are read, OR always if there are more */}
          <div className="mt-8 text-center">
            {allRead && hasMore && (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-sm text-stone-400">
                    You&apos;ve read today&apos;s articles
                  </span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>
                <button
                  onClick={fetchMore}
                  disabled={loading}
                  className="rounded-xl border border-stone-200 px-6 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
                >
                  {loading ? 'Loading...' : 'Show me 3 more'}
                </button>
                <p className="mt-2 text-xs text-stone-300">or just enjoy your day.</p>
              </>
            )}

            {allRead && !hasMore && (
              <div className="py-8">
                <p className="font-serif text-lg text-stone-400">That&apos;s all for today.</p>
                <p className="mt-1 text-sm text-stone-300">Enjoy the rest of your day.</p>
                <button
                  onClick={fetchMore}
                  disabled={loading}
                  className="mt-4 rounded-xl border border-stone-200 px-6 py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 disabled:opacity-40"
                >
                  {loading ? 'Checking...' : 'Check for new articles'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* In-app article reader */}
      {readingArticleId && (
        <ArticleReader
          articleId={readingArticleId}
          onClose={() => setReadingArticleId(null)}
          onFinishedReading={handleFinishedReading}
        />
      )}

      {/* Impact rating modal */}
      {ratingArticle && !readingArticleId && (
        <ImpactRating
          article={ratingArticle}
          onRate={handleRate}
          onSkip={() => setRatingArticle(null)}
        />
      )}

      {/* Feed health warning */}
      {warning && !ratingArticle && !readingArticleId && (
        <FeedHealthPrompt
          warning={warning}
          feedId={lastRatedFeedId}
          onDismiss={dismissWarning}
          onUnsubscribe={handleUnsubscribe}
        />
      )}
    </div>
  );
}
