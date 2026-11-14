import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { linkCertificatesByEmail } from "@/lib/claim";
import {
  computeCertificateFingerprint,
  getEffectiveCertificateStatus,
  parseValidityDateInput,
} from "@/lib/security";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  try {
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const now = new Date();
    const whereClause: any = userRole === "admin" ? {} : { issuerId: userId };
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { recipientName: { contains: search, mode: "insensitive" } },
          { recipientEmail: { contains: search, mode: "insensitive" } },
          { role: { contains: search, mode: "insensitive" } },
          { id: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    const isTrash = status === "trash";
    if (isTrash) {
      whereClause.deletedAt = { not: null };
    } else {
      whereClause.deletedAt = null;
      if (status === "valid") {
        whereClause.status = "valid";
        andConditions.push({
          OR: [{ validityDate: null }, { validityDate: { gte: now } }]
        });
      } else if (status === "expired") {
        whereClause.status = "valid";
        whereClause.validityDate = { lt: now };
      } else if (status && status !== "all") {
        whereClause.status = status;
      }
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
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
      orderBy: isTrash ? { deletedAt: "desc" } : { issueDate: "desc" }
    });

    const enriched = certificates.map((c) => ({
      ...c,
      status: getEffectiveCertificateStatus(c, now),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json({ message: "Error fetching certificates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "organizer" && (session.user as any).role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized. Please sign in as an organizer or admin." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { recipientName, recipientEmail, role, eventId, templateId, validityDate } = body;

    if (!recipientName?.trim() || !templateId?.trim()) {
      return NextResponse.json({ message: "Recipient Name and Template are required" }, { status: 400 });
    }

    const parsedValidity = parseValidityDateInput(validityDate);
    if (parsedValidity.error) {
      return NextResponse.json({ message: parsedValidity.error }, { status: 400 });
    }

    // Safely resolve issuer ID from session or database fallback
    let issuerId = (session.user as any).id;
    if (!issuerId && session.user.email) {
      const dbUser = await prisma.user.findFirst({
        where: { email: { equals: session.user.email.trim(), mode: "insensitive" } },
        select: { id: true }
      });
      if (dbUser) issuerId = dbUser.id;
    }

    if (!issuerId) {
      return NextResponse.json({ message: "Issuer account not found. Please log in again." }, { status: 401 });
    }

    // Verify template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId.trim() },
      select: { id: true, name: true }
    });

    if (!template) {
      return NextResponse.json({ message: "The selected template was not found." }, { status: 404 });
    }

    let resolvedEventId = eventId?.trim() || "";
    if (resolvedEventId) {
      const existingEvent = await prisma.event.findFirst({
        where: { OR: [{ id: resolvedEventId }, { name: resolvedEventId }] }
      });
      if (existingEvent) {
        resolvedEventId = existingEvent.id;
      } else {
        const newEvent = await prisma.event.create({
          data: { name: resolvedEventId, organizerId: issuerId }
        });
        resolvedEventId = newEvent.id;
      }
    } else {
      const fallbackEvent = await prisma.event.findFirst({
        where: { name: "Event Description" }
      }) || await prisma.event.create({
        data: { name: "Event Description", organizerId: issuerId }
      });
      resolvedEventId = fallbackEvent.id;
    }

    const certificate = await prisma.certificate.create({
      data: {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail?.trim() || null,
        role: role?.trim() || template.name || "Participant",
        eventId: resolvedEventId,
        templateId: template.id,
        issuerId,
        validityDate: parsedValidity.date,
        status: "valid"
      },
      include: {
        event: true,
        template: true,
        issuer: true
      }
    });

    const fingerprint = computeCertificateFingerprint({
      id: certificate.id,
      recipientName: certificate.recipientName,
      role: certificate.role,
      eventName: certificate.event.name,
      issueDate: certificate.issueDate,
      issuerId: certificate.issuerId,
    });

    await prisma.auditLog.create({
      data: {
        action: "ISSUED",
        certificateId: certificate.id,
        ipAddress: req.headers.get("x-forwarded-for") || "System",
        details: JSON.stringify({ method: "single_generation", fingerprint })
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

    return NextResponse.json({ ...certificate, fingerprint, accountExists }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating certificate:", error);
    return NextResponse.json({ message: error?.message || "Error issuing certificate" }, { status: 500 });
  }
}
