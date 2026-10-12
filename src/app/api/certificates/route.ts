import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { linkCertificatesByEmail } from "@/lib/claim";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  try {
    const whereClause: any = {
      issuerId: (session.user as any).id
    };

    if (search) {
      whereClause.OR = [
        { recipientName: { contains: search, mode: "insensitive" } },
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { role: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } }
      ];
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      include: {
        event: {
          select: { id: true, name: true }
        },
        template: {
          select: { id: true, name: true }
        },
        issuer: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { issueDate: "desc" }
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json({ message: "Error fetching certificates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "organizer" && (session.user as any).role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipientName, recipientEmail, role, eventId, templateId } = body;

    if (!recipientName || !templateId || !eventId) {
      return NextResponse.json({ message: "Recipient Name, Event, and Template are required" }, { status: 400 });
    }

    let resolvedEventId = eventId;
    if (eventId) {
      const existingEvent = await prisma.event.findFirst({
        where: { OR: [{ id: eventId }, { name: eventId }] }
      });
      if (existingEvent) {
        resolvedEventId = existingEvent.id;
      } else {
        const newEvent = await prisma.event.create({
          data: { name: eventId, organizerId: (session.user as any).id }
        });
        resolvedEventId = newEvent.id;
      }
    } else {
      const fallbackEvent = await prisma.event.findFirst({
        where: { name: "Default Event" }
      }) || await prisma.event.create({
        data: { name: "Default Event", organizerId: (session.user as any).id }
      });
      resolvedEventId = fallbackEvent.id;
    }

    const certificate = await prisma.certificate.create({
      data: {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail?.trim() || null,
        role: role?.trim() || "Participant",
        eventId: resolvedEventId,
        templateId,
        issuerId: (session.user as any).id,
        status: "valid"
      },
      include: {
        event: true,
        template: true,
        issuer: true
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "ISSUED",
        certificateId: certificate.id,
        ipAddress: req.headers.get("x-forwarded-for") || "System",
        details: JSON.stringify({ method: "single_generation" })
      }
    });

    let accountExists = false;
    if (certificate.recipientEmail) {
      // If the recipient already has a Shim account, drop the certificate
      // straight into their wallet so it is waiting when they sign in.
      const linked = await linkCertificatesByEmail(certificate.recipientEmail, {
        method: "manual_issue_link",
        extraCertificateIds: [certificate.id],
      });
      accountExists = linked.accountExists;

      const { sendCertificateEmail } = await import("@/lib/email");
      await sendCertificateEmail({
        to: certificate.recipientEmail,
        recipientName: certificate.recipientName,
        role: certificate.role,
        eventName: certificate.event.name,
        certificateId: certificate.id,
        accountExists,
      }).catch(err => console.error("Failed to send email silently:", err));
    }

    return NextResponse.json({ ...certificate, accountExists }, { status: 201 });
  } catch (error) {
    console.error("Error creating certificate:", error);
    return NextResponse.json({ message: "Error issuing certificate" }, { status: 500 });
  }
}
