import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeCertificateFingerprint, maskEmail } from "@/lib/security";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        template: true,
        event: true,
        issuer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    // Log the verification action
    await prisma.auditLog.create({
      data: {
        action: "VERIFIED",
        certificateId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown"
      }
    });

    // Compute cryptographic SHA-256 fingerprint
    const fingerprint = computeCertificateFingerprint({
      id: certificate.id,
      recipientName: certificate.recipientName,
      role: certificate.role,
      eventName: certificate.event?.name || certificate.eventId,
      issueDate: certificate.issueDate,
      issuerId: certificate.issuerId,
    });

    // Determine if caller is an authorized organizer/admin or the certificate recipient
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const isAuthorized = Boolean(
      sessionUser && (
        sessionUser.role === "admin" ||
        sessionUser.id === certificate.issuerId ||
        (sessionUser.email && certificate.recipientEmail && sessionUser.email.toLowerCase() === certificate.recipientEmail.toLowerCase())
      )
    );

    // Mask PII for public scanners/unauthenticated viewers
    const responseData = {
      ...certificate,
      fingerprint,
      recipientEmail: isAuthorized ? certificate.recipientEmail : maskEmail(certificate.recipientEmail),
      issuer: {
        ...certificate.issuer,
        email: isAuthorized ? certificate.issuer?.email : maskEmail(certificate.issuer?.email),
      },
      isPiiMasked: !isAuthorized,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return NextResponse.json({ message: "Error fetching certificate" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !["valid", "revoked"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing || existing.issuerId !== userId) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: { status }
    });

    if (status === "revoked") {
      await prisma.auditLog.create({
        data: {
          action: "REVOKED",
          certificateId: id,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating certificate status:", error);
    return NextResponse.json({ message: "Error updating certificate" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const userId = (session.user as any).id;
    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing || existing.issuerId !== userId) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    await prisma.certificate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json({ message: "Error deleting certificate" }, { status: 500 });
  }
}
