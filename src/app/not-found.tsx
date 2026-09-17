import Link from "next/link";
import { Search, Home, FileQuestion, ArrowLeft, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested registry resource could not be found.",
};

export default function NotFound() {
  return (
    <div className="dashboard-bg flex flex-col items-center justify-center" style={{ minHeight: "100vh", padding: "2rem" }}>
      <div className="card p-xl flex flex-col items-center text-center animate-fade-in" style={{ maxWidth: "520px", width: "100%" }}>
        <div style={{ width: "80px", height: "80px", background: "var(--surface)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",  marginBottom: "1.5rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="shim Logo" style={{ width: "44px", height: "44px", objectFit: "contain" }} />
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-main)", fontWeight: 700, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          <AlertTriangle size={18} />
          <span>404 — Registry Error</span>
        </div>

        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.03em", marginBottom: "0.5rem", lineHeight: 1.1 }}>
          Record Not Found
        </h2>

        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "320px", marginBottom: "2rem", lineHeight: 1.5 }}>
          The requested registry record, URL, or credential could not be located in the shim system.
        </p>

        <div className="flex gap-md w-full justify-center">
          <Link href="/" className="btn btn-primary" style={{ padding: "0.65rem 1.5rem" }}>
            <ArrowLeft size={16} />
            Return to Registry Home
          </Link>
        </div>
      </div>
    </div>
  );
}
