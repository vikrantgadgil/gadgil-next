import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduUserWords } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { roman } = (body ?? {}) as { roman?: string };

  if (!roman) {
    return Response.json({ error: "Missing roman" }, { status: 400 });
  }

  await db
    .delete(urduUserWords)
    .where(
      and(
        eq(urduUserWords.userId, session.user.email),
        eq(urduUserWords.roman, roman.toLowerCase().trim())
      )
    );

  return Response.json({ success: true });
}
