import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Noto_Nastaliq_Urdu } from "next/font/google";
import { UrduNav } from "@/components/urdu-nav";

const nastaliq = Noto_Nastaliq_Urdu({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-nastaliq",
});

export default async function UrduLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  return (
    <div className={nastaliq.variable}>
      <UrduNav />
      {children}
    </div>
  );
}
