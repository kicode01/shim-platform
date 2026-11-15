import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHostSurface, getWorkspaceHref } from "@/lib/domain";
import { createHandoffUrl } from "@/lib/handoff";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [headerList, session] = await Promise.all([
    headers(),
    getServerSession(authOptions),
  ]);
  const initialHost = headerList.get("host") || "";
  const sessionUserId = (session?.user as any)?.id as string | undefined;

  if (sessionUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, isActive: true },
    });

    if (dbUser && dbUser.isActive) {
      const surface = getHostSurface(initialHost);
      const workspaceHref = getWorkspaceHref(dbUser.role, initialHost);

      if (workspaceHref.startsWith("/api/") && surface !== "local") {
        const handoffUrl = await createHandoffUrl({
          userId: dbUser.id,
          role: dbUser.role,
          host: initialHost,
        });
        redirect(handoffUrl);
      }

      redirect(workspaceHref);
    }
  }

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

  return <HomeClient events={serializedEvents} initialHost={initialHost} />;
}
