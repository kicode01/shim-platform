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
  const displayName = template.name.length > 20 ? `${template.name.slice(0, 20)}…` : template.name;
  return {
    title: displayName,
    description: `Edit ${template.name}.`,
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

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  if (!template || (userRole !== "admin" && template.userId !== userId)) {
    notFound();
  }

  return (
    <div className="dashboard-bg w-full h-full flex flex-col overflow-hidden">
      <main className="page-container-wide animate-fade-in flex flex-col flex-1 min-h-0">
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
