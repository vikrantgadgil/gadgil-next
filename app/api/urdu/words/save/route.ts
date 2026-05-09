import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduUserWords } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { roman, urdu_script, meaning } = (body ?? {}) as {
    roman?: string;
    urdu_script?: string;
    meaning?: string;
  };

  if (!roman || !urdu_script || !meaning) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rows = await db
    .insert(urduUserWords)
    .values({
      userId: session.user.email,
      roman: roman.toLowerCase().trim(),
      urduScript: urdu_script,
      meaning,
    })
    .onConflictDoNothing()
    .returning({ id: urduUserWords.id });

  if (rows.length > 0) {
    return Response.json({ success: true, message: "Word saved" });
  }
  return Response.json({ success: false, message: "Already in your list" });
}
