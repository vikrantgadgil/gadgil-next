import { signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = callbackUrl ?? "/projects/retirement-planner";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Vikrant Gadgil
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to access the Retirement Planner and save your scenarios.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: destination });
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.583 9 3.583z"
        fill="#EA4335"
      />
    </svg>
  );
}
