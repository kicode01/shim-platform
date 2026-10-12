import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import TemplatesListClient from "./TemplatesListClient";

export const metadata: Metadata = {
  title: "Templates",
  description: "Manage your certificate templates and designs for events.",
};

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  const templates = await prisma.template.findMany({
    where: userRole === "admin" ? {} : { userId },
    include: {
      _count: {
        select: { certificates: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const serializedTemplates = templates.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return <TemplatesListClient initialTemplates={serializedTemplates} />;
}
