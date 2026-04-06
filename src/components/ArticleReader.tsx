import { useState, useEffect, useRef } from 'react';

import type { Article } from '../types';
import * as api from '../services/api';

function NoteInput({ article }: { article: Article }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async () => {
    if (!text.trim() || !article.feedCategory) return;
    await api.addNote(article.feedCategory, text.trim(), article.id, article.title);
    setNotes((prev) => [...prev, text.trim()]);
    setText('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-medium text-stone-500">Capture a thought</p>
      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What stood out to you?"
          className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-stone-400 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="shrink-0 rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
        >
          Save
        </button>
      </div>
      {saved && <p className="mt-1.5 text-xs text-emerald-600">Note saved</p>}
      {notes.length > 0 && (
        <div className="mt-3 space-y-1">
          {notes.map((n, i) => (
            <p key={i} className="text-xs text-stone-400">
              &bull; {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  articleId: string;
  onClose: () => void;
  onFinishedReading: (article: Article) => void;
}

export default function ArticleReader({ articleId, onClose, onFinishedReading }: Props) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getArticle(articleId)
      .then(setArticle)
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
        <div className="flex min-h-screen items-center justify-center">
          <p className="font-serif text-lg text-stone-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-stone-400">Could not load article.</p>
            <button onClick={onClose} className="mt-3 text-sm text-stone-500 underline">
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = article.content && article.content.trim().length > 100;
  const publishDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            &larr; Back
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            Open original &rarr;
          </a>
        </div>

        {/* Article */}
        {article.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-xl">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <h1 className="font-serif text-3xl leading-tight font-bold text-stone-900">
          {article.title}
        </h1>

        <div className="mt-3 flex items-center gap-2 text-sm text-stone-400">
          <span>{article.feedTitle}</span>
          <span>·</span>
          <span>{publishDate}</span>
        </div>

        {article.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        {hasContent ? (
          <div
            className="article-content mt-8 font-serif text-lg leading-relaxed text-stone-700"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content, article.imageUrl) }}
          />
        ) : (
          <div className="mt-8">
            <p className="font-serif text-lg leading-relaxed text-stone-600">
              &ldquo;{article.excerpt}&rdquo;
            </p>
            <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
              <p className="text-sm text-stone-400">This feed only provides excerpts.</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-stone-600 underline"
              >
                Read the full article on {article.feedTitle}
              </a>
            </div>
          </div>
        )}

        {/* Notes */}
        <NoteInput article={article} />

        {/* Footer */}
        <div className="mt-12 border-t border-stone-200 pt-6 pb-20 text-center">
          <button
            onClick={() => onFinishedReading(article)}
            className="rounded-xl bg-stone-800 px-8 py-3 font-medium text-white transition-colors hover:bg-stone-700"
          >
            Done reading
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Basic HTML sanitization — strip scripts, event handlers, and dangerous tags.
 * Keep structural/formatting tags for readable content.
 */
function sanitizeHtml(html: string, featuredImageUrl: string | null): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s*on\w+="[^"]*"/gi, '')
    .replace(/\s*on\w+='[^']*'/gi, '');

  // Remove the first image if it matches the featured image to avoid duplicates
  if (featuredImageUrl) {
    const firstImgMatch = cleaned.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (firstImgMatch && firstImgMatch[1]) {
      const inlineSrc = firstImgMatch[1];
      // Compare by checking if one URL contains the other (handles resized variants)
      if (
        inlineSrc === featuredImageUrl ||
        inlineSrc.includes(featuredImageUrl.split('?')[0] ?? '') ||
        featuredImageUrl.includes(inlineSrc.split('?')[0] ?? '') ||
        extractFilename(inlineSrc) === extractFilename(featuredImageUrl)
      ) {
        cleaned = cleaned.replace(firstImgMatch[0], '');
      }
    }
  }

  return cleaned;
}

function extractFilename(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split('/').pop() ?? '';
  } catch {
    return '';
  }
}
