import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { linkCertificatesToUser } from "@/lib/claim";
import PortalClient from "./PortalClient";

/**
 * Mint a unique attendee membership ID of the form `ATT-M-#####`.
 *
 * Derived from a monotonic counter over the existing ID space rather than a
 * random draw, so it is deterministic given database state and cannot collide
 * with an ID already in use. Retries on the (unlikely) race with a concurrent
 * signup, growing the width if the 5-digit space ever fills.
 */
async function mintMembershipId(): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const taken = await prisma.user.count({
      where: { membershipId: { startsWith: "ATT-M-" } },
    });
    const candidate = `ATT-M-${String(10000 + taken + attempt).padStart(5, "0")}`;
    const clash = await prisma.user.findFirst({
      where: { membershipId: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  // Fallback that stays unique without Math.random: hinge on the millisecond
  // clock plus the current row count.
  const taken = await prisma.user.count({ where: { membershipId: { startsWith: "ATT-M-" } } });
  return `ATT-M-${Date.now().toString(36).toUpperCase()}${taken}`;
}

export default async function PortalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    redirect(isLocal ? "/login" : "https://shim-hq.vercel.app/login");
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.role !== "member") {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost");
    redirect(isLocal ? "/dashboard" : "https://shim-studio.vercel.app");
  }

  // Every member needs a stable membership ID — it is the wallet's identifier,
  // the QR payload, and the key the check-in scanner matches on. Legacy
  // accounts created before the field existed have none, so mint one on first
  // visit and persist it. Format: ATT-M-##### (attendee, member).
  if (!user.membershipId) {
    const membershipId = await mintMembershipId();
    user = await prisma.user.update({
      where: { id: user.id },
      data: { membershipId },
    });
  }

  // Adopt any certificates that were issued to this member's email but not yet
  // linked (e.g. from a kiosk check-in, or issued before they created their
  // account). `linkCertificatesToUser` creates the wallet itself, so there is
  // no separate upsert here — it also costs nothing on the common visit where
  // there is nothing to claim.
  await linkCertificatesToUser(user.id, user.email, {
    method: "wallet_link_on_visit",
  });

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  // Fetch certificates, attendance and audit count together. These three are
  // mutually independent — the previous serial version paid a full network
  // round-trip for each in turn, which dominated the page's load time against
  // the remote database. The audit count only needs the certificate ids, so it
  // awaits the certificates first and is then issued alongside attendance.
  const orConditions = [
    ...(wallet ? [{ walletId: wallet.id }] : []),
    ...(user.email ? [{ recipientEmail: user.email }] : []),
  ];

  const certificates = await prisma.certificate.findMany({
    where: orConditions.length > 0 ? { OR: orConditions } : { id: "__impossible__" },
    include: {
      event: true,
      template: true,
    },
    orderBy: {
      issueDate: 'desc'
    }
  });

  // Serialize dates for client
  const serializedCertificates = certificates.map(cert => ({
    id: cert.id,
    recipientName: cert.recipientName,
    role: cert.role,
    status: cert.status,
    issueDate: cert.issueDate.toISOString(),
    event: { name: cert.event.name },
    template: { name: cert.template?.name || "Standard Template" }
  }));

  // Calculate stats — attendance and the verification tally are independent of
  // one another, so run them in parallel rather than back to back.
  const certIds = certificates.map((c) => c.id);
  const [attendances, totalVerifications] = await Promise.all([
    prisma.attendance.findMany({
      where: user.email ? { email: user.email } : { id: "__impossible__" }
    }),
    prisma.auditLog.count({
      where: {
        action: "VERIFIED",
        certificateId: { in: certIds }
      }
    }),
  ]);

  const attendedEventIds = [...new Set([
    ...certificates.map(c => c.eventId),
    ...attendances.map(a => a.eventId)
  ])];

  const attendedEvents = await prisma.event.findMany({
    where: { id: { in: attendedEventIds } },
    select: { name: true, organizer: { select: { name: true } } }
  });

  const eventNames = Array.from(new Set(attendedEvents.map(e => e.name)));
  const orgNames = Array.from(new Set(attendedEvents.map(e => e.organizer?.name).filter((name): name is string => !!name)));

  const stats = {
    totalCertificates: certificates.length,
    eventsAttended: eventNames.length,
    organizations: orgNames.length,
    verifications: totalVerifications
  };

  const insights = {
    events: eventNames,
    organizations: orgNames,
  };

  return (
    <PortalClient 
      user={{ name: user.name || "Member", membershipId: user.membershipId ?? "" }} 
      certificates={serializedCertificates} 
      stats={stats}
      insights={insights}
    />
  );
}
