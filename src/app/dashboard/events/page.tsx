import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireDashboardPageAccess } from "@/lib/auth-guard";

import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "Events",
  description: "Manage events.",
};

export default async function EventsPage() {
  const user = await requireDashboardPageAccess("events");
  const userRole = user.role;
  const userId = user.id;

  const [events, templates] = await Promise.all([
    prisma.event.findMany({
      where: userRole === "admin" ? {} : { organizerId: userId },
      include: {
        organizer: { select: { name: true, email: true } },
        _count: {
          select: { certificates: { where: { deletedAt: null } } }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.template.findMany({
      where: userRole === "admin" ? {} : { userId },
      select: { id: true, name: true }
    })
  ]);

  const serializedEvents = events.map(e => ({
    ...e,
    date: e.date ? e.date.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <EventsClient
      initialEvents={serializedEvents}
      templates={templates}
      isAdmin={userRole === "admin"}
    />
  );
}
