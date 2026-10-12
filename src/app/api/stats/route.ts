import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const issuerFilter = userRole === "admin" ? {} : { issuerId: userId };
    const templateFilter = userRole === "admin" ? {} : { userId };
    const auditFilter = userRole === "admin" ? { action: "VERIFIED" } : { action: "VERIFIED", certificate: { issuerId: userId } };

    const [
      totalCertificates, 
      validCertificates, 
      revokedCertificates, 
      totalTemplates, 
      recentCertificates, 
      allCertificates,
      totalVerifications,
      totalClaimed
    ] = await Promise.all([
      prisma.certificate.count({ where: { ...issuerFilter } }),
      prisma.certificate.count({ where: { ...issuerFilter, status: "valid" } }),
      prisma.certificate.count({ where: { ...issuerFilter, status: "revoked" } }),
      prisma.template.count({ where: templateFilter }),
      prisma.certificate.findMany({
        where: issuerFilter,
        take: 6,
        orderBy: { issueDate: "desc" },
        include: {
          template: { select: { name: true } }
        }
      }),
      prisma.certificate.findMany({
        where: issuerFilter,
        select: { issueDate: true, status: true }
      }),
      prisma.auditLog.count({ where: auditFilter }),
      prisma.certificate.count({ where: { ...issuerFilter, isClaimed: true } })
    ]);

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

    return NextResponse.json({
      totalCertificates,
      validCertificates,
      revokedCertificates,
      totalTemplates,
      totalVerifications,
      totalClaimed,
      recentCertificates,
      chartData,
      validationRate: totalCertificates > 0 ? Math.round((validCertificates / totalCertificates) * 100) : 100
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
  }
}
