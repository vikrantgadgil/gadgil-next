import { db } from "@/lib/db";
import {
  users,
  urduWordCache,
  urduQuizHistory,
  urduUserWords,
} from "@/lib/db/schema";
import { count } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [
    [{ userCount }],
    [{ cacheCount }],
    [{ quizCount }],
    [{ savedWordCount }],
  ] = await Promise.all([
    db.select({ userCount: count() }).from(users),
    db.select({ cacheCount: count() }).from(urduWordCache),
    db.select({ quizCount: count() }).from(urduQuizHistory),
    db.select({ savedWordCount: count() }).from(urduUserWords),
  ]);

  const stats = [
    { label: "Total Users", value: userCount },
    { label: "Total Saved Words", value: savedWordCount },
    { label: "Words in Cache", value: cacheCount },
    { label: "Quiz Attempts", value: quizCount },
  ];

  return (
    <main className="bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Urdu Writing Practice — Admin
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ label, value }) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Sections
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/urdu/admin/users">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>View all registered users</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Card className="cursor-not-allowed opacity-50">
              <CardHeader>
                <CardTitle>Usage</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-not-allowed opacity-50">
              <CardHeader>
                <CardTitle>Cache</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
