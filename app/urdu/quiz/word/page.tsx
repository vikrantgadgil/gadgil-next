export default function WordQuizPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">Word Quiz</h1>
        <p className="mt-2 text-slate-500">Coming soon.</p>

        {/* Font smoke test — renders in Noto Nastaliq Urdu if font loaded */}
        <p
          className="mt-8 text-5xl font-[family-name:var(--font-nastaliq)]"
          dir="rtl"
          lang="ur"
        >
          اردو
        </p>
      </div>
    </main>
  );
}
