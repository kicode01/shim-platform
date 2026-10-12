import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "Events",
  description: "Manage events and generated certificates.",
};

export default async function EventsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [events, templates] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: (session.user as any).id },
      include: {
        _count: {
          select: { certificates: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.template.findMany({
      where: { userId: (session.user as any).id },
      select: { id: true, name: true }
    })
  ]);

  const serializedEvents = events.map(e => ({
    ...e,
    date: e.date ? e.date.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  }));

  return <EventsClient initialEvents={serializedEvents} templates={templates} />;
}
