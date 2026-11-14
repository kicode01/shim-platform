import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    ((session.user as any).role !== "admin" &&
      (session.user as any).role !== "organizer")
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const roleFilter = (searchParams.get("role") || "").trim();

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { membershipId: { contains: search, mode: "insensitive" } },
        { certificateRole: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter && roleFilter !== "all") {
      where.certificateRole = roleFilter;
    }

    const [users, certEmails] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          certificateRole: true,
          membershipId: true,
        },
        orderBy: [{ name: "asc" }, { email: "asc" }],
      }),
      prisma.certificate.findMany({
        where: { deletedAt: null, recipientEmail: { not: null } },
        select: { recipientEmail: true },
      }),
    ]);

    const certCountByEmail = new Map<string, number>();
    for (const c of certEmails) {
      const key = c.recipientEmail?.trim().toLowerCase();
      if (key) {
        certCountByEmail.set(key, (certCountByEmail.get(key) ?? 0) + 1);
      }
    }

    const enriched = users.map((u) => ({
      ...u,
      certificateCount: u.email
        ? certCountByEmail.get(u.email.trim().toLowerCase()) ?? 0
        : 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
