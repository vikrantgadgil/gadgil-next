"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const ADMIN_EMAIL = "vikrant.swapna@gmail.com";

const TABS = [
  { href: "/urdu/word", label: "Word Lookup" },
  { href: "/urdu/ready-reckoner", label: "Ready Reckoner" },
  { href: "/urdu/quiz/letter", label: "Letter Quiz" },
  { href: "/urdu/quiz/word", label: "Word Quiz" },
  { href: "/urdu/quiz/sentence", label: "Sentence Quiz" },
  { href: "/urdu/words", label: "My Words" },
] as const;


export function UrduNav() {
  const path = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-1 px-6">
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
        {isAdmin && (
          <Link
            href="/urdu/admin"
            className="ml-auto border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            Admin
          </Link>
        )}
      </div>
    </nav>
  );
}
