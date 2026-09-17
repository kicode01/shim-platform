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

  const events = await prisma.event.findMany({
    where: { organizerId: (session.user as any).id },
    include: {
      _count: {
        select: { certificates: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const serializedEvents = events.map(e => ({
    ...e,
    date: e.date ? e.date.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="dashboard-bg" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <main className="page-container-wide animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: "2rem", paddingTop: "2rem" }}>
        <EventsClient initialEvents={serializedEvents} />
      </main>
    </div>
  );
}
