import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold tracking-tight">Gadgil</h1>
          <p className="mt-3 text-slate-600">
            Personal portal for projects, poetry, and writing.
          </p>
          <div className="mt-6">
            <Link
              href="/projects/retirement-planner"
              className="rounded-full bg-slate-900 px-5 py-3 text-white"
            >
              Open Retirement Planner
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
