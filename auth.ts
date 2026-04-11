import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";

// Extend the built-in session type so session.user.id is typed everywhere.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  // JWT strategy: session stored in an encrypted cookie, no DB call
  // needed to validate — keeps proxy.ts fast.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      // On first sign-in, persist the database user ID into the token.
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      // Surface the user ID in the session object available to server
      // components and route handlers.
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
