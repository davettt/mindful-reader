import { useState, useEffect } from 'react';

import type { FeedSuggestion } from '../types';
import * as api from '../services/api';

interface Props {
  categories: string[];
  selectedCategory?: string;
  onAdd: (url: string, category: string) => Promise<void>;
  onClose: () => void;
}

export default function AddFeedModal({ categories, selectedCategory, onAdd, onClose }: Props) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(selectedCategory || categories[0] || '');
  const [suggestions, setSuggestions] = useState<FeedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setLoadingSuggestions(true);
      api
        .suggestFeeds(category)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    }
  }, [category]);

  const handleAdd = async (feedUrl: string) => {
    setAdding(true);
    setError('');
    try {
      await onAdd(feedUrl, category);
      onClose();
    } catch (err) {
      const msg = (err as Error).message;
      setError(`${msg} (tried: ${feedUrl})`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-stone-800">Add Feed</h3>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm text-stone-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-stone-500">Website or RSS URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              />
              <button
                onClick={() => handleAdd(url)}
                disabled={!url || adding}
                className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="mb-3 text-sm text-stone-400">
            {loadingSuggestions ? 'Finding suggestions...' : `Suggested for ${category}:`}
          </p>
          {!loadingSuggestions && (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s.url}
                  onClick={() => handleAdd(s.url)}
                  disabled={adding}
                  className="flex w-full items-start gap-3 rounded-lg border border-stone-200 px-3 py-2.5 text-left transition-colors hover:bg-stone-50 disabled:opacity-40"
                >
                  <span className="mt-0.5 text-stone-300">+</span>
                  <div>
                    <span className="text-sm font-medium text-stone-700">{s.name}</span>
                    <p className="text-xs text-stone-400">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
