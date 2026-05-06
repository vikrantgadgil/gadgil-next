"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Question = {
  question_glyph: string;
  position: string;
  roman_answer: string;
  letter_name: string;
  hint: string;
};

type CheckResult = {
  is_correct: boolean;
  correct_answer: string;
  feedback: string;
  letter_name: string;
};

export default function LetterQuizPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  async function fetchQuestion() {
    setLoadingQuestion(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/urdu/quiz/letter");
      if (!res.ok) {
        setFetchError("Could not load a question. Please try again.");
        return;
      }
      setQuestion(await res.json());
    } catch {
      setFetchError("Network error. Please try again.");
    } finally {
      setLoadingQuestion(false);
    }
  }

  useEffect(() => {
    fetchQuestion();
  }, []);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!question || !answer.trim() || hasAnswered || checking) return;

    setChecking(true);
    try {
      const res = await fetch("/api/urdu/quiz/letter/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roman_answer: answer.trim(),
          correct_answer: question.roman_answer,
          question: `${question.position}: ${question.question_glyph}`,
        }),
      });
      const data: CheckResult = await res.json();
      setResult(data);
      setHasAnswered(true);
      setScore((s) => ({
        correct: s.correct + (data.is_correct ? 1 : 0),
        total: s.total + 1,
      }));
      if (!data.is_correct) setShowHint(true);
    } catch {
      // non-fatal — don't block the quiz
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    setAnswer("");
    setResult(null);
    setShowHint(false);
    setHasAnswered(false);
    fetchQuestion();
  }

  const inputDisabled = checking || hasAnswered || loadingQuestion;

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-xl space-y-6">

        {/* ── Header + score ─────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Letter Quiz</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Identify the Urdu letter shown below
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
        {loadingQuestion && (
          <div className="flex min-h-[260px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* ── Fetch error ────────────────────────────────────── */}
        {fetchError && !loadingQuestion && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}{" "}
            <button onClick={fetchQuestion} className="font-medium underline">
              Try again
            </button>
          </div>
        )}

        {/* ── Question ───────────────────────────────────────── */}
        {question && !loadingQuestion && (
          <>
            {/* Position badge */}
            <div>
              <span className="inline-block rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                {question.position} form
              </span>
            </div>

            {/* Letter card */}
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-12 shadow-sm">
              <p
                className="select-none text-8xl font-[family-name:var(--font-nastaliq)] leading-none"
                dir="rtl"
                lang="ur"
              >
                {question.question_glyph}
              </p>
            </div>

            {/* Hint toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                {showHint ? "Hide hint" : "Show hint"}
              </button>
              {showHint && (
                <p className="mt-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
                  {question.hint}
                </p>
              )}
            </div>

            {/* Input + Check */}
            <form onSubmit={handleCheck} className="flex gap-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type the letter name in Roman..."
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
                  result.is_correct
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.is_correct ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        result.is_correct ? "text-emerald-800" : "text-red-700"
                      }`}
                    >
                      {result.feedback}
                    </p>
                    {!result.is_correct && (
                      <p className="mt-1 text-sm text-slate-600">
                        Correct answer:{" "}
                        <span className="font-semibold text-slate-900">
                          {result.correct_answer}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                  Next letter →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
