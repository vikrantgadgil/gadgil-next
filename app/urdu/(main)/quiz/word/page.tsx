"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type QuizMode = "random" | "mywords";

type Question = {
  urdu_script: string;
  roman: string;
  meaning: string;
  question_type: "meaning" | "spelling";
  correct_answer: string;
  from_cache: boolean;
};

type CheckResult = {
  is_correct: boolean;
  correct_answer: string;
  feedback: string;
  meaning: string;
  roman: string;
};

type SavedWord = {
  id: string;
  roman: string;
  urduScript: string;
  meaning: string;
};

export default function WordQuizPage() {
  const [quizMode, setQuizMode] = useState<QuizMode>("random");

  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [myWordsEmpty, setMyWordsEmpty] = useState(false);
  const [lastShown, setLastShown] = useState<string[]>([]);

  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [wordSaved, setWordSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function fetchRandomQuestion(excluded: string[]) {
    const exclude =
      excluded.length > 0 ? `?exclude=${excluded.join(",")}` : "";
    const res = await fetch(`/api/urdu/quiz/word${exclude}`);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    setQuestion(data);
    setLastShown((prev) => [...prev, data.roman.toLowerCase()].slice(-10));
    setWordSaved(false);
  }

  async function fetchMyWordQuestion(excluded: string[]) {
    const res = await fetch("/api/urdu/words/list");
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    const words: SavedWord[] = data.words ?? [];

    if (words.length === 0) {
      setMyWordsEmpty(true);
      setQuestion(null);
      return;
    }
    setMyWordsEmpty(false);

    const available = words.filter(
      (w) => !excluded.includes(w.roman.toLowerCase())
    );
    const pool = available.length > 0 ? available : words;
    const word = pool[Math.floor(Math.random() * pool.length)];

    // Always ask for Roman Urdu transliteration
    const correct_answer = word.roman.toLowerCase();

    setQuestion({
      urdu_script: word.urduScript,
      roman: word.roman,
      meaning: word.meaning,
      question_type: "spelling",
      correct_answer,
      from_cache: false,
    });
    setLastShown((prev) => [...prev, word.roman.toLowerCase()].slice(-10));
    setWordSaved(true);
  }

  async function fetchQuestion(excluded: string[], mode: QuizMode) {
    setLoadingQuestion(true);
    setFetchError(null);
    setMyWordsEmpty(false);
    try {
      if (mode === "mywords") {
        await fetchMyWordQuestion(excluded);
      } else {
        await fetchRandomQuestion(excluded);
      }
    } catch {
      setFetchError("Network error. Please try again.");
    } finally {
      setLoadingQuestion(false);
    }
  }

  useEffect(() => {
    setQuestion(null);
    setAnswer("");
    setResult(null);
    setHasAnswered(false);
    setWordSaved(false);
    setLastShown([]);
    fetchQuestion([], quizMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizMode]);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!question || !answer.trim() || hasAnswered || checking) return;

    setChecking(true);
    try {
      const res = await fetch("/api/urdu/quiz/word/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_answer: answer.trim(),
          correct_answer: question.correct_answer,
          question_type: question.question_type,
          urdu_script: question.urdu_script,
          roman: question.roman,
          meaning: question.meaning,
        }),
      });
      const data: CheckResult = await res.json();
      setResult(data);
      setHasAnswered(true);
      setScore((s) => ({
        correct: s.correct + (data.is_correct ? 1 : 0),
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
    setWordSaved(false);
    setQuestion(null);
    fetchQuestion(lastShown, quizMode);
  }

  async function handleSave() {
    if (!question || saving || wordSaved) return;
    setSaving(true);
    try {
      await fetch("/api/urdu/words/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roman: question.roman,
          urdu_script: question.urdu_script,
          meaning: question.meaning,
        }),
      });
      setWordSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!question || removing) return;
    setRemoving(true);
    try {
      await fetch("/api/urdu/words/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roman: question.roman }),
      });
      handleNext();
    } finally {
      setRemoving(false);
    }
  }

  const inputDisabled = checking || hasAnswered || loadingQuestion;

  return (
    <main className="bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-xl space-y-6">

        {/* ── Header + score ─────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Word Quiz</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Practice reading Urdu words
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-slate-200">
            <span className="font-semibold text-slate-900">
              Score: {score.correct}
            </span>
            <span className="text-slate-400"> / {score.total}</span>
          </div>
        </div>

        {/* ── Mode toggle ────────────────────────────────────── */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setQuizMode("random")}
            className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
              quizMode === "random"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Random Word
          </button>
          <button
            type="button"
            onClick={() => setQuizMode("mywords")}
            className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
              quizMode === "mywords"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            My Words
          </button>
        </div>

        {/* ── Loading ────────────────────────────────────────── */}
        {loadingQuestion && (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">Loading next word...</p>
          </div>
        )}

        {/* ── My Words empty state ───────────────────────────── */}
        {!loadingQuestion && myWordsEmpty && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">You have no saved words yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Save words from{" "}
              <a
                href="/urdu/word"
                className="underline hover:text-slate-600"
              >
                Word Lookup
              </a>{" "}
              or Word Quiz to practice them here.
            </p>
          </div>
        )}

        {/* ── Fetch error ────────────────────────────────────── */}
        {fetchError && !loadingQuestion && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}{" "}
            <button
              onClick={() => fetchQuestion(lastShown, quizMode)}
              className="font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Question ───────────────────────────────────────── */}
        {question && !loadingQuestion && (
          <>
            {/* Word card */}
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white py-10 shadow-sm">
              <p
                className="select-none text-6xl font-[family-name:var(--font-nastaliq)] leading-none"
                dir="rtl"
                lang="ur"
              >
                {question.urdu_script}
              </p>
            </div>

            {/* Instruction */}
            <p className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
              Type the Roman Urdu for this word (not the English meaning)
            </p>

            {/* Input + Check */}
            <form onSubmit={handleCheck} className="flex gap-3">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder='e.g. "kitab", "qalam", "dost"'
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

                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-400">Two scripts</p>
                  <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-3xl font-[family-name:var(--font-nastaliq)] leading-none" dir="rtl" lang="ur">
                        {question.urdu_script}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">Nastaliq</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-3xl font-[family-name:var(--font-naskh)] leading-none" dir="rtl" lang="ur">
                        {question.urdu_script}
                      </p>
                      <span className="text-xs text-slate-400">Naskh</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    Next word →
                  </button>

                  <a
                    href={`/urdu/word?q=${encodeURIComponent(question.roman)}`}
                    className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
                  >
                    See full breakdown →
                  </a>

                  {quizMode === "random" && (
                    wordSaved ? (
                      <span className="text-xs font-medium text-emerald-600">
                        ✓ Saved
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "★"
                        )}{" "}
                        Save this word
                      </button>
                    )
                  )}

                  {quizMode === "mywords" && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={removing}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-400 transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      {removing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "✕"
                      )}{" "}
                      Remove from my list
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
