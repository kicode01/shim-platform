import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCertificateFingerprint } from "@/lib/security";
import { linkCertificatesByEmail } from "@/lib/claim";
import { sendCertificateEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "organizer" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, membershipId } = await request.json();

    if (!eventId || !membershipId) {
      return NextResponse.json({ error: "Missing eventId or membershipId" }, { status: 400 });
    }

    // 1. Verify Event exists and belongs to the organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event || (session.user.role !== "admin" && event.organizerId !== session.user.id)) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
    }

    // Clean up membershipId (in case they typed #MEMBER-123 or scanned a URL or query string)
    let cleanId = membershipId.replace(/^#/, "").trim();
    if (cleanId.includes("/")) {
      const parts = cleanId.split("/");
      cleanId = parts[parts.length - 1].split("?")[0].trim();
    }

    // 2. Find Member by membershipId
    const member = await prisma.user.findFirst({
      where: { membershipId: { equals: cleanId, mode: "insensitive" } }
    });

    if (!member || member.role !== "member") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    
    if (!member.email) {
      return NextResponse.json({ error: "Member has no associated email" }, { status: 400 });
    }

    // 3. Create or Update Attendance Record
    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_email: {
          eventId: eventId,
          email: member.email,
        }
      },
      update: {
        checkedInAt: new Date(),
      },
      create: {
        eventId: eventId,
        name: member.name || "Unknown Member",
        email: member.email,
        checkedInAt: new Date(),
        role: event.defaultRole,
      }
    });

    let certificateId: string | null = null;
    let certificateIssued = false;

    // 4. If the event has a default template configured, automatically issue credential
    if (event.defaultTemplateId) {
      let certificate = await prisma.certificate.findFirst({
        where: {
          eventId: event.id,
          recipientEmail: { equals: member.email, mode: "insensitive" },
        }
      });

      if (!certificate) {
        certificate = await prisma.certificate.create({
          data: {
            recipientName: member.name || "Attendee",
            recipientEmail: member.email,
            role: attendance.role,
            status: "valid",
            eventId: event.id,
            templateId: event.defaultTemplateId,
            issuerId: event.organizerId,
          }
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
            ipAddress: request.headers.get("x-forwarded-for") || "Scanner",
            details: JSON.stringify({ method: "scanner_checkin", fingerprint }),
          }
        });

        certificateIssued = true;
      }

      certificateId = certificate.id;

      // Link certificate to member's wallet
      await linkCertificatesByEmail(member.email, {
        method: "scanner_checkin_link",
        extraCertificateIds: [certificate.id],
      });

      // Send confirmation email with certificate link
      if (certificateIssued) {
        sendCertificateEmail({
          to: member.email,
          recipientName: member.name || "Attendee",
          role: certificate.role,
          eventName: event.name,
          certificateId: certificate.id,
          accountExists: true,
        }).catch(err => console.error("Scanner check-in email error:", err));
      }
    }

    return NextResponse.json({ 
      success: true, 
      member: { name: member.name, email: member.email },
      attendance,
      certificateId,
      certificateIssued
    });

  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
