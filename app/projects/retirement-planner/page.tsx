import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RetirementPlannerClient } from "./client";

export default async function RetirementPlannerPage() {
  const session = await auth();

  // proxy.ts handles unauthenticated redirects, but this is a second line of
  // defense (per Next.js auth guide: "majority of security checks should be
  // performed as close as possible to your data source").
  if (!session?.user?.id) {
    redirect("/signin");
  }

  return <RetirementPlannerClient userId={session.user.id} />;
}
