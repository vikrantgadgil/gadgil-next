"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles, Bug, ChevronDown, ChevronUp } from "lucide-react";

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
  roman_primary: string;
  roman_accepted_variants: string[];
  difficulty: string;
  words: SentenceWord[];
  from_ai?: boolean;
};

type WordResult = {
  urdu: string;
  expected: string;
  userAnswer: string | null;
  isCorrect: boolean;
  isPhoneticVariant: boolean;
  matchedVariant: string | null;
};

type AiWordResult = {
  urdu: string;
  expected: string;
  user: string;
  status: "correct" | "accepted_variant" | "incorrect" | "missing" | "extra";
  feedback: string;
};

type AiEvaluationResult = {
  score_percent: number;
  is_correct: boolean;
  overall_feedback: string;
  expected_roman: string;
  user_roman_normalized: string;
  word_results: AiWordResult[];
};

type CheckResult = {
  score: number;
  wordsCorrect: number;
  totalWords: number;
  wordResults: WordResult[];
  normalizedExpected: string;
  normalizedUser: string;
  feedback: string;
  used_ai: boolean;
  ai_evaluation: AiEvaluationResult | null;
};

const TOPICS = [
  { value: "random", label: "Random" },
  { value: "greetings", label: "Greetings" },
  { value: "weather", label: "Weather" },
  { value: "family", label: "Family" },
  { value: "travel", label: "Travel" },
  { value: "school", label: "School" },
  { value: "food", label: "Food" },
  { value: "emotions", label: "Emotions" },
  { value: "daily activities", label: "Daily Life" },
  { value: "shopping", label: "Shopping" },
  { value: "time/day", label: "Time & Day" },
  { value: "polite conversation", label: "Conversation" },
] as const;

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
] as const;

// Track recent sentences globally to avoid repeats across page navigations
const recentSentences: string[] = [];
const MAX_RECENT = 15;

export default function SentenceQuizPage() {
  const [question, setQuestion] = useState<SentenceQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<string>("beginner");
  const [topic, setTopic] = useState<string>("random");

  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkTimedOut, setCheckTimedOut] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Debug state
  const [showDebug, setShowDebug] = useState(false);

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setGenerating(true);
    setFetchError(null);
    setResult(null);
    setHasAnswered(false);
    setAnswer("");

    try {
      // Build exclude list from recent sentences (both IDs and Urdu text)
      const exclude = recentSentences.join(",");
      const params = new URLSearchParams();
      if (exclude) params.set("exclude", exclude);
      params.set("difficulty", difficulty);
      params.set("topic", topic);

      const res = await fetch(`/api/urdu/quiz/sentence?${params.toString()}`);
      if (!res.ok) throw new Error("fetch failed");
      const data: SentenceQuestion = await res.json();
      setQuestion(data);

      // Track for anti-repetition
      const normalizedUrdu = data.urdu.replace(/\s+/g, " ").trim();
      const normalizedRoman = data.roman_primary
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      recentSentences.push(normalizedUrdu);
      recentSentences.push(normalizedRoman);
      // Keep only last MAX_RECENT entries
      while (recentSentences.length > MAX_RECENT) {
        recentSentences.shift();
      }
    } catch {
      setFetchError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, [difficulty, topic]);

  useEffect(() => {
    setQuestion(null);
    setAnswer("");
    setResult(null);
    setHasAnswered(false);
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, topic]);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!question || !answer.trim() || hasAnswered || checking) return;

    setChecking(true);
    setCheckTimedOut(false);

    // Set a UI timeout indicator after 10s (before the 12s backend timeout)
    const uiTimeoutId = setTimeout(() => {
      setCheckTimedOut(true);
    }, 10_000);

    try {
      const res = await fetch("/api/urdu/quiz/sentence/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_answer: answer.trim(),
          sentence_id: question.id,
          urdu_sentence: question.urdu,
          expected_roman: question.roman_primary,
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
      clearTimeout(uiTimeoutId);
      setChecking(false);
      setCheckTimedOut(false);
    }
  }

  function handleNext() {
    setAnswer("");
    setResult(null);
    setHasAnswered(false);
    setQuestion(null);
    fetchQuestion();
  }

  const inputDisabled = checking || hasAnswered || loading || generating;

  // Determine if we're in dev mode
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

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

        {/* ── Difficulty + Topic selectors ───────────────────── */}
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-medium">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDifficulty(d.value)}
                disabled={loading || generating}
                className={`rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 ${
                  difficulty === d.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading || generating}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm focus:border-slate-400 focus:outline-none disabled:opacity-50"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Loading / Generating ───────────────────────────── */}
        {(loading || generating) && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">
              {generating ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Generating sentence...
                </span>
              ) : (
                "Loading sentence..."
              )}
            </p>
          </div>
        )}

        {/* ── Fetch error ────────────────────────────────────── */}
        {fetchError && !loading && !generating && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}{" "}
            <button
              onClick={() => fetchQuestion()}
              className="font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Question ───────────────────────────────────────── */}
        {question && !loading && !generating && (
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
              <div className="flex items-center gap-2">
                {question.difficulty && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {question.difficulty}
                  </span>
                )}
                {question.from_ai && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                    <Sparkles className="h-3 w-3" />
                    AI generated
                  </span>
                )}
              </div>
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
                {checking ? "Evaluating…" : "Check"}
              </button>
            </form>

            {/* Checking indicator with timeout fallback */}
            {checking && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {checkTimedOut ? (
                  <span className="text-amber-600">
                    AI evaluation timed out — falling back to local scoring…
                  </span>
                ) : (
                  <span>Evaluating with AI…</span>
                )}
              </div>
            )}

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
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xs text-slate-500">
                        Score: {result.score}% ({result.wordsCorrect}/{result.totalWords} words correct)
                      </p>
                      {result.used_ai && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI evaluated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Word-by-word results */}
                <div className="mt-4 space-y-2">
                  {result.wordResults.map((wr, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        wr.isCorrect
                          ? wr.isPhoneticVariant
                            ? "bg-amber-50/50 ring-1 ring-amber-200"
                            : "bg-emerald-50/50"
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
                          wr.isPhoneticVariant ? (
                            <CheckCircle2 className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        {wr.userAnswer && (
                          <span className="text-xs text-slate-400">
                            you: {wr.userAnswer}
                          </span>
                        )}
                        {wr.isCorrect && wr.isPhoneticVariant && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            Accepted variant
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expected answer if not perfect */}
                {result.score < 100 && (
                  <div className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">
                    <span className="text-xs font-medium text-slate-500">Expected: </span>
                    <span className="text-slate-700">{result.normalizedExpected}</span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    Next sentence →
                  </button>

                  {/* Debug toggle (dev mode only) */}
                  {isDev && result.ai_evaluation && (
                    <button
                      type="button"
                      onClick={() => setShowDebug(!showDebug)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50"
                    >
                      <Bug className="h-3 w-3" />
                      {showDebug ? "Hide AI JSON" : "Show AI JSON"}
                      {showDebug ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Debug: Show AI evaluation JSON */}
                {isDev && showDebug && result.ai_evaluation && (
                  <div className="mt-3 overflow-auto rounded-lg bg-slate-900 p-4">
                    <pre className="text-xs text-green-400">
                      {JSON.stringify(result.ai_evaluation, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
