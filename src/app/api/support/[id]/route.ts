import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSupportStatus, SUPPORT_STATUSES } from "@/lib/support";

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
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (!isValidSupportStatus(status)) {
      return NextResponse.json(
        {
          message: `Invalid status. Allowed values: ${SUPPORT_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Support ticket not found." },
        { status: 404 }
      );
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        event: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      message: `Ticket marked as ${status}.`,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Failed to update support ticket:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
