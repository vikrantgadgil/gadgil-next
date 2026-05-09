"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

type SavedWord = {
  id: string;
  roman: string;
  urduScript: string;
  meaning: string;
  addedAt: string;
};

export default function MyWordsPage() {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/urdu/words/list")
      .then((r) => r.json())
      .then((data) => setWords(data.words ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(roman: string) {
    setRemoving(roman);
    try {
      await fetch("/api/urdu/words/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roman }),
      });
      setWords((prev) => prev.filter((w) => w.roman !== roman));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <main className="bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Words</h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-slate-500">
              Your word list:{" "}
              <span className="font-medium text-slate-700">{words.length}</span>{" "}
              {words.length === 1 ? "word" : "words"}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        )}

        {!loading && words.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">No saved words yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Look up a word or take the Word Quiz to start building your list.
            </p>
          </div>
        )}

        {!loading && words.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-right">Urdu</th>
                  <th className="px-4 py-3">Roman</th>
                  <th className="px-4 py-3">Meaning</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {words.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td
                      className="px-4 py-3 text-right text-2xl font-[family-name:var(--font-nastaliq)]"
                      dir="rtl"
                      lang="ur"
                    >
                      {w.urduScript}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {w.roman}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.meaning}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleRemove(w.roman)}
                        disabled={removing === w.roman}
                        aria-label="Remove word"
                        className="text-slate-300 transition-colors hover:text-red-500 disabled:opacity-50"
                      >
                        {removing === w.roman ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
