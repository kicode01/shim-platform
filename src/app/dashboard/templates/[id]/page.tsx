import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TemplateEditor from "@/components/TemplateEditor";


export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const template = await prisma.template.findUnique({
    where: { id },
    select: { name: true }
  });
  if (!template) {
    return { title: "Template Not Found" };
  }
  return {
    title: `${template.name} — Template Editor`,
    description: `Edit visual design, layout rules, and configurations for ${template.name}.`,
  };
}

export default async function EditTemplatePage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await props.params;

  const template = await prisma.template.findUnique({
    where: { id }
  });

  if (!template) {
    notFound();
  }

  return (
    <div className="dashboard-bg" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <main className="page-container-wide animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: "2rem", paddingTop: "2rem" }}>
        <TemplateEditor 
          initialId={template.id}
          initialName={template.name}
          initialDescription={template.description || ""}
          initialDesignData={template.designData}
          isEdit={true}
        />
      </main>
    </div>
  );
}
