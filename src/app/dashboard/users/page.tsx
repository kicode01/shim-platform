import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireDashboardPageAccess } from "@/lib/auth-guard";
import { resolveEffectiveAllowedPages } from "@/lib/permissions";
import { getProfileEditingSetting } from "@/lib/features";
import UsersClient, { ManageUser } from "./UsersClient";

export const metadata: Metadata = {
  title: "User Governance",
  description: "Manage user accounts, tiers, profile corrections, and organizer workspace access.",
};

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const guardUser = await requireDashboardPageAccess("admin-only");
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialSearch = typeof resolvedSearchParams?.search === "string"
    ? resolvedSearchParams.search.trim()
    : "";

  const [users, certificates, initialProfileFeature] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        allowedPages: true,
        certificateRole: true,
        membershipId: true,
        _count: {
          select: { events: true },
        },
      },
    }),
    prisma.certificate.findMany({
      where: { deletedAt: null },
      select: { recipientEmail: true },
    }),
    getProfileEditingSetting(),
  ]);

  const certCountByEmail = new Map<string, number>();
  for (const c of certificates) {
    const key = c.recipientEmail?.trim().toLowerCase();
    if (key) {
      certCountByEmail.set(key, (certCountByEmail.get(key) ?? 0) + 1);
    }
  }

  const initialUsers: ManageUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    allowedPages: resolveEffectiveAllowedPages(u.role, u.allowedPages),
    certificateRole: u.certificateRole,
    membershipId: u.membershipId,
    eventCount: u._count.events,
    certificateCount: u.email
      ? certCountByEmail.get(u.email.trim().toLowerCase()) ?? 0
      : 0,
  }));

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">
            User Governance
          </h1>
          <p className="text-sm text-zinc-500">
            Control account tiers, profile corrections, suspension states, and per-organizer workspace pages
          </p>
        </div>
      </div>

      <UsersClient
        initialUsers={initialUsers}
        currentUserId={guardUser.id}
        initialSearch={initialSearch}
        initialProfileFeature={initialProfileFeature}
      />
    </div>
  );
}
