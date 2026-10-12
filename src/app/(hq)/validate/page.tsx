import type { Metadata } from "next";
import { Suspense } from "react";
import ValidateSearchClient from "./ValidateSearchClient";

export const metadata: Metadata = {
  title: "Verify",
  description: "Verify credentials.",
};

export default function ValidatePage() {
  return (
    <Suspense fallback={<div className="h-full bg-[#0a0a0a]"></div>}>
      <ValidateSearchClient />
    </Suspense>
  );
}
