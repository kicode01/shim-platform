import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const events = await prisma.event.findMany({
      where: userRole === "admin" ? {} : { organizerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { certificates: true }
        }
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ message: "Error fetching events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ((session.user as any).role !== "organizer" && (session.user as any).role !== "admin")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, date, description, defaultTemplateId, defaultRole } = body;

    if (!name) {
      return NextResponse.json({ message: "Event name is required" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        date: date ? new Date(date) : null,
        description: description?.trim() || null,
        defaultTemplateId: defaultTemplateId || null,
        defaultRole: defaultRole?.trim() || "Participant",
        organizerId: (session.user as any).id
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ message: "Error creating event" }, { status: 500 });
  }
}
