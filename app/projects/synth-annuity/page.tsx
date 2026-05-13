import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SynthAnnuityClient } from "./client";

export default async function SynthAnnuityPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  return <SynthAnnuityClient />;
}
