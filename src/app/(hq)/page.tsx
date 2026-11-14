import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      date: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const serializedEvents = events.map((ev) => ({
    id: ev.id,
    name: ev.name,
    date: ev.date ? ev.date.toISOString() : null,
  }));

  return <HomeClient events={serializedEvents} />;
}
