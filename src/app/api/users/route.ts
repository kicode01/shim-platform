import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";
import {
  canAccessDashboardPage,
  resolveEffectiveAllowedPages,
} from "@/lib/permissions";

export async function GET() {
  const { user, error } = await requireApiStaffAccess();
  if (error) return error;

  try {
    if (user.role === "admin") {
      const [users, certificates] = await Promise.all([
        prisma.user.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            allowedPages: true,
            certificateRole: true,
            membershipId: true,
            _count: {
              select: { events: true },
            },
          },
        }),
        prisma.certificate.findMany({
          where: { deletedAt: null },
          select: { recipientEmail: true },
        }),
      ]);

      const certCountByEmail = new Map<string, number>();
      for (const c of certificates) {
        const key = c.recipientEmail?.trim().toLowerCase();
        if (key) {
          certCountByEmail.set(key, (certCountByEmail.get(key) ?? 0) + 1);
        }
      }

      const enriched = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        allowedPages: resolveEffectiveAllowedPages(u.role, u.allowedPages),
        certificateRole: u.certificateRole,
        membershipId: u.membershipId,
        eventCount: u._count.events,
        certificateCount: u.email
          ? certCountByEmail.get(u.email.trim().toLowerCase()) ?? 0
          : 0,
      }));

      return NextResponse.json(enriched);
    }

    // Organizers must hold "issue" access and can only see recipients from their own events' Attendance rosters
    if (!canAccessDashboardPage(user.role, user.allowedPages, "issue")) {
      return NextResponse.json(
        { message: "Your account does not have permission to view recipient directories." },
        { status: 403 }
      );
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        event: { organizerId: user.id },
      },
      orderBy: { checkedInAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const uniqueEmails = Array.from(
      new Set(
        attendances
          .map((a) => a.email?.trim().toLowerCase())
          .filter((e): e is string => Boolean(e))
      )
    );

    const matchedUsers =
      uniqueEmails.length > 0
        ? await prisma.user.findMany({
            where: {
              OR: uniqueEmails.map((em) => ({
                email: { equals: em, mode: "insensitive" as const },
              })),
            },
            select: {
              id: true,
              name: true,
              email: true,
              certificateRole: true,
              membershipId: true,
            },
          })
        : [];

    const userByEmail = new Map(
      matchedUsers
        .filter((u) => u.email)
        .map((u) => [u.email!.trim().toLowerCase(), u])
    );

    const seenKeys = new Set<string>();
    const scopedRecipients = [];

    for (const att of attendances) {
      const normalizedEmail = att.email?.trim().toLowerCase() || "";
      const dedupeKey = normalizedEmail || `name:${att.name.trim().toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      const matched = normalizedEmail ? userByEmail.get(normalizedEmail) : undefined;
      scopedRecipients.push({
        id: matched?.id || att.id,
        name: matched?.name || att.name,
        email: matched?.email || att.email,
        certificateRole: matched?.certificateRole || att.role || "Participant",
        membershipId: matched?.membershipId || null,
      });
    }

    return NextResponse.json(scopedRecipients);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
