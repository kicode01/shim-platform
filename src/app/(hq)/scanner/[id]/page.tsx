import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CheckInClient from "./CheckInClient";

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "organizer" && session.user.role !== "admin")) {
    redirect("/login");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { checkedInAt: 'desc' },
        take: 10
      }
    }
  });

  const userRole = session.user.role;
  const userId = session.user.id;
  if (!event || (userRole !== "admin" && event.organizerId !== userId)) {
    redirect("/dashboard/events");
  }

  return <CheckInClient event={event} />;
}
