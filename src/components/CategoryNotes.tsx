import { useState, useEffect } from 'react';

import type { Note } from '../types';
import * as api from '../services/api';

interface Props {
  category: string;
}

export default function CategoryNotes({ category }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (expanded) {
      api.getNotes(category).then(setNotes);
    }
  }, [expanded, category]);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    const note = await api.addNote(category, newText.trim());
    setNotes((prev) => [...prev, note]);
    setNewText('');
    setAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editText.trim()) return;
    const updated = await api.updateNote(id, editText.trim());
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const result = await api.summarizeNotes(category);
      setSummary(result.summary);
    } catch (err) {
      setSummary((err as Error).message);
    }
    setSummarizing(false);
  };

  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
      >
        <span className="text-[10px]">{expanded ? '▼' : '▶'}</span>
        Notes{notes.length > 0 && ` (${notes.length})`}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {notes.length === 0 && !adding && <p className="text-xs text-stone-300">No notes yet</p>}

          {notes.map((note) => (
            <div key={note.id} className="group rounded-lg bg-stone-50 px-3 py-2">
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full resize-none rounded border border-stone-200 px-2 py-1.5 text-sm focus:border-stone-400 focus:outline-none"
                    rows={2}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUpdate(note.id);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      className="text-xs text-stone-500 hover:text-stone-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-stone-300 hover:text-stone-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-600">{note.text}</p>
                    {note.articleTitle && (
                      <p className="mt-0.5 text-xs text-stone-300">from: {note.articleTitle}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditText(note.text);
                      }}
                      className="text-xs text-stone-300 hover:text-stone-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-xs text-stone-300 hover:text-rose-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add note input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add a note..."
              className="min-w-0 flex-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm focus:border-stone-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="shrink-0 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {/* AI Summary */}
          {notes.length >= 2 && (
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="mt-1 text-xs text-stone-400 transition-colors hover:text-stone-600"
            >
              {summarizing ? 'Summarizing...' : 'AI Summary'}
            </button>
          )}

          {summary && (
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <div
                className="prose prose-sm prose-stone max-w-none text-sm"
                dangerouslySetInnerHTML={{
                  __html: summary
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>'),
                }}
              />
              <button
                onClick={() => setSummary(null)}
                className="mt-2 text-xs text-stone-300 hover:text-stone-500"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
