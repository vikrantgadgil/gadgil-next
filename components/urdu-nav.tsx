"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/urdu/word", label: "Word Lookup" },
  { href: "/urdu/quiz/letter", label: "Letter Quiz" },
  { href: "/urdu/quiz/word", label: "Word Quiz" },
] as const;

export function UrduNav() {
  const path = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl gap-1 px-6">
        {TABS.map(({ href, label }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
