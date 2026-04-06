import { useEffect, useState } from 'react';

import { useFeedStore } from '../stores/feedStore';
import { useSettingsStore } from '../stores/settingsStore';
import AddFeedModal from '../components/AddFeedModal';
import AISettings from '../components/AISettings';
import CategoryNotes from '../components/CategoryNotes';
import * as api from '../services/api';

export default function Feeds() {
  const { feeds, loading, fetch, addFeed, removeFeed, refresh } = useFeedStore();
  const { settings, fetch: fetchSettings } = useSettingsStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [addCategory, setAddCategory] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [renameError, setRenameError] = useState('');
  const { update } = useSettingsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const cats = [...(settings?.categories || []), newCategory.trim()];
    await update({ categories: cats });
    setNewCategory('');
    setShowAddCategory(false);
  };

  const handleRenameCategory = async (oldName: string) => {
    const trimmed = editCategoryName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCategory(null);
      setRenameError('');
      return;
    }
    try {
      await api.renameCategory(oldName, trimmed);
      await fetchSettings();
      await fetch();
      setEditingCategory(null);
      setRenameError('');
    } catch (err) {
      setRenameError((err as Error).message);
    }
  };

  const handleRemoveCategory = async (name: string) => {
    const cats = (settings?.categories || []).filter((c) => c !== name);
    await update({ categories: cats });
    await fetch();
  };

  const categories = settings?.categories || [];
  const impactBar = (avg: number | null, totalRatings: number) => {
    if (avg === null || totalRatings === 0) {
      return <span className="text-xs text-stone-300">No ratings yet</span>;
    }
    const pct = Math.max((avg / 3) * 100, 4); // min 4% so 0.0 shows a visible sliver
    let color = 'bg-emerald-500';
    if (avg < 1.5) color = 'bg-rose-400';
    else if (avg < 2) color = 'bg-amber-500';
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-20 overflow-hidden rounded-full bg-stone-100">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-stone-400">{avg.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-serif text-lg text-stone-400">Loading feeds...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">Your Feeds</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-500 transition-colors hover:bg-stone-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {categories.map((cat) => {
          const catFeeds = feeds[cat] || [];
          return (
            <div key={cat} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                {editingCategory === cat ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => {
                        setEditCategoryName(e.target.value);
                        setRenameError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCategory(cat);
                        if (e.key === 'Escape') {
                          setEditingCategory(null);
                          setRenameError('');
                        }
                      }}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2 py-1 font-serif text-lg font-medium text-stone-700 focus:border-stone-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleRenameCategory(cat)}
                      className="text-xs text-stone-500 hover:text-stone-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setRenameError('');
                      }}
                      className="text-xs text-stone-300 hover:text-stone-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h2
                    className="cursor-pointer font-serif text-lg font-medium text-stone-700 transition-colors hover:text-stone-900"
                    onClick={() => {
                      setEditingCategory(cat);
                      setEditCategoryName(cat);
                      setRenameError('');
                    }}
                    title="Click to rename"
                  >
                    {cat}{' '}
                    <span className="text-sm font-normal text-stone-400">
                      ({catFeeds.length}/5)
                    </span>
                  </h2>
                )}
                {editingCategory !== cat && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAddCategory(cat);
                        setShowAddModal(true);
                      }}
                      disabled={catFeeds.length >= 5}
                      className="text-xs text-stone-400 transition-colors hover:text-stone-600 disabled:opacity-30"
                    >
                      + Feed
                    </button>
                    <button
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-xs text-stone-300 transition-colors hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {renameError && editingCategory === cat && (
                <p className="mt-1 text-xs text-rose-500">{renameError}</p>
              )}

              {catFeeds.length === 0 ? (
                <p className="mt-3 text-sm text-stone-300">No feeds yet</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {catFeeds.map((feed) => (
                    <div
                      key={feed.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-stone-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-stone-700">
                            {feed.title}
                          </span>
                          {feed.lowImpactCount >= 8 && (
                            <span className="text-xs text-rose-400" title="Low impact">
                              !!
                            </span>
                          )}
                          {feed.lowImpactCount >= 3 && feed.lowImpactCount < 8 && (
                            <span className="text-xs text-amber-500" title="Declining impact">
                              !
                            </span>
                          )}
                        </div>
                        {impactBar(feed.avgImpact, feed.totalRatings)}
                      </div>
                      <button
                        onClick={() => removeFeed(feed.id)}
                        className="ml-3 shrink-0 text-xs text-stone-300 transition-colors hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <CategoryNotes category={cat} />
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            setAddCategory(undefined);
            setShowAddModal(true);
          }}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-500 transition-colors hover:bg-stone-50"
        >
          + Add Feed
        </button>
        <button
          onClick={() => setShowAddCategory(true)}
          className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-500 transition-colors hover:bg-stone-50"
        >
          + Add Category
        </button>
      </div>

      <div className="mt-8">
        <AISettings />
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-stone-800">Add Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 text-sm text-stone-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddFeedModal
          categories={categories}
          selectedCategory={addCategory}
          onAdd={async (url, cat) => {
            await addFeed(url, cat);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
