import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        _count: {
          select: { certificates: true }
        }
      }
    });

    if (!template) {
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const { name, description, designData } = await req.json();

    const updated = await prisma.template.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        designData: typeof designData === "string" ? designData : JSON.stringify(designData),
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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;

  try {
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
