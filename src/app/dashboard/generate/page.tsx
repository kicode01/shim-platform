import type { Metadata } from "next";
import GenerateClient from "./GenerateClient";
import { Suspense } from "react";
import { requireDashboardPageAccess } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Issue",
  description: "Issue event certificates.",
};

export default async function GenerateCertificatesPage() {
  await requireDashboardPageAccess("issue");

  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-zinc-500">Loading...</div>}>
      <GenerateClient />
    </Suspense>
  );
}
