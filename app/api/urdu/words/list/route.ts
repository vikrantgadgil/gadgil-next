import { auth } from "@/auth";
import { db } from "@/lib/db";
import { urduUserWords } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const words = await db
    .select()
    .from(urduUserWords)
    .where(eq(urduUserWords.userId, session.user.email))
    .orderBy(desc(urduUserWords.addedAt));

  return Response.json({ words });
}
