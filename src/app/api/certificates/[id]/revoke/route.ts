import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireApiStaffAccess("credentials");
    if (error) return error;

    const { id } = await params;

    // Find the certificate and verify ownership
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        event: true,
      }
    });

    if (!certificate || certificate.deletedAt !== null) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const isIssuer = certificate.issuerId === user.id;
    const isOrganizer = certificate.event?.organizerId === user.id;
    const isAdmin = user.role === "admin";

    if (!isIssuer && !isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const newStatus = certificate.status === "valid" ? "revoked" : "valid";

    const updated = await prisma.certificate.update({
      where: { id },
      data: { status: newStatus }
    });

    await prisma.auditLog.create({
      data: {
        action: newStatus === "revoked" ? "REVOKED" : "RESTORED",
        certificateId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown"
      }
    });

    return NextResponse.json({ success: true, certificate: updated });
  } catch (error) {
    console.error("Revoke error:", error);
    return NextResponse.json(
      { error: "Failed to update certificate status" },
      { status: 500 }
    );
  }
}
