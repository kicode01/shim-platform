import DashboardTransition from "@/components/DashboardTransition";
import Sidebar from "@/components/Sidebar";
import { requireDashboardPageAccess } from "@/lib/auth-guard";
import {
  getFirstAllowedDashboardHref,
  getPageKeyForDashboardPath,
} from "@/lib/permissions";
import { headers } from "next/headers";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-shim-pathname") || "";
  const routeGate = pathname ? getPageKeyForDashboardPath(pathname) : null;
  const user = await requireDashboardPageAccess(routeGate ?? undefined);
  const hasAnyPage = Boolean(
    getFirstAllowedDashboardHref(user.role, user.allowedPages)
  );

  return (
    <div className="flex flex-row bg-white h-full w-full overflow-hidden">
      <Sidebar userRole={user.role} allowedPages={user.allowedPages} />
      <div className="mob-tabbar-space flex-1 flex flex-col min-w-0 overflow-hidden">
        {hasAnyPage ? (
          <DashboardTransition>{children}</DashboardTransition>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">
              <ShieldAlert size={22} />
            </div>
            <h1 className="text-lg font-bold text-zinc-900 mb-1">
              No Dashboard Modules Enabled
            </h1>
            <p className="text-sm text-zinc-500 max-w-md mb-5">
              Your organizer account currently has no workspace pages enabled. Contact an administrator to restore module permissions.
            </p>
            <Link
              href="/logout"
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
