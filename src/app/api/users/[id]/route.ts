import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CERTIFICATE_ROLES, isValidCertificateRole } from "@/lib/roles";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    ((session.user as any).role !== "admin" &&
      (session.user as any).role !== "organizer")
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const body = await req.json();
    const { certificateRole } = body ?? {};

    if (!isValidCertificateRole(certificateRole)) {
      return NextResponse.json(
        {
          message: `Invalid role. Allowed values: ${CERTIFICATE_ROLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { certificateRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        certificateRole: true,
        membershipId: true,
      },
    });

    // Propagate downstream to event attendance rosters so upcoming issuances immediately reflect the updated role
    if (updatedUser.email) {
      await prisma.attendance.updateMany({
        where: {
          email: { equals: updatedUser.email.trim(), mode: "insensitive" },
        },
        data: { role: certificateRole },
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { message: "Failed to update user role" },
      { status: 500 }
    );
  }
}
