import { useMemo } from 'react';

import { getDailyQuote } from '../data/quotes';

export default function WelcomeQuote({ visible }: { visible: boolean }) {
  const quote = useMemo(() => getDailyQuote(), []);

  return (
    <div
      aria-hidden={!visible}
      className={`overflow-hidden transition-all duration-700 ease-out ${
        visible ? 'max-h-48 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
      }`}
    >
      <figure className="mt-6 rounded-xl border border-stone-100 bg-stone-50 px-5 py-5">
        <blockquote className="font-serif text-lg leading-relaxed text-stone-600">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        <figcaption className="mt-2 text-xs tracking-wider text-stone-400 uppercase">
          — {quote.author}
        </figcaption>
      </figure>
    </div>
  );
}
