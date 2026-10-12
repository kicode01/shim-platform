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

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  const [events, templates] = await Promise.all([
    prisma.event.findMany({
      where: userRole === "admin" ? {} : { organizerId: userId },
      include: {
        _count: {
          select: { certificates: true }
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

  return <EventsClient initialEvents={serializedEvents} templates={templates} />;
}
