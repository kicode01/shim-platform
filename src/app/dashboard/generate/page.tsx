import type { Metadata } from "next";
import GenerateClient from "./GenerateClient";

export const metadata: Metadata = {
  title: "Issue Credential",
  description: "Generate single or bulk certificates for your events.",
};


export default function GenerateCertificatesPage() {
  return (
    <div className="dashboard-bg" style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <main className="page-container-wide animate-fade-in" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingBottom: "2rem", paddingTop: "2rem" }}>
        <GenerateClient />
      </main>
    </div>
  );
}
