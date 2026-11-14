import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import SupportClient, { SupportTicketItem } from "./SupportClient";

export const metadata: Metadata = {
  title: "Support",
  description: "Review and resolve landing page support tickets.",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    redirect(isLocal ? "/login" : "https://shim-hq.vercel.app/login");
  }

  if ((session.user as any).role === "member") {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    redirect(isLocal ? "/portal" : "https://shim-wallet.vercel.app");
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      event: {
        select: { id: true, name: true },
      },
    },
  });

  const initialTickets: SupportTicketItem[] = tickets.map((t) => ({
    id: t.id,
    userId: t.userId,
    reporterName: t.reporterName,
    reporterEmail: t.reporterEmail,
    issueType: t.issueType,
    eventId: t.eventId,
    eventName: t.event?.name || t.eventName || null,
    description: t.description,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    user: t.user
      ? {
          id: t.user.id,
          name: t.user.name,
          email: t.user.email,
          role: t.user.role,
        }
      : null,
  }));

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">
            Support Module
          </h1>
          <p className="text-sm text-zinc-500">
            Track and resolve attendee typos and event concerns submitted from the landing page
          </p>
        </div>
      </div>

      <SupportClient initialTickets={initialTickets} />
    </div>
  );
}
