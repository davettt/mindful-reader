import type { FeedHealthWarning } from '../types';

interface Props {
  warning: FeedHealthWarning;
  feedId: string;
  onDismiss: () => void;
  onUnsubscribe: (feedId: string) => void;
}

export default function FeedHealthPrompt({ warning, feedId, onDismiss, onUnsubscribe }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 text-center">
          <span className="text-3xl">{warning.level === 'strong' ? '💭' : '🤔'}</span>
        </div>
        <p className="text-center leading-relaxed text-stone-700">{warning.message}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={onDismiss}
            className="rounded-lg px-4 py-2 text-sm text-stone-500 transition-colors hover:bg-stone-100"
          >
            Keep it
          </button>
          <button
            onClick={() => onUnsubscribe(feedId)}
            className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
          >
            Unsubscribe
          </button>
        </div>
      </div>
    </div>
  );
}
