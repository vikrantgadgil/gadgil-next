import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UrduAdminNav } from "@/components/urdu-admin-nav";

const ADMIN_EMAIL = "vikrant.swapna@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/signin");
  if (session.user.email !== ADMIN_EMAIL) redirect("/urdu");

  return (
    <div style={{ flex: 1 }}>
      <UrduAdminNav />
      <div>{children}</div>
    </div>
  );
}
