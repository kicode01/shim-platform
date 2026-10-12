import type { Metadata } from "next";
import GenerateClient from "./GenerateClient";

export const metadata: Metadata = {
  title: "Issue",
  description: "Issue event certificates.",
};


import { Suspense } from "react";

export default function GenerateCertificatesPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center text-zinc-500">Loading...</div>}>
      <GenerateClient />
    </Suspense>
  );
}
