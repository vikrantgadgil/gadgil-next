import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold">Vikrant Gadgil</h1>

        <p className="text-slate-600">Technology, poetry, and essays.</p>

        <hr className="my-8 border-slate-200" />

        <div className="space-y-3 text-lg">
          <div>
            <Link href="/projects/retirement-planner" className="hover:underline">
              Projects
            </Link>
          </div>

          <div>
            <span className="text-slate-400">Poetry (coming soon)</span>
          </div>

          <div>
            <span className="text-slate-400">Writing (coming soon)</span>
          </div>
        </div>
      </div>
    </main>
  );
}