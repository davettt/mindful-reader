import { useState, useEffect } from 'react';

import type { AIConfig, AIProvider } from '../types';
import * as api from '../services/api';

export default function AISettings() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [provider, setProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAIConfig().then(setConfig);
  }, []);

  const handleSave = async () => {
    if (!provider || !apiKey.trim()) return;
    setValidating(true);
    setError('');
    try {
      await api.saveAIConfig(provider, apiKey.trim());
      const updated = await api.getAIConfig();
      setConfig(updated);
      setEditing(false);
      setApiKey('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = async () => {
    await api.removeAIConfig();
    setConfig({ provider: null, hasKey: false, keyHint: null });
    setProvider(null);
    setApiKey('');
  };

  if (!config) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="font-serif text-lg font-medium text-stone-700">AI Settings</h2>

      {!editing ? (
        <>
          {config.hasKey ? (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                <span className="font-medium text-stone-700">
                  {config.provider === 'claude' ? 'Claude' : 'ChatGPT'}
                </span>{' '}
                connected ({config.keyHint})
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setProvider(config.provider);
                    setEditing(true);
                  }}
                  className="text-xs text-stone-400 transition-colors hover:text-stone-600"
                >
                  Change
                </button>
                <button
                  onClick={handleRemove}
                  className="text-xs text-stone-300 transition-colors hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-stone-400">
                No API key configured. Using curated suggestions.
              </p>
              <button
                onClick={() => setEditing(true)}
                className="mt-2 text-sm text-stone-500 transition-colors hover:text-stone-700"
              >
                + Add API key
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setProvider('claude')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                provider === 'claude'
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setProvider('openai')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                provider === 'openai'
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              ChatGPT
            </button>
          </div>

          {provider && (
            <>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder={provider === 'claude' ? 'sk-ant-api03-...' : 'sk-...'}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              {error && <p className="text-sm text-rose-500">{error}</p>}
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setApiKey('');
                setError('');
              }}
              className="flex-1 rounded-lg border border-stone-200 py-2 text-sm text-stone-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!provider || !apiKey.trim() || validating}
              className="flex-1 rounded-lg bg-stone-800 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {validating ? 'Validating...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
