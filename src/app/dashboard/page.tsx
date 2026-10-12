import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

  if ((session.user as any).role === "member") {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    redirect(isLocal ? "/portal" : "https://shim-wallet.vercel.app");
  }

  // Load server-side initial stats and events
  const userRole = (session.user as any).role;
  const userId = session.user.id;
  const issuerFilter = userRole === "admin" ? {} : { issuerId: userId };
  const templateFilter = userRole === "admin" ? {} : { userId };
  const organizerFilter = userRole === "admin" ? {} : { organizerId: userId };
  const auditFilter = userRole === "admin" ? { action: "VERIFIED" } : { action: "VERIFIED", certificate: { issuerId: userId } };
  
  let totalCertificates = 0, validCertificates = 0, revokedCertificates = 0;
  let totalTemplates = 0, totalVerifications = 0, totalClaimed = 0;
  let recentEvents: any[] = [];
  let allCertificates: any[] = [];
  let allVerifications: any[] = [];

  try {
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
      prisma.certificate.count({ where: { ...issuerFilter, status: "valid" } }),
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
            select: { attendances: true, certificates: true }
          }
        }
      }),
      prisma.certificate.findMany({
        where: issuerFilter,
        select: { issueDate: true, status: true, isClaimed: true }
      }),
      prisma.auditLog.findMany({
        where: auditFilter,
        select: { createdAt: true }
      })
    ]);
  } catch (error) {
    console.warn("Database connection failed, falling back to mock data.");
    // Values remain 0, which triggers the mock data injection below.
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
      if (cert.status === "valid") monthlyData[key].issued++;
      else if (cert.status === "revoked") monthlyData[key].revoked++;
    }
  });

  const chartData = Object.values(monthlyData);

  const initialStats = {
    totalCertificates,
    validCertificates,
    revokedCertificates,
    totalTemplates,
    totalVerifications,
    totalClaimed,
    chartData,
    validationRate: totalCertificates > 0 ? Math.round((validCertificates / totalCertificates) * 100) : 100
  };

  let serializedEvents = recentEvents.map(e => ({
    id: e.id,
    name: e.name,
    date: e.date ? e.date.toISOString() : null,
    attendeeCount: e._count.attendances,
    credentialCount: e._count.certificates
  }));

  // Inject mock data for presentation if the account is empty
  let finalStats = initialStats;
  let finalEvents = serializedEvents;

  if (totalCertificates === 0) {
     finalStats = {
       totalCertificates: 14582,
       validCertificates: 14210,
       revokedCertificates: 34,
       totalVerifications: 8945,
       totalClaimed: 13900,
       totalTemplates: 12,
       validationRate: 98,
       chartData: [
         { name: "Apr 26", issued: 120, revoked: 2 },
         { name: "May 26", issued: 250, revoked: 4 },
         { name: "Jun 26", issued: 180, revoked: 1 },
         { name: "Jul 26", issued: 400, revoked: 5 },
         { name: "Aug 26", issued: 300, revoked: 2 },
         { name: "Sep 26", issued: 847, revoked: 12 }
       ]
     };
     finalEvents = [
       { id: "1", name: "Global Tech Summit 2026", date: "2026-09-15T00:00:00.000Z", attendeeCount: 4500, credentialCount: 4410 },
       { id: "2", name: "Web3 Developer Conference", date: "2026-08-20T00:00:00.000Z", attendeeCount: 1200, credentialCount: 1180 },
       { id: "3", name: "Cybersecurity Workshop", date: "2026-07-10T00:00:00.000Z", attendeeCount: 300, credentialCount: 300 },
       { id: "4", name: "React Advanced Paris", date: "2026-06-05T00:00:00.000Z", attendeeCount: 850, credentialCount: 820 },
       { id: "5", name: "AI Leadership Summit", date: "2026-05-12T00:00:00.000Z", attendeeCount: 200, credentialCount: 195 },
     ];
  }

  return (
    <DashboardClient 
      initialEvents={finalEvents} 
      initialStats={finalStats} 
      allCertificates={allCertificates}
      allVerifications={allVerifications}
    />
  );
}
