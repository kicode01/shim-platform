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
    const templates = await prisma.template.findMany({
      where: userRole === "admin" ? {} : { userId },
      include: {
        _count: {
          select: { certificates: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ message: "Error fetching templates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, designData } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Template name is required" }, { status: 400 });
    }

    let finalName = name.trim();
    const userId = (session.user as any).id;

    // Fetch existing templates that start with this name to determine if we need a suffix
    const existingTemplates = await prisma.template.findMany({
      where: {
        userId,
        name: {
          startsWith: finalName
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

    const template = await prisma.template.create({
      data: {
        name: finalName,
        description: description?.trim() || null,
        designData: typeof designData === "string" ? designData : JSON.stringify(designData),
        userId,
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ message: "Error creating template" }, { status: 500 });
  }
}
