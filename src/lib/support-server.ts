import { prisma } from "@/lib/prisma";
import { isValidSupportIssueType, isValidSupportStatus } from "@/lib/support";

export interface SupportTicketItem {
  id: string;
  userId: string | null;
  reporterName: string | null;
  reporterEmail: string;
  issueType: string;
  eventId: string | null;
  eventName: string | null;
  description: string;
  status: string;
  sharedWithOrganizer: boolean;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attendeeVerified: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
  organizer: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

const ticketInclude = {
  user: {
    select: { id: true, name: true, email: true, role: true },
  },
  event: {
    select: {
      id: true,
      name: true,
      organizerId: true,
      organizer: {
        select: { id: true, name: true, email: true },
      },
    },
  },
} as const;

export function serializeSupportTicket(
  ticket: any,
  attendeeVerified: boolean
): SupportTicketItem {
  return {
    id: ticket.id,
    userId: ticket.userId,
    reporterName: ticket.reporterName,
    reporterEmail: ticket.reporterEmail,
    issueType: ticket.issueType,
    eventId: ticket.eventId,
    eventName: ticket.event?.name || ticket.eventName || null,
    description: ticket.description,
    status: ticket.status,
    sharedWithOrganizer: Boolean(ticket.sharedWithOrganizer),
    adminNotes: ticket.adminNotes ?? null,
    resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    attendeeVerified,
    user: ticket.user
      ? {
          id: ticket.user.id,
          name: ticket.user.name,
          email: ticket.user.email,
          role: ticket.user.role,
        }
      : null,
    organizer: ticket.event?.organizer
      ? {
          id: ticket.event.organizer.id,
          name: ticket.event.organizer.name,
          email: ticket.event.organizer.email,
        }
      : null,
  };
}

export async function isReporterVerifiedAttendee(
  eventId: string | null,
  reporterEmail: string | null
): Promise<boolean> {
  if (!eventId || !reporterEmail?.trim()) return false;
  const match = await prisma.attendance.findFirst({
    where: {
      eventId,
      email: { equals: reporterEmail.trim(), mode: "insensitive" },
    },
    select: { id: true },
  });
  return Boolean(match);
}

export async function canOrganizerAccessTicket(
  organizerUserId: string,
  ticket: {
    issueType: string;
    eventId: string | null;
    reporterEmail: string;
    sharedWithOrganizer: boolean;
    event?: { organizerId: string } | null;
  }
): Promise<{ allowed: boolean; attendeeVerified: boolean }> {
  const attendeeVerified = await isReporterVerifiedAttendee(
    ticket.eventId,
    ticket.reporterEmail
  );

  if (ticket.issueType !== "Event Concern") {
    return { allowed: false, attendeeVerified };
  }
  if (ticket.event?.organizerId !== organizerUserId) {
    return { allowed: false, attendeeVerified };
  }

  return {
    allowed: attendeeVerified || ticket.sharedWithOrganizer,
    attendeeVerified,
  };
}

export async function listScopedSupportTickets(params: {
  user: { id: string; role: string };
  statusParam?: string;
  typeParam?: string;
  search?: string;
}): Promise<SupportTicketItem[]> {
  const { user, statusParam = "", typeParam = "", search = "" } = params;
  const isAdmin = user.role === "admin";
  const where: any = {};

  if (!isAdmin) {
    where.issueType = "Event Concern";
    where.event = { organizerId: user.id };
  }

  if (statusParam && statusParam !== "all" && isValidSupportStatus(statusParam)) {
    where.status = statusParam;
  }

  if (typeParam && typeParam !== "all" && isValidSupportIssueType(typeParam)) {
    if (isAdmin || typeParam === "Event Concern") {
      where.issueType = typeParam;
    } else {
      return [];
    }
  }

  if (search) {
    where.OR = [
      { reporterName: { contains: search, mode: "insensitive" } },
      { reporterEmail: { contains: search, mode: "insensitive" } },
      { eventName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: ticketInclude,
  });

  const eventIds = Array.from(
    new Set(
      tickets
        .map((t) => t.eventId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const attendanceSet = new Set<string>();
  if (eventIds.length > 0) {
    const attendances = await prisma.attendance.findMany({
      where: { eventId: { in: eventIds } },
      select: { eventId: true, email: true },
    });
    for (const row of attendances) {
      if (row.email) {
        attendanceSet.add(
          `${row.eventId}::${row.email.trim().toLowerCase()}`
        );
      }
    }
  }

  const enriched: SupportTicketItem[] = [];
  for (const ticket of tickets) {
    const attendeeVerified = ticket.eventId
      ? attendanceSet.has(
          `${ticket.eventId}::${ticket.reporterEmail.trim().toLowerCase()}`
        )
      : false;

    if (!isAdmin) {
      if (
        ticket.issueType !== "Event Concern" ||
        ticket.event?.organizerId !== user.id ||
        (!attendeeVerified && !ticket.sharedWithOrganizer)
      ) {
        continue;
      }
    }

    enriched.push(serializeSupportTicket(ticket, attendeeVerified));
  }

  return enriched;
}
