"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type SentenceWord = {
  urdu: string;
  roman_primary: string;
  roman_accepted_variants: string[];
  english_meaning: string;
  components: { urdu: string; name: string; roman: string; role: string }[] | null;
};

type SentenceQuestion = {
  id: string;
  urdu: string;
  difficulty: string;
  words: SentenceWord[];
};

type WordResult = {
  urdu: string;
  expected: string;
  userAnswer: string | null;
  isCorrect: boolean;
  isPhoneticVariant: boolean;
  matchedVariant: string | null;
};

type CheckResult = {
  score: number;
  wordsCorrect: number;
  totalWords: number;
  wordResults: WordResult[];
  normalizedExpected: string;
  normalizedUser: string;
  feedback: string;
};

export default function SentenceQuizPage() {
  const [question, setQuestion] = useState<SentenceQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastShown, setLastShown] = useState<string[]>([]);

  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });

  async function fetchQuestion(excluded: string[]) {
    setLoading(true);
    setFetchError(null);
    try {
      const exclude =
        excluded.length > 0 ? `?exclude=${excluded.join(",")}` : "";
      const res = await fetch(`/api/urdu/quiz/sentence${exclude}`);
      if (!res.ok) throw new Error("fetch failed");
      const data: SentenceQuestion = await res.json();
      setQuestion(data);
      setLastShown((prev) => [...prev, data.id].slice(-10));
    } catch {
      setFetchError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setQuestion(null);
    setAnswer("");
    setResult(null);
    setHasAnswered(false);
    setLastShown([]);
    fetchQuestion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!question || !answer.trim() || hasAnswered || checking) return;

    setChecking(true);
    try {
      const res = await fetch("/api/urdu/quiz/sentence/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_answer: answer.trim(),
          sentence_id: question.id,
          words: question.words.map((w) => ({
            urdu: w.urdu,
            roman_primary: w.roman_primary,
            roman_accepted_variants: w.roman_accepted_variants,
          })),
        }),
      });
      const data: CheckResult = await res.json();
      setResult(data);
      setHasAnswered(true);
      setScore((s) => ({
        correct: s.correct + (data.score === 100 ? 1 : 0),
        total: s.total + 1,
      }));
    } catch {
      // non-fatal
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    setAnswer("");
    setResult(null);
    setHasAnswered(false);
    setQuestion(null);
    fetchQuestion(lastShown);
  }

  const inputDisabled = checking || hasAnswered || loading;

  return (
    <main className="bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ── Header + score ─────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sentence Quiz
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Read the Urdu sentence and type it in Roman Urdu
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
            <span className="font-semibold text-slate-900">
              Score: {score.correct}
            </span>
            <span className="text-slate-400"> / {score.total}</span>
          </div>
        </div>

        {/* ── Loading ────────────────────────────────────────── */}
        {loading && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">Loading sentence...</p>
          </div>
        )}

        {/* ── Fetch error ────────────────────────────────────── */}
        {fetchError && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}{" "}
            <button
              onClick={() => fetchQuestion(lastShown)}
              className="font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Question ───────────────────────────────────────── */}
        {question && !loading && (
          <>
            {/* Sentence card */}
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white py-12 shadow-sm">
              <p
                className="select-none text-5xl font-[family-name:var(--font-nastaliq)] leading-relaxed"
                dir="rtl"
                lang="ur"
              >
                {question.urdu}
              </p>
              {question.difficulty && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  {question.difficulty}
                </span>
              )}
            </div>

            {/* Word-by-word hints */}
            <details className="rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800">
                Show word-by-word breakdown
              </summary>
              <div className="border-t border-slate-100 px-4 py-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {question.words.map((w, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-50 p-2 text-center"
                    >
                      <p
                        className="text-lg font-[family-name:var(--font-nastaliq)]"
                        dir="rtl"
                        lang="ur"
                      >
                        {w.urdu}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {w.english_meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            {/* Instruction */}
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              Type the Roman Urdu for this sentence (not the English translation)
            </p>

            {/* Input + Check */}
            <form onSubmit={handleCheck} className="flex gap-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder='e.g. "aaj mausam achha hai"'
                disabled={inputDisabled}
                autoFocus
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={inputDisabled || !answer.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {checking && <Loader2 className="h-4 w-4 animate-spin" />}
                Check
              </button>
            </form>

            {/* Result */}
            {result && (
              <div
                className={`rounded-2xl border px-5 py-4 ${
                  result.score === 100
                    ? "border-emerald-200 bg-emerald-50"
                    : result.score >= 60
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.score === 100 ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        result.score === 100
                          ? "text-emerald-800"
                          : result.score >= 60
                          ? "text-amber-800"
                          : "text-red-700"
                      }`}
                    >
                      {result.feedback}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Score: {result.score}% ({result.wordsCorrect}/{result.totalWords} words correct)
                    </p>
                  </div>
                </div>

                {/* Word-by-word results */}
                <div className="mt-4 space-y-2">
                  {result.wordResults.map((wr, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        wr.isCorrect
                          ? "bg-emerald-50/50"
                          : "bg-red-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-lg font-[family-name:var(--font-nastaliq)]"
                          dir="rtl"
                          lang="ur"
                        >
                          {wr.urdu}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="font-medium text-slate-700">
                          {wr.expected}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {wr.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        {wr.userAnswer && (
                          <span className="text-xs text-slate-400">
                            you: {wr.userAnswer}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    Next sentence →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
