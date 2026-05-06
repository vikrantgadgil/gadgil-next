import Link from "next/link";
import { Noto_Nastaliq_Urdu } from "next/font/google";

const nastaliq = Noto_Nastaliq_Urdu({
  weight: ["400"],
  subsets: ["arabic"],
  variable: "--font-nastaliq",
});

const PROJECTS = [
  {
    href: "/projects/retirement-planner",
    emoji: "📊",
    emojiClass: "",
    title: "Retirement Planner",
    description:
      "Plan your retirement with tax modeling, asset allocation, and year-by-year projections.",
  },
  {
    href: "/projects/coin-toss-casino",
    emoji: "🎰",
    emojiClass: "",
    title: "Coin Toss Casino",
    description:
      'A thought experiment about risk. See how a "guaranteed" $100/day strategy can expose you to catastrophic loss.',
  },
  {
    href: "/urdu",
    emoji: "اردو",
    emojiClass: "font-[family-name:var(--font-nastaliq)] leading-none",
    title: "Urdu Writing Practice",
    description:
      "Learn Urdu script — look up words, practice letters, and quiz yourself. Powered by AI.",
  },
];

export default function ProjectsPage() {
  return (
    <main className={`${nastaliq.variable} min-h-screen bg-slate-50 p-6 sm:p-10`}>
      <div className="mx-auto max-w-4xl">

        <div className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-slate-400">
            Vikrant Gadgil
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {PROJECTS.map(({ href, emoji, emojiClass, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <span
                className={`mb-4 text-4xl ${emojiClass}`}
                {...(emojiClass ? { dir: "rtl", lang: "ur" } : {})}
              >
                {emoji}
              </span>
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-slate-700">
                {title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
              <span className="mt-5 text-xs font-medium text-slate-400 transition-colors group-hover:text-slate-600">
                Open project →
              </span>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
