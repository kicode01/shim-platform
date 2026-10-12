import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DashboardTransition from "@/components/DashboardTransition";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    redirect(isLocal ? "/login" : "https://shim-hq.vercel.app/login");
  }

  if ((session.user as any).role === "member") {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    redirect(isLocal ? "/portal" : "https://shim-wallet.vercel.app");
  }

  return (
    <div className="flex flex-row bg-white h-full w-full overflow-hidden">
      <Sidebar />
      <div className="mob-tabbar-space flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTransition>
          {children}
        </DashboardTransition>
      </div>
    </div>
  );
}
