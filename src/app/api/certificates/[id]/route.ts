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
    let certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        template: true,
        event: true,
        issuer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // OCR / human-typo fallback for 24-26 char CUIDs (e.g. 'u' vs 'v', '0' vs '8'/'o', 'l' vs '1')
    if (!certificate && id.length >= 20) {
      const prefix = id.slice(0, 7).toLowerCase();
      const suffix = id.slice(-5).toLowerCase();
      const candidates = await prisma.certificate.findMany({
        where: {
          OR: [
            { id: { startsWith: prefix } },
            { id: { endsWith: suffix } }
          ]
        },
        include: {
          template: true,
          event: true,
          issuer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      const target = id.toLowerCase();
      let bestMatch = null;
      let bestDiff = 999;
      for (const cand of candidates) {
        if (Math.abs(cand.id.length - target.length) > 1) continue;
        let diff = 0;
        const len = Math.max(cand.id.length, target.length);
        for (let i = 0; i < len; i++) {
          if (cand.id[i] !== target[i]) diff++;
        }
        if (diff <= 2 && diff < bestDiff) {
          bestDiff = diff;
          bestMatch = cand;
        }
      }
      if (bestMatch) {
        certificate = bestMatch;
      }
    }

    if (!certificate) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    // Log the verification action
    await prisma.auditLog.create({
      data: {
        action: "VERIFIED",
        certificateId: certificate.id,
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

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing || (userRole !== "admin" && existing.issuerId !== userId)) {
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
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const existing = await prisma.certificate.findUnique({ where: { id } });
    if (!existing || (userRole !== "admin" && existing.issuerId !== userId)) {
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
