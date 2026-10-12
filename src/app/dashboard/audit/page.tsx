import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AuditClient from "./AuditClient";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Get all events for this organizer
  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    select: { id: true, name: true }
  });
  
  const eventIds = events.map(e => e.id);

  // Get all certificates for these events
  const certificates = await prisma.certificate.findMany({
    where: { eventId: { in: eventIds } },
    select: { id: true, recipientName: true, recipientEmail: true, eventId: true }
  });

  const certIds = certificates.map(c => c.id);

  // Get all audit logs for these certificates
  const auditLogs = await prisma.auditLog.findMany({
    where: { certificateId: { in: certIds } },
    orderBy: { createdAt: "desc" }
  });

  const certMap = new Map(certificates.map(c => [c.id, c]));
  const eventMap = new Map(events.map(e => [e.id, e]));

  const serializedLogs = auditLogs.map(log => {
    const cert = certMap.get(log.certificateId);
    const event = cert ? eventMap.get(cert.eventId) : null;
    
    return {
      id: log.id,
      action: log.action,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
      certificate: cert ? {
        id: cert.id,
        recipientName: cert.recipientName,
        recipientEmail: cert.recipientEmail,
        event: {
          name: event?.name || "Unknown Event"
        }
      } : null
    };
  });

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">Audit Trail</h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">Every attendance scan, issuance, claim, and revocation</p>
        </div>
      </div>
      
      <AuditClient initialLogs={serializedLogs} />
    </div>
  );
}
