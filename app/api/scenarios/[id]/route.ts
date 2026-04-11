import { auth } from "@/auth";
import { db } from "@/lib/db";
import { retirementScenarios, type RetirementInputs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// GET a single scenario (returns inputs so the planner can load it)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [scenario] = await db
    .select()
    .from(retirementScenarios)
    .where(
      and(
        eq(retirementScenarios.id, id),
        eq(retirementScenarios.userId, session.user.id)
      )
    );

  if (!scenario) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(scenario);
}

// PUT — rename or update inputs of an existing scenario
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, inputs } = body as { name?: string; inputs?: RetirementInputs };

  const [updated] = await db
    .update(retirementScenarios)
    .set({
      ...(name !== undefined && { name }),
      ...(inputs !== undefined && { inputs }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(retirementScenarios.id, id),
        eq(retirementScenarios.userId, session.user.id)
      )
    )
    .returning({
      id: retirementScenarios.id,
      name: retirementScenarios.name,
      updatedAt: retirementScenarios.updatedAt,
    });

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(retirementScenarios)
    .where(
      and(
        eq(retirementScenarios.id, id),
        eq(retirementScenarios.userId, session.user.id)
      )
    )
    .returning({ id: retirementScenarios.id });

  if (!deleted) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
