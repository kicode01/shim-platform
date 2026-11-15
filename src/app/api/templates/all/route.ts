import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";

export async function GET() {
  const { user, error } = await requireApiStaffAccess(["templates", "issue", "events"]);
  if (error) return error;

  try {
    const templates = await prisma.template.findMany({
      where: user.role === "admin" ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching templates" }, { status: 500 });
  }
}
