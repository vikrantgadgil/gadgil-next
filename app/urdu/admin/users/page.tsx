import { db } from "@/lib/db";
import { users, urduQuizHistory, urduUserWords } from "@/lib/db/schema";
import { count, eq, desc } from "drizzle-orm";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const [allUsers, quizCounts, savedWordCounts] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .orderBy(desc(users.emailVerified)),
    db
      .select({ userId: urduQuizHistory.userId, cnt: count() })
      .from(urduQuizHistory)
      .groupBy(urduQuizHistory.userId),
    db
      .select({ userId: urduUserWords.userId, cnt: count() })
      .from(urduUserWords)
      .groupBy(urduUserWords.userId),
  ]);

  const quizMap = new Map(quizCounts.map((r) => [r.userId, r.cnt]));
  const wordsMap = new Map(savedWordCounts.map((r) => [r.userId, r.cnt]));

  const rows = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    joinedAt: u.emailVerified
      ? u.emailVerified.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      : null,
    quizCount: quizMap.get(u.id) ?? 0,
    savedWords: wordsMap.get(u.id) ?? 0,
  }));

  return (
    <main className="bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Total users:{" "}
            <span className="font-medium text-slate-700">{rows.length}</span>
          </p>
        </div>
        <UsersTable users={rows} />
      </div>
    </main>
  );
}
