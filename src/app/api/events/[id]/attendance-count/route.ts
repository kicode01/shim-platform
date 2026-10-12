import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || (userRole !== "admin" && event.organizerId !== userId)) {
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
