import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiStaffAccess("events");
  if (error) return error;

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.event.findUnique({
      where: { id }
    });

    if (!existing || (user.role !== "admin" && existing.organizerId !== user.id)) {
      return NextResponse.json({ message: "Event not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { name, date, description, defaultTemplateId, defaultRole } = body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        date: date ? new Date(date) : existing.date,
        description: description?.trim() !== undefined ? description.trim() : existing.description,
        defaultTemplateId: defaultTemplateId !== undefined ? defaultTemplateId : existing.defaultTemplateId,
        defaultRole: defaultRole?.trim() || existing.defaultRole,
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ message: "Error updating event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiStaffAccess("events");
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.event.findUnique({
      where: { id }
    });

    if (!existing || (user.role !== "admin" && existing.organizerId !== user.id)) {
      return NextResponse.json({ message: "Event not found or unauthorized" }, { status: 404 });
    }

    // Check if certificates are linked to this event to prevent DB foreign key constraint errors
    const certCount = await prisma.certificate.count({
      where: { eventId: id }
    });

    if (certCount > 0) {
      return NextResponse.json({ 
        message: `Cannot delete event because ${certCount} certificate(s) have been issued for it.` 
      }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ message: "Error deleting event" }, { status: 500 });
  }
}
