"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/urdu/admin", label: "Dashboard" },
  { href: "/urdu/admin/users", label: "Users" },
] as const;

export function UrduAdminNav() {
  const path = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center px-6">
        <Link
          href="/urdu/word"
          className="mr-6 shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          ← Back to Urdu app
        </Link>
        <div className="flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active = path === href;
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
      </div>
    </nav>
  );
}
