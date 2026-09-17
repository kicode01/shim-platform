import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await prisma.template.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching templates" }, { status: 500 });
  }
}
