import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  const { user, error } = await requireApiStaffAccess(["templates", "issue", "events"]);
  if (error) return error;

  try {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        _count: {
          select: { certificates: true }
        }
      }
    });

    if (!template || (user.role !== "admin" && template.userId !== user.id)) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ message: "Error fetching template" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireApiStaffAccess("templates");
  if (error) return error;

  const { id } = await props.params;

  try {
    const { name, description, designData } = await req.json();

    const existingTemplate = await prisma.template.findUnique({ where: { id } });
    if (!existingTemplate || (user.role !== "admin" && existingTemplate.userId !== user.id)) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    let finalName = (name !== undefined ? name : existingTemplate.name)?.trim() || existingTemplate.name;

    // Fetch existing templates that start with this name to determine if we need a suffix, excluding the current one
    const existingTemplates = await prisma.template.findMany({
      where: {
        userId: existingTemplate.userId,
        name: {
          startsWith: finalName
        },
        id: {
          not: id
        }
      },
      select: { name: true }
    });

    if (existingTemplates.some(t => t.name === finalName)) {
      let counter = 1;
      while (existingTemplates.some(t => t.name === `${finalName} (${counter})`)) {
        counter++;
      }
      finalName = `${finalName} (${counter})`;
    }

    const updated = await prisma.template.update({
      where: { id },
      data: {
        name: finalName,
        description: description !== undefined ? (description?.trim() || null) : existingTemplate.description,
        designData: designData !== undefined ? (typeof designData === "string" ? designData : JSON.stringify(designData)) : existingTemplate.designData,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ message: "Error updating template" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireApiStaffAccess("templates");
  if (error) return error;

  const { id } = await props.params;

  try {
    const existingTemplate = await prisma.template.findUnique({ where: { id } });
    if (!existingTemplate || (user.role !== "admin" && existingTemplate.userId !== user.id)) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Check if certificates are linked to this template
    const count = await prisma.certificate.count({
      where: { templateId: id }
    });

    if (count > 0) {
      return NextResponse.json({ 
        message: `Cannot delete template because ${count} certificate(s) have been issued with it.` 
      }, { status: 400 });
    }

    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ message: "Error deleting template" }, { status: 500 });
  }
}
