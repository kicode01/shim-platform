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
    let certificate = await prisma.certificate.findFirst({
      where: { id, deletedAt: null },
      include: {
        template: true,
        event: true,
        issuer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // OCR / human-typo fallback for 20-30 char CUIDs (handles Space Mono dotted '0'->'8'/'o', 'u'->'v', 'l'->'1'/'i', '5'->'s')
    if (!certificate && id.length >= 18) {
      const normalizeOcr = (s: string) =>
        s
          .toLowerCase()
          .replace(/[08oq]/g, "0")
          .replace(/[uv]/g, "v")
          .replace(/[1li|]/g, "l")
          .replace(/[5s]/g, "5")
          .replace(/[2z]/g, "2");

      const cleanId = id.trim().toLowerCase();
      const prefix3 = cleanId.slice(0, 3);
      const suffix3 = cleanId.slice(-3);
      const candidates = await prisma.certificate.findMany({
        where: {
          deletedAt: null,
          OR: [
            { id: { startsWith: prefix3 } },
            { id: { endsWith: suffix3 } }
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

      const normTarget = normalizeOcr(cleanId);
      let bestMatch = null;
      let bestScore = 999;

      for (const cand of candidates) {
        if (Math.abs(cand.id.length - cleanId.length) > 2) continue;
        const normCand = normalizeOcr(cand.id);
        let normDiff = 0;
        let rawDiff = 0;
        const len = Math.max(normCand.length, normTarget.length);
        for (let i = 0; i < len; i++) {
          if (normCand[i] !== normTarget[i]) normDiff++;
          if (cand.id[i] !== cleanId[i]) rawDiff++;
        }
        // Accept if OCR-normalized strings differ by at most 3 chars (out of 25), or raw strings by at most 4
        if ((normDiff <= 3 || rawDiff <= 4) && normDiff * 10 + rawDiff < bestScore) {
          bestScore = normDiff * 10 + rawDiff;
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
    const existing = await prisma.certificate.findFirst({ where: { id, deletedAt: null } });
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
    const existing = await prisma.certificate.findFirst({ where: { id, deletedAt: null } });
    if (!existing || (userRole !== "admin" && existing.issuerId !== userId)) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    await prisma.certificate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        action: "ARCHIVED",
        certificateId: id,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return NextResponse.json({ message: "Error deleting certificate" }, { status: 500 });
  }
}
