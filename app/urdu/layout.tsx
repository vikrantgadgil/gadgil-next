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
    <div className={nastaliq.variable} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', padding: '0.4rem 0', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
        <span style={{ fontWeight: 500, color: '#64748b' }}>Created by Vikrant Gadgil</span>
        <span style={{ margin: '0 0.5rem' }}>·</span>
        <a href="mailto:vik76@yahoo.com" style={{ color: '#94a3b8' }}>vik76@yahoo.com</a>
        <span style={{ margin: '0 0.5rem' }}>·</span>
        <a href="https://linkedin.com/in/vikgadgil" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}>LinkedIn</a>
      </div>
      <UrduNav />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
