import { useState } from 'react';

import type { Article, ImpactLevel } from '../types';
import { IMPACT_OPTIONS } from '../types';

interface Props {
  article: Article;
  onRate: (impact: ImpactLevel) => void;
  onSkip: () => void;
}

export default function ImpactRating({ article, onRate, onSkip }: Props) {
  const [selected, setSelected] = useState<ImpactLevel | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-stone-800">
          How did this article impact you?
        </h3>
        <p className="mt-1 text-sm text-stone-400">{article.title}</p>

        <div className="mt-5 space-y-2">
          {IMPACT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                selected === option.value
                  ? 'border-stone-800 bg-stone-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  selected === option.value ? 'border-stone-800' : 'border-stone-300'
                }`}
              >
                {selected === option.value && (
                  <span className="h-2.5 w-2.5 rounded-full bg-stone-800" />
                )}
              </span>
              <div>
                <span className="font-medium text-stone-700">{option.label}</span>
                <span className="ml-2 text-sm text-stone-400">— {option.description}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-between">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            Skip
          </button>
          <button
            onClick={() => {
              if (selected !== null) onRate(selected);
            }}
            disabled={selected === null}
            className="rounded-lg bg-stone-800 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
