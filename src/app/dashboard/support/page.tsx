import type { Metadata } from "next";
import { requireDashboardPageAccess } from "@/lib/auth-guard";
import { listScopedSupportTickets } from "@/lib/support-server";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
  title: "Support",
  description: "Review and resolve landing page support tickets.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await requireDashboardPageAccess("support");
  const isAdmin = user.role === "admin";
  const initialTickets = await listScopedSupportTickets({ user });

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">
            Support Module
          </h1>
          <p className="text-sm text-zinc-500">
            {isAdmin
              ? "Review 100% of support tickets, verify event attendance, and delegate concerns to organizers"
              : "Review attendee-verified concerns and admin-shared tickets for events you organize"}
          </p>
        </div>
      </div>

      <SupportClient initialTickets={initialTickets} isAdmin={isAdmin} />
    </div>
  );
}
