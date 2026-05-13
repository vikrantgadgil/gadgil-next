import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Noto_Nastaliq_Urdu, Noto_Naskh_Arabic } from "next/font/google";

const nastaliq = Noto_Nastaliq_Urdu({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-nastaliq",
});

const naskh = Noto_Naskh_Arabic({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-naskh",
});

export default async function UrduLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/urdu");
  }

  return (
    <div
      className={`${nastaliq.variable} ${naskh.variable}`}
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}
