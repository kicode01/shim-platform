import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import DashboardClient from "./DashboardClient";
import Link from "next/link";
import { Plus, Stamp } from "lucide-react";

export const metadata: Metadata = {
  title: "Overview",
  description: "Organizer dashboard for managing events, templates, and digital certificates.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Load server-side initial stats and certificates
  const [totalCertificates, validCertificates, revokedCertificates, totalTemplates, certificates] = await Promise.all([
    prisma.certificate.count(),
    prisma.certificate.count({ where: { status: "valid" } }),
    prisma.certificate.count({ where: { status: "revoked" } }),
    prisma.template.count(),
    prisma.certificate.findMany({
      take: 20,
      orderBy: { issueDate: "desc" },
      include: {
        template: { select: { id: true, name: true } },
        issuer: { select: { name: true, email: true } }
      }
    })
  ]);

  const initialStats = {
    totalCertificates,
    validCertificates,
    revokedCertificates,
    totalTemplates,
    validationRate: totalCertificates > 0 ? Math.round((validCertificates / totalCertificates) * 100) : 100
  };

  const serializedCertificates = certificates.map(c => ({
    ...c,
    issueDate: c.issueDate.toISOString(),
  }));

  return (
    <div className="dashboard-bg" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <main className="page-container-wide animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: "2rem", paddingTop: "2rem" }}>
        <DashboardClient 
          initialCertificates={serializedCertificates} 
          initialStats={initialStats} 
        />
      </main>
    </div>
  );
}
