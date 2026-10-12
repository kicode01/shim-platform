import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendCertificateEmail } from "@/lib/email";
import { linkCertificatesByEmail } from "@/lib/claim";

/**
 * Resend the certificate email for a certificate the organizer owns.
 * Also re-links the certificate to the recipient's wallet if they now have
 * an account, so the email offers the correct call to action.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    const isIssuer = certificate.issuerId === session.user.id;
    const isOrganizer = certificate.event?.organizerId === session.user.id;
    const isAdmin = userRole === "admin";

    if (!isIssuer && !isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!certificate.recipientEmail) {
      return NextResponse.json(
        { error: "This certificate has no recipient email on file." },
        { status: 400 }
      );
    }

    // If the recipient now has an account, make sure the certificate is in
    // their wallet and use the "already yours" email variant.
    const { accountExists } = await linkCertificatesByEmail(certificate.recipientEmail, {
      method: "resend_link",
      extraCertificateIds: [certificate.id],
    });

    const result = await sendCertificateEmail({
      to: certificate.recipientEmail,
      recipientName: certificate.recipientName,
      role: certificate.role,
      eventName: certificate.event?.name || "Event",
      certificateId: certificate.id,
      accountExists,
    });

    await prisma.auditLog.create({
      data: {
        action: "ISSUED",
        certificateId: certificate.id,
        ipAddress: req.headers.get("x-forwarded-for") || "Dashboard",
        details: JSON.stringify({ method: "resend_email", to: certificate.recipientEmail }),
      },
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Certificate email resent to ${certificate.recipientEmail}.`,
      accountExists,
    });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Error resending certificate" }, { status: 500 });
  }
}
