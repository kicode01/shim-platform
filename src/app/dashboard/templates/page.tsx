import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireDashboardPageAccess } from "@/lib/auth-guard";

import TemplatesListClient from "./TemplatesListClient";

export const metadata: Metadata = {
  title: "Templates",
  description: "Certificate templates.",
};

export default async function TemplatesPage() {
  const user = await requireDashboardPageAccess("templates");
  const userRole = user.role;
  const userId = user.id;

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
