import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getEffectiveCertificateStatus } from "@/lib/security";

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
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    redirect(isLocal ? "/login" : "https://shim-hq.vercel.app/login");
  }

  if ((session.user as any).role === "member") {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    redirect(isLocal ? "/portal" : "https://shim-wallet.vercel.app");
  }

  // Load server-side initial stats and events
  const userRole = (session.user as any).role;
  const userId = session.user.id;
  const issuerFilter = userRole === "admin" ? { deletedAt: null } : { issuerId: userId, deletedAt: null };
  const templateFilter = userRole === "admin" ? {} : { userId };
  const organizerFilter = userRole === "admin" ? {} : { organizerId: userId };
  const auditFilter = userRole === "admin" ? { action: "VERIFIED" } : { action: "VERIFIED", certificate: { issuerId: userId } };
  
  let totalCertificates = 0, validCertificates = 0, revokedCertificates = 0;
  let totalTemplates = 0, totalVerifications = 0, totalClaimed = 0;
  let recentEvents: any[] = [];
  let allCertificates: any[] = [];
  let allVerifications: any[] = [];

  try {
    const now = new Date();
    [
      totalCertificates, 
      validCertificates, 
      revokedCertificates, 
      totalTemplates, 
      totalVerifications,
      totalClaimed,
      recentEvents,
      allCertificates,
      allVerifications
    ] = await Promise.all([
      prisma.certificate.count({ where: { ...issuerFilter } }),
      prisma.certificate.count({
        where: {
          ...issuerFilter,
          status: "valid",
          OR: [{ validityDate: null }, { validityDate: { gte: now } }]
        }
      }),
      prisma.certificate.count({ where: { ...issuerFilter, status: "revoked" } }),
      prisma.template.count({ where: templateFilter }),
      prisma.auditLog.count({ where: auditFilter }),
      prisma.certificate.count({ where: { ...issuerFilter, isClaimed: true } }),
      prisma.event.findMany({
        where: organizerFilter,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { attendances: true, certificates: { where: { deletedAt: null } } }
          }
        }
      }),
      prisma.certificate.findMany({
        where: issuerFilter,
        select: { issueDate: true, status: true, validityDate: true, isClaimed: true }
      }),
      prisma.auditLog.findMany({
        where: auditFilter,
        select: { createdAt: true }
      })
    ]);
  } catch (error) {
    console.warn("Failed to load dashboard overview metrics:", error);
  }

  // Aggregate monthly data for the last 6 months
  const monthlyData: Record<string, { name: string, issued: number, revoked: number }> = {};
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Initialize last 6 months
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    monthlyData[key] = { name: key, issued: 0, revoked: 0 };
  }

  // Populate data
  allCertificates.forEach(cert => {
    const d = new Date(cert.issueDate);
    const key = `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    if (monthlyData[key]) {
      const eff = getEffectiveCertificateStatus(cert, today);
      if (eff === "valid") monthlyData[key].issued++;
      else if (eff === "revoked") monthlyData[key].revoked++;
    }
  });

  const chartData = totalCertificates > 0 ? Object.values(monthlyData) : [];

  const initialStats = {
    totalCertificates,
    validCertificates,
    revokedCertificates,
    totalTemplates,
    totalVerifications,
    totalClaimed,
    chartData,
    validationRate: totalCertificates > 0 ? Math.round((validCertificates / totalCertificates) * 100) : 0
  };

  const serializedEvents = recentEvents.map(e => ({
    id: e.id,
    name: e.name,
    date: e.date ? e.date.toISOString() : null,
    attendeeCount: e._count.attendances,
    credentialCount: e._count.certificates
  }));

  return (
    <DashboardClient 
      initialEvents={serializedEvents} 
      initialStats={initialStats} 
      allCertificates={allCertificates}
      allVerifications={allVerifications}
    />
  );
}
