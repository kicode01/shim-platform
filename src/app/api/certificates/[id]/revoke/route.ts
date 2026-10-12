import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the certificate and verify ownership
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        event: true,
      }
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
