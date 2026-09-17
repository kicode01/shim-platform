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

  const templates = await prisma.template.findMany({
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

  return (
    <div className="dashboard-bg" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <main className="page-container-wide animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: "2rem", paddingTop: "2rem" }}>
        <TemplatesListClient initialTemplates={serializedTemplates} />
      </main>
    </div>
  );
}
