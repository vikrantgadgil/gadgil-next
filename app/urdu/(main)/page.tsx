import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const MODES = [
  {
    href: "/urdu/word",
    emoji: "🔤",
    title: "Word Lookup",
    description:
      "Type a Roman word, see it in Urdu script with a letter-by-letter breakdown.",
  },
  {
    href: "/urdu/quiz/letter",
    emoji: "حروف",
    title: "Letter Quiz",
    description:
      "Recognize Urdu letters in all four positional forms — initial, medial, final, isolated.",
  },
  {
    href: "/urdu/quiz/word",
    emoji: "📖",
    title: "Word Quiz",
    description:
      "See an Urdu word and identify it by its length and meaning.",
  },
] as const;

export default function UrduHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-slate-400">
            Urdu Writing Practice
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            اردو سیکھیں
          </h1>
          <p className="mt-2 text-slate-500">
            Build reading and writing skills in Urdu script.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {MODES.map(({ href, emoji, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <span className="mb-1 text-3xl" dir="rtl">
                    {emoji}
                  </span>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                  <span className="mt-4 block text-xs font-medium text-slate-400 transition-colors group-hover:text-slate-600">
                    Open →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
