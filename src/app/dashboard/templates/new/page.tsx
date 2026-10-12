import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TemplateEditor from "@/components/TemplateEditor";


export const metadata: Metadata = {
  title: "New Template",
  description: "Create a template.",
};

export default async function NewTemplatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="dashboard-bg w-full h-full flex flex-col overflow-hidden">
      <main className="page-container-wide animate-fade-in flex flex-col flex-1 min-h-0">
        <TemplateEditor isEdit={false} />
      </main>
    </div>
  );
}
