import { useState, useEffect } from 'react';

import type { CategorySuggestion, FeedSuggestion, AIProvider } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { useFeedStore } from '../stores/feedStore';
import * as api from '../services/api';

type Step = 'ai-setup' | 'categories' | 'feeds';

export default function Onboarding() {
  const { update } = useSettingsStore();
  const { addFeed } = useFeedStore();

  const [step, setStep] = useState<Step>('ai-setup');

  // AI setup step
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiConfigured, setAiConfigured] = useState(false);

  // Category step
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Feed suggestion step
  const [feedSuggestions, setFeedSuggestions] = useState<Record<string, FeedSuggestion[]>>({});
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(new Set());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [addingFeeds, setAddingFeeds] = useState(false);

  // Check if AI is already configured on mount
  useEffect(() => {
    api.getAIConfig().then((config) => {
      if (config.hasKey && config.provider) {
        setAiConfigured(true);
        setProvider(config.provider);
      }
    });
  }, []);

  // ── AI Setup ───────────────────────────────────────────

  const handleSaveKey = async () => {
    if (!provider || !apiKey.trim()) return;
    setValidating(true);
    setAiError('');
    try {
      await api.saveAIConfig(provider, apiKey.trim());
      setAiConfigured(true);
      moveToCategories();
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setValidating(false);
    }
  };

  const moveToCategories = () => {
    setStep('categories');
    setLoadingCategories(true);
    api
      .suggestCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  };

  // ── Categories ─────────────────────────────────────────

  const toggleCategory = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const handleContinueToFeeds = async () => {
    const cats = Array.from(selected);
    await update({ categories: cats });
    setStep('feeds');
    const firstCat = cats[0];
    if (firstCat) loadFeedSuggestions(firstCat);
  };

  // ── Feeds ──────────────────────────────────────────────

  const loadFeedSuggestions = async (category: string) => {
    if (!category || feedSuggestions[category]) return;
    setLoadingFeeds(true);
    try {
      const suggestions = await api.suggestFeeds(category);
      setFeedSuggestions((prev) => ({ ...prev, [category]: suggestions }));
    } catch {
      setFeedSuggestions((prev) => ({ ...prev, [category]: [] }));
    }
    setLoadingFeeds(false);
  };

  const selectedCats = Array.from(selected);
  const currentCategory = selectedCats[currentCategoryIndex] || '';
  const currentSuggestions = feedSuggestions[currentCategory] || [];

  const toggleFeed = (url: string) => {
    const next = new Set(selectedFeeds);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedFeeds(next);
  };

  const handleNextCategory = () => {
    const nextIndex = currentCategoryIndex + 1;
    if (nextIndex < selectedCats.length) {
      setCurrentCategoryIndex(nextIndex);
      const cat = selectedCats[nextIndex];
      if (cat) loadFeedSuggestions(cat);
    } else {
      finishOnboarding();
    }
  };

  const [addProgress, setAddProgress] = useState('');
  const [failedFeeds, setFailedFeeds] = useState<string[]>([]);

  const finishOnboarding = async () => {
    setAddingFeeds(true);
    const failed: string[] = [];
    let added = 0;

    for (const url of selectedFeeds) {
      for (const [cat, suggestions] of Object.entries(feedSuggestions)) {
        const suggestion = suggestions.find((s) => s.url === url);
        if (suggestion) {
          setAddProgress(`Adding ${suggestion.name}...`);
          try {
            await addFeed(url, cat);
            added++;
          } catch (err) {
            const msg = (err as Error).message;
            // "already subscribed" means the feed exists — the server
            // will have moved it to the correct category, so count it
            if (msg.includes('already subscribed')) {
              added++;
            } else {
              // Try with the site URL instead (auto-discovery will kick in)
              try {
                const siteUrl = url.replace(/\/feed\/?$/, '').replace(/\/rss\/?$/, '');
                if (siteUrl !== url) {
                  await addFeed(siteUrl, cat);
                  added++;
                } else {
                  failed.push(suggestion.name);
                }
              } catch {
                failed.push(suggestion.name);
              }
            }
          }
          break;
        }
      }
    }

    if (failed.length > 0) {
      setFailedFeeds(failed);
      setAddingFeeds(false);
      setAddProgress('');
      // If some succeeded, auto-complete after showing the warning briefly
      if (added > 0) {
        // Don't auto-advance — let the user see the failures and click continue
      }
      return;
    }

    await update({ onboardingComplete: true });
    window.location.reload();
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {step === 'ai-setup' && (
          <>
            <h1 className="font-serif text-3xl font-semibold text-stone-800">
              Welcome to Mindful Reader
            </h1>
            <p className="mt-3 leading-relaxed text-stone-500">
              A calm space for thoughtful reading. No unread counts, no pressure — just a few
              articles each day that might change how you think.
            </p>

            <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="font-serif text-lg font-medium text-stone-700">
                AI-powered suggestions
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                Add an API key to get personalised category and feed suggestions. Or skip to use our
                curated defaults — you can always add a key later in settings.
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setProvider('claude')}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    provider === 'claude'
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  Claude
                </button>
                <button
                  onClick={() => setProvider('openai')}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    provider === 'openai'
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  ChatGPT
                </button>
              </div>

              {provider && (
                <div className="mt-3">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setAiError('');
                    }}
                    placeholder={provider === 'claude' ? 'sk-ant-api03-...' : 'sk-...'}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                  />
                  {aiError && <p className="mt-1.5 text-sm text-rose-500">{aiError}</p>}
                  <button
                    onClick={handleSaveKey}
                    disabled={!apiKey.trim() || validating}
                    className="mt-2 w-full rounded-lg bg-stone-800 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
                  >
                    {validating ? 'Validating...' : 'Save & Continue'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={moveToCategories}
              className="mt-4 w-full py-3 text-sm text-stone-400 transition-colors hover:text-stone-600"
            >
              Skip — use curated suggestions
            </button>

            {aiConfigured && (
              <p className="mt-2 text-center text-xs text-emerald-600">
                AI already configured ({provider}) — you can skip or update your key.
              </p>
            )}
          </>
        )}

        {step === 'categories' && (
          <>
            <h1 className="font-serif text-3xl font-semibold text-stone-800">
              What interests you?
            </h1>
            <p className="mt-3 text-stone-500">
              Choose categories that resonate. You can always add more later.
            </p>

            {loadingCategories ? (
              <div className="mt-12 text-center">
                <p className="font-serif text-lg text-stone-400">
                  {aiConfigured ? 'AI is finding categories for you...' : 'Loading categories...'}
                </p>
              </div>
            ) : (
              <>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className={`rounded-xl border px-4 py-3 text-left transition-all ${
                        selected.has(cat.name)
                          ? 'border-stone-800 bg-stone-800 text-white'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="block text-sm font-medium">{cat.name}</span>
                      <span
                        className={`mt-0.5 block text-xs ${selected.has(cat.name) ? 'text-stone-300' : 'text-stone-400'}`}
                      >
                        {cat.description}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleContinueToFeeds}
                  disabled={selected.size === 0}
                  className="mt-8 w-full rounded-xl bg-stone-800 py-3 font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {step === 'feeds' && (
          <>
            <h2 className="font-serif text-2xl font-semibold text-stone-800">
              Suggested feeds for {currentCategory}
            </h2>
            <p className="mt-2 text-sm text-stone-400">
              Category {currentCategoryIndex + 1} of {selectedCats.length} · Select any that
              interest you, or skip
            </p>

            {loadingFeeds ? (
              <p className="mt-8 text-center text-stone-400">Finding blogs...</p>
            ) : (
              <div className="mt-6 space-y-3">
                {currentSuggestions.map((feed) => (
                  <button
                    key={feed.url}
                    onClick={() => toggleFeed(feed.url)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      selectedFeeds.has(feed.url)
                        ? 'border-stone-800 bg-stone-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs ${
                        selectedFeeds.has(feed.url)
                          ? 'border-stone-800 bg-stone-800 text-white'
                          : 'border-stone-300'
                      }`}
                    >
                      {selectedFeeds.has(feed.url) && '✓'}
                    </span>
                    <div>
                      <span className="font-medium text-stone-700">{feed.name}</span>
                      <p className="mt-0.5 text-sm text-stone-400">{feed.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {addProgress && (
              <p className="mt-4 text-center text-sm text-stone-400">{addProgress}</p>
            )}

            {failedFeeds.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-700">
                  Couldn&apos;t add: {failedFeeds.join(', ')}. You can add them manually later.
                </p>
                <button
                  onClick={async () => {
                    await update({ onboardingComplete: true });
                    window.location.reload();
                  }}
                  className="mt-2 text-sm font-medium text-amber-700 underline"
                >
                  Continue anyway
                </button>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleNextCategory}
                disabled={addingFeeds}
                className="flex-1 rounded-xl border border-stone-200 py-3 text-sm text-stone-500 transition-colors hover:bg-stone-50 disabled:opacity-40"
              >
                Skip
              </button>
              <button
                onClick={handleNextCategory}
                disabled={addingFeeds}
                className="flex-1 rounded-xl bg-stone-800 py-3 font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
              >
                {addingFeeds
                  ? 'Setting up...'
                  : currentCategoryIndex < selectedCats.length - 1
                    ? 'Next Category'
                    : 'Finish'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
