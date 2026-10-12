import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EventDetailsClient from "./EventDetailsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendees",
  description: "Manage attendees.",
};

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return notFound();
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { checkedInAt: 'desc' }
      },
      certificates: {
        select: { id: true, status: true, recipientEmail: true }
      }
    }
  });

  const userRole = (session.user as any).role;
  if (!event || (userRole !== "admin" && event.organizerId !== session.user.id)) {
    notFound();
  }

  // Create a map to quickly check if an attendee has a certificate and get its ID/status
  const certificateMap = new Map(
    event.certificates
      .filter(c => c.recipientEmail)
      .map(c => [c.recipientEmail!, { id: c.id, status: c.status }])
  );

  // Fetch templates for the Default Template dropdown
  const templates = await prisma.template.findMany({
    where: userRole === "admin" ? {} : { userId: session.user.id },
    select: { id: true, name: true }
  });

  // Serialize the data
  const serializedEvent = {
    id: event.id,
    name: event.name,
    date: event.date ? event.date.toISOString() : null,
    description: event.description,
    defaultRole: event.defaultRole,
    defaultTemplateId: event.defaultTemplateId,
  };

  const serializedAttendances = event.attendances.map(a => {
    const cert = certificateMap.get(a.email);
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      checkedInAt: a.checkedInAt.toISOString(),
      hasCertificate: !!cert,
      certificateId: cert?.id,
      certificateStatus: cert?.status
    };
  });

  return <EventDetailsClient event={serializedEvent} attendances={serializedAttendances} templates={templates} />;
}
