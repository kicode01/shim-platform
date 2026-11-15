import { NextResponse } from "next/server";
import { requireApiStaffAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { isValidSupportStatus, SUPPORT_STATUSES } from "@/lib/support";
import {
  canOrganizerAccessTicket,
  isReporterVerifiedAttendee,
  serializeSupportTicket,
} from "@/lib/support-server";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireApiStaffAccess("support");
  if (error) return error;

  const { id } = await props.params;

  try {
    const body = await req.json();

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Support ticket not found." },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "admin";
    let attendeeVerified = false;

    if (!isAdmin) {
      const access = await canOrganizerAccessTicket(user.id, existing);
      attendeeVerified = access.attendeeVerified;
      if (!access.allowed) {
        return NextResponse.json(
          {
            message:
              "You can only access attendee-verified or admin-shared concerns for your own events.",
          },
          { status: 403 }
        );
      }

      if (body?.sharedWithOrganizer !== undefined) {
        return NextResponse.json(
          { message: "Only administrators can change ticket delegation settings." },
          { status: 403 }
        );
      }
    } else {
      attendeeVerified = await isReporterVerifiedAttendee(
        existing.eventId,
        existing.reporterEmail
      );
    }

    const updateData: {
      status?: string;
      resolvedAt?: Date | null;
      sharedWithOrganizer?: boolean;
      adminNotes?: string | null;
    } = {};

    if (body?.status !== undefined) {
      const status = typeof body.status === "string" ? body.status.trim() : "";
      if (!isValidSupportStatus(status)) {
        return NextResponse.json(
          {
            message: `Invalid status. Allowed values: ${SUPPORT_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.status = status;
      updateData.resolvedAt = status === "Resolved" ? new Date() : null;
    }

    if (isAdmin && body?.sharedWithOrganizer !== undefined) {
      if (typeof body.sharedWithOrganizer !== "boolean") {
        return NextResponse.json(
          { message: "sharedWithOrganizer must be a boolean." },
          { status: 400 }
        );
      }
      updateData.sharedWithOrganizer = body.sharedWithOrganizer;
    }

    if (body?.adminNotes !== undefined) {
      if (body.adminNotes !== null && typeof body.adminNotes !== "string") {
        return NextResponse.json(
          { message: "Notes must be a string." },
          { status: 400 }
        );
      }
      const trimmed = typeof body.adminNotes === "string" ? body.adminNotes.trim() : "";
      if (trimmed.length > 2000) {
        return NextResponse.json(
          { message: "Resolution notes must be 2000 characters or fewer." },
          { status: 400 }
        );
      }
      updateData.adminNotes = trimmed || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid support ticket updates provided." },
        { status: 400 }
      );
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
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
      },
    });

    return NextResponse.json({
      message: updateData.status
        ? `Ticket marked as ${updateData.status}.`
        : "Support ticket updated.",
      ticket: serializeSupportTicket(updatedTicket, attendeeVerified),
    });
  } catch (error) {
    console.error("Failed to update support ticket:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
