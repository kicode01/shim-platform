import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "organizer" && session.user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, membershipId } = await request.json();

    if (!eventId || !membershipId) {
      return NextResponse.json({ error: "Missing eventId or membershipId" }, { status: 400 });
    }

    // 1. Verify Event exists and belongs to the organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event || (session.user.role !== "admin" && event.organizerId !== session.user.id)) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
    }

    // Clean up membershipId (in case they typed #MEMBER-123 instead of MEMBER-123)
    const cleanId = membershipId.replace(/^#/, "").trim();

    // 2. Find Member by membershipId
    const member = await prisma.user.findUnique({
      where: { membershipId: cleanId }
    });

    if (!member || member.role !== "member") {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    
    if (!member.email) {
      return NextResponse.json({ error: "Member has no associated email" }, { status: 400 });
    }

    // 3. Create or Update Attendance Record
    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_email: {
          eventId: eventId,
          email: member.email,
        }
      },
      update: {
        checkedInAt: new Date(),
      },
      create: {
        eventId: eventId,
        name: member.name || "Unknown Member",
        email: member.email,
        checkedInAt: new Date(),
        role: event.defaultRole,
      }
    });

    return NextResponse.json({ 
      success: true, 
      member: { name: member.name, email: member.email },
      attendance 
    });

  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
