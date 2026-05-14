import Link from "next/link";

const FEATURE_CARDS = [
  {
    href: "/poetry",
    title: "Poetry",
    description:
      "Hindi, Marathi, Urdu-influenced, and English poems.",
    status: "Coming soon" as const,
  },
  {
    href: "/writing",
    title: "Writing",
    description:
      "Essays on technology, leadership, language, and life.",
    status: "Coming soon" as const,
  },
  {
    href: "/projects",
    title: "Projects",
    description:
      "Personal software experiments, tools, and learning apps.",
    status: "Active" as const,
  },
];

const EXPLORING = [
  "Urdu script learning",
  "AI-assisted transcription",
  "Personal finance tools",
  "Poetry archive design",
  "AI agents & tooling",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 sm:py-14">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Vikrant Gadgil
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Technology practitioner, writer, and lifelong student.
          </p>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-400">
            I use this space to collect my projects, poems, essays, and
            experiments with software, language, and ideas.
          </p>

          {/* ── Buttons ────────────────────────────────────── */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/poetry"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
            >
              Explore Poetry
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-700 hover:shadow-md"
            >
              View Projects
            </Link>
          </div>
        </section>

        {/* ── Feature Cards ────────────────────────────────── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-slate-700">
                  {card.title}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    card.status === "Active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {card.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {card.description}
              </p>
            </Link>
          ))}
        </section>

        {/* ── Currently Exploring ──────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Currently exploring
          </h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {EXPLORING.map((item) => (
              <li
                key={item}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-sm text-slate-500 shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Connect ──────────────────────────────────────── */}
        <section className="mt-8 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Connect
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-7">
            <a
              href="https://www.linkedin.com/in/vikgadgil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition-colors hover:text-slate-700"
              aria-label="LinkedIn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="https://x.com/vgadgil"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition-colors hover:text-slate-700"
              aria-label="X (formerly Twitter)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="mailto:vik76@yahoo.com"
              className="text-slate-400 transition-colors hover:text-slate-700"
              aria-label="Email"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
