import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

const protectedRoutes = ["/projects/retirement-planner"];

// auth() wraps the handler and attaches req.auth (the session) before this
// function runs. No database call needed — the session is decoded from the
// JWT cookie, keeping proxy fast.
export default auth((req: NextAuthRequest) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtected = protectedRoutes.some((r) =>
    nextUrl.pathname.startsWith(r)
  );

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals.
    "/((?!api|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
