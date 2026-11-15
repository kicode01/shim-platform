import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";

export async function GET() {
  const { user, error } = await requireApiStaffAccess(["events", "issue"]);
  if (error) return error;

  try {
    const events = await prisma.event.findMany({
      where: user.role === "admin" ? {} : { organizerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { certificates: { where: { deletedAt: null } } }
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
  const { user, error } = await requireApiStaffAccess("events");
  if (error) return error;

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
        organizerId: user.id
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ message: "Error creating event" }, { status: 500 });
  }
}
