import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CredentialsClient from "./CredentialsClient";

export const metadata: Metadata = {
  title: "Credentials",
  description: "Manage issued credentials.",
};

export default async function CredentialsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  // Load server-side initial certificates
  const certificates = await prisma.certificate.findMany({
    where: userRole === "admin" ? {} : { issuerId: userId },
    take: 50,
    orderBy: { issueDate: "desc" },
    include: {
      template: { select: { id: true, name: true } },
      issuer: { select: { name: true, email: true } }
    }
  });

  const serializedCertificates = certificates.map(c => ({
    ...c,
    issueDate: c.issueDate.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">Credentials</h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">Manage all issued credentials</p>
        </div>
      </div>
      
      <CredentialsClient initialCertificates={serializedCertificates} />
    </div>
  );
}
