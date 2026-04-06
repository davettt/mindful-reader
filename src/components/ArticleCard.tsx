import type { Article } from '../types';

interface Props {
  article: Article;
  onRead: (article: Article) => void;
}

export default function ArticleCard({ article, onRead }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {article.imageUrl && (
        <div className="aspect-[3/1] w-full overflow-hidden bg-stone-100">
          <img
            src={article.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-serif text-xl leading-snug font-semibold text-stone-900">
          {article.title}
        </h3>
        <p className="mt-1 text-sm text-stone-400">
          {article.feedTitle} · {article.feedCategory}
        </p>
        <p className="mt-3 font-serif leading-relaxed text-stone-600">
          &ldquo;{article.excerpt}...&rdquo;
        </p>
        <div className="mt-4 flex items-center justify-between">
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={() => onRead(article)}
            className="ml-auto rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            Read
          </button>
        </div>
      </div>
    </div>
  );
}
