import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getEffectiveCertificateStatus } from "@/lib/security";
import { requireDashboardPageAccess } from "@/lib/auth-guard";
import CredentialsClient from "./CredentialsClient";

export const metadata: Metadata = {
  title: "Credentials",
  description: "Manage issued credentials.",
};

export default async function CredentialsPage() {
  const user = await requireDashboardPageAccess("credentials");

  const userRole = user.role;
  const userId = user.id;

  const scopeWhere = userRole === "admin" ? {} : { issuerId: userId };

  // Load active certificates and archived/trash count in parallel
  const [certificates, trashCount] = await Promise.all([
    prisma.certificate.findMany({
      where: { ...scopeWhere, deletedAt: null },
      take: 50,
      orderBy: { issueDate: "desc" },
      include: {
        template: { select: { id: true, name: true } },
        issuer: { select: { name: true, email: true } }
      }
    }),
    prisma.certificate.count({
      where: { ...scopeWhere, deletedAt: { not: null } },
    }),
  ]);

  const serializedCertificates = certificates.map(c => ({
    ...c,
    status: getEffectiveCertificateStatus(c),
    issueDate: c.issueDate.toISOString(),
    validityDate: c.validityDate ? c.validityDate.toISOString() : null,
    deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
  }));

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">Credentials</h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">Manage all issued credentials</p>
        </div>
      </div>
      
      <CredentialsClient
        initialCertificates={serializedCertificates}
        initialTrashCount={trashCount}
        isAdmin={userRole === "admin"}
      />
    </div>
  );
}
