import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireApiStaffAccess("credentials");
    if (error) return error;

    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { event: true },
    });

    if (!certificate || certificate.deletedAt === null) {
      return NextResponse.json({ error: "Certificate not found in trash" }, { status: 404 });
    }

    const isIssuer = certificate.issuerId === user.id;
    const isOrganizer = certificate.event?.organizerId === user.id;
    const isAdmin = user.role === "admin";

    if (!isIssuer && !isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const restored = await prisma.certificate.update({
      where: { id },
      data: { deletedAt: null },
    });

    await prisma.auditLog.create({
      data: {
        action: "RESTORED",
        certificateId: id,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        details: JSON.stringify({ via: "trash_restore" }),
      },
    });

    return NextResponse.json({ success: true, certificate: restored });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { error: "Failed to restore certificate" },
      { status: 500 }
    );
  }
}
