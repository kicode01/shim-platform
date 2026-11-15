import type { Metadata } from "next";
import TemplateEditor from "@/components/TemplateEditor";
import { requireDashboardPageAccess } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "New Template",
  description: "Create a template.",
};

export default async function NewTemplatePage() {
  await requireDashboardPageAccess("templates");

  return (
    <div className="dashboard-bg w-full h-full flex flex-col overflow-hidden bg-[#141416] lg:bg-transparent">
      <main className="page-container-wide animate-fade-in flex flex-col flex-1 min-h-0 p-0">
        <TemplateEditor isEdit={false} />
      </main>
    </div>
  );
}
