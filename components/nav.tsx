import { auth, signOut } from "@/auth";
import Link from "next/link";

export async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Vikrant Gadgil
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/urdu"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Urdu
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:block">
                {session.user.name ?? session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/signin"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
