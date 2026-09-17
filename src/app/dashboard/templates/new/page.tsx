import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TemplateEditor from "@/components/TemplateEditor";


export const metadata: Metadata = {
  title: "New Template",
  description: "Create a new visual template design for your event certificates.",
};

export default async function NewTemplatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="dashboard-bg" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <main className="page-container-wide animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: "2rem", paddingTop: "2rem" }}>
        <TemplateEditor isEdit={false} />
      </main>
    </div>
  );
}
