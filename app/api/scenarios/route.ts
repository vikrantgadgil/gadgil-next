import { auth } from "@/auth";
import { db } from "@/lib/db";
import { retirementScenarios, type RetirementInputs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scenarios = await db
    .select({
      id: retirementScenarios.id,
      name: retirementScenarios.name,
      createdAt: retirementScenarios.createdAt,
      updatedAt: retirementScenarios.updatedAt,
    })
    .from(retirementScenarios)
    .where(eq(retirementScenarios.userId, session.user.id))
    .orderBy(retirementScenarios.updatedAt);

  return Response.json(scenarios);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, inputs } = body as { name: string; inputs: RetirementInputs };

  if (!name || !inputs) {
    return Response.json({ error: "name and inputs are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(retirementScenarios)
    .values({
      userId: session.user.id,
      name,
      inputs,
    })
    .returning({
      id: retirementScenarios.id,
      name: retirementScenarios.name,
      createdAt: retirementScenarios.createdAt,
      updatedAt: retirementScenarios.updatedAt,
    });

  return Response.json(created, { status: 201 });
}
