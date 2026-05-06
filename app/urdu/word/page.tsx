"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type LetterComponent = {
  letter_urdu: string;
  letter_roman: string;
  position: string;
  form_note: string;
};

type LookupResult = {
  roman: string;
  urdu_script: string;
  meaning: string | null;
  components: LetterComponent[];
  pronunciation_note: string;
  calligraphy_note: string;
  fromCache: boolean;
};

export default function WordLookupPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/urdu/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roman: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lookup failed. Please try again.");
        return;
      }
      setResult(data as LookupResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Word Lookup</h1>
          <p className="mt-1 text-sm text-slate-500">
            Type a word in Roman Urdu to see it in Nastaliq script with a
            letter-by-letter breakdown.
          </p>
        </div>

        {/* ── Input ──────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. mohabbat"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Look up
          </button>
        </form>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* ── Result ─────────────────────────────────────────── */}
        {result && (
          <div className="space-y-6">

            {/* Cache badge */}
            <div>
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
                  result.fromCache
                    ? "bg-slate-100 text-slate-500"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {result.fromCache ? "From cache" : "Fresh lookup"}
              </span>
            </div>

            {/* Large Urdu script */}
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
              <p
                className="text-6xl font-[family-name:var(--font-nastaliq)] leading-loose"
                dir="rtl"
                lang="ur"
              >
                {result.urdu_script}
              </p>
              {result.meaning && (
                <p className="mt-3 text-lg font-medium text-slate-700">
                  {result.meaning}
                </p>
              )}
            </div>

            {/* Notes */}
            {(result.pronunciation_note || result.calligraphy_note) && (
              <div className="space-y-2">
                {result.pronunciation_note && (
                  <p className="text-sm text-slate-500">
                    <span className="font-medium text-slate-700">
                      Pronunciation:{" "}
                    </span>
                    {result.pronunciation_note}
                  </p>
                )}
                {result.calligraphy_note && (
                  <p className="text-sm text-slate-500">
                    <span className="font-medium text-slate-700">
                      Nastaliq:{" "}
                    </span>
                    {result.calligraphy_note}
                  </p>
                )}
              </div>
            )}

            {/* Letter breakdown table */}
            {result.components.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Letter Breakdown
                </h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-4 py-3 text-right">Urdu Letter</th>
                        <th className="px-4 py-3">Roman</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.components.map((c, i) => (
                        <tr
                          key={i}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td
                            className="px-4 py-3 text-right text-xl font-[family-name:var(--font-nastaliq)]"
                            dir="rtl"
                            lang="ur"
                          >
                            {c.letter_urdu}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700">
                            {c.letter_roman}
                          </td>
                          <td className="px-4 py-3 capitalize text-slate-600">
                            {c.position}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {c.form_note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
