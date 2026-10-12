import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AttendClient from "./AttendClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check-in",
  description: "Register attendance.",
};

export default async function AttendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id: id },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
    }
  });

  if (!event) {
    notFound();
  }

  const serializedEvent = {
    ...event,
    date: event.date ? event.date.toISOString() : null,
  };

  return <AttendClient event={serializedEvent} />;
}
