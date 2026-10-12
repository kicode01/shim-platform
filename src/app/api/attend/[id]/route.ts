import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCertificateEmail, sendCheckInConfirmationEmail } from "@/lib/email";
import { linkCertificatesByEmail } from "@/lib/claim";
import { computeCertificateFingerprint } from "@/lib/security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const { id: eventId } = await params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Record attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_email: {
          eventId,
          email,
        },
      },
      update: {
        name,
        checkedInAt: new Date(),
      },
      create: {
        eventId,
        name,
        email,
        role: event.defaultRole,
      },
    });

    // Does a Shim account already exist for this email?
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const accountExists = Boolean(existingUser);

    // Deferred issuance: no template configured on the event, so no certificate
    // is created yet. Still send a check-in confirmation so the attendee has
    // something in their inbox and knows what happens next.
    if (!event.defaultTemplateId) {
      const emailResult = await sendCheckInConfirmationEmail({
        to: email,
        recipientName: name,
        eventName: event.name,
        accountExists,
      });

      return NextResponse.json({
        success: true,
        message: "Checked in successfully. Certificate will be issued later.",
        accountExists,
        deferred: true,
        emailSent: emailResult.success,
      });
    }

    // Look for an existing certificate for this event/email to avoid duplicates
    let certificate = await prisma.certificate.findFirst({
      where: {
        eventId,
        recipientEmail: email,
      },
    });

    // Issue certificate instantly if none exists
    if (!certificate) {
      certificate = await prisma.certificate.create({
        data: {
          recipientName: name,
          recipientEmail: email,
          role: attendance.role,
          status: "valid",
          eventId: event.id,
          templateId: event.defaultTemplateId,
          issuerId: event.organizerId, // The event organizer is the issuer
        },
      });

      const fingerprint = computeCertificateFingerprint({
        id: certificate.id,
        recipientName: certificate.recipientName,
        role: certificate.role,
        eventName: event.name,
        issueDate: certificate.issueDate,
        issuerId: certificate.issuerId,
      });

      await prisma.auditLog.create({
        data: {
          action: "ISSUED",
          certificateId: certificate.id,
          ipAddress: req.headers.get("x-forwarded-for") || "Kiosk",
          details: JSON.stringify({ method: "kiosk_checkin", fingerprint }),
        },
      });
    }

    // If this email already has an account, put the certificate straight into
    // that account's wallet. This is what makes "existing user signs in and the
    // certificate is already there" true.
    if (accountExists) {
      await linkCertificatesByEmail(email, {
        method: "kiosk_checkin_link",
        extraCertificateIds: [certificate.id],
      });
    }

    // Email the certificate. New users also get a signup/login link with their
    // email pre-filled; existing users get a "sign in to see it" link.
    const emailResult = await sendCertificateEmail({
      to: email,
      recipientName: name,
      role: certificate.role,
      eventName: event.name,
      certificateId: certificate.id,
      accountExists,
    });

    return NextResponse.json({
      success: true,
      message: accountExists
        ? "Checked in. Certificate added to your existing account."
        : "Checked in and certificate issued.",
      certificateId: certificate.id,
      accountExists,
      emailSent: emailResult.success,
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check in" },
      { status: 500 }
    );
  }
}
