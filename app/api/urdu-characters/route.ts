import { db } from "@/lib/db";
import { urduCharacters } from "@/lib/db/schema/urdu-characters";

export async function GET() {
  try {
    const characters = await db
      .select()
      .from(urduCharacters)
      .orderBy(urduCharacters.id);

    return Response.json({ characters });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch characters";
    return Response.json({ error: message }, { status: 500 });
  }
}
