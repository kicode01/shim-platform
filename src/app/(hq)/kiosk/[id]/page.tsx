import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import KioskClient from "./KioskClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiosk Mode | Shim",
  description: "Event check-in kiosk.",
};

export default async function KioskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      organizerId: true,
      _count: {
        select: { attendances: true }
      }
    }
  });

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!event || (userRole !== "admin" && event.organizerId !== userId)) {
    notFound();
  }

  // We need to pass the base URL so the QR code can be generated
  // In a real app, you might use an env variable for NEXT_PUBLIC_BASE_URL
  // For now, the client component will construct it using window.location.origin

  return <KioskClient eventId={event.id} eventName={event.name} initialCount={event._count.attendances} />;
}
