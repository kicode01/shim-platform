import { NextResponse } from "next/server";
import { requireApiStaffAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await requireApiStaffAccess(["events", "issue", "overview"]);
    if (error) return error;

    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || (user.role !== "admin" && event.organizerId !== user.id)) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const count = await prisma.attendance.count({
      where: { eventId },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("Attendance count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance count" },
      { status: 500 }
    );
  }
}
