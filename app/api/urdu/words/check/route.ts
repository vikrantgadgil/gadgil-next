import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduUserWords } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roman = searchParams.get("roman");

  if (!roman) {
    return Response.json({ error: "Missing roman" }, { status: 400 });
  }

  const [row] = await db
    .select({ id: urduUserWords.id })
    .from(urduUserWords)
    .where(
      and(
        eq(urduUserWords.userId, session.user.email),
        eq(urduUserWords.roman, roman.toLowerCase().trim())
      )
    )
    .limit(1);

  return Response.json({ saved: !!row });
}
