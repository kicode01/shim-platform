import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Award, ArrowLeft, Search, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ValidateDetailClient from "./ValidateDetailClient";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const certificate = await prisma.certificate.findUnique({
    where: { id },
    select: { recipientName: true, role: true }
  });
  if (!certificate) {
    return { title: "Credential Record Not Found" };
  }
  return {
    title: `Validation: ${certificate.recipientName} | shim`,
    description: `Official credential validation report for ${certificate.recipientName} (${certificate.role}).`,
  };
}

export default async function ValidatePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      template: true, event: true,
      issuer: {
        select: { name: true, email: true }
      }
    }
  });

  if (!certificate) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b-2 border-black p-4 no-print sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center">
                <span className="font-black text-3xl tracking-[-0.08em] text-black lowercase leading-none mt-1" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  shim<span className="text-gray-400">.portal</span>
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              {session?.user ? (
                <Link href="/dashboard" className="btn-secondary flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <div className="flex items-center gap-6">
                  <Link href="/" className="text-xs font-bold text-black hover:underline uppercase tracking-widest">
                    Home
                  </Link>
                  <Link href="/login" className="btn-secondary text-xs uppercase tracking-widest font-bold">
                    Organizer Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 flex justify-center items-center p-8">
          <div className="bg-white border-4 border-red-600 p-12 max-w-lg w-full text-center">
            <div className="w-20 h-20 bg-red-100 border-4 border-red-600 flex items-center justify-center mx-auto mb-8">
              <ShieldAlert size={40} className="text-red-600" />
            </div>

            <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mb-4">
              Certificate Not Found
            </h2>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-10 leading-relaxed">
              The credential ID <code className="bg-black text-white px-2 py-1 mx-1">{id}</code> does not match any authenticated record in the official credential registry.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/validate" className="btn-primary uppercase tracking-widest font-bold flex items-center justify-center">
                <Search size={16} className="mr-2" />
                Search Another
              </Link>
              <Link href="/" className="btn-secondary uppercase tracking-widest font-bold flex items-center justify-center">
                Return to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const serializedCertificate = {
    ...certificate,
    issueDate: certificate.issueDate.toISOString(),
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-black p-4 no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center">
              <span className="font-black text-3xl tracking-[-0.08em] text-black lowercase leading-none mt-1" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                shim<span className="text-gray-400">.portal</span>
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {session?.user ? (
              <Link href="/dashboard" className="btn-secondary flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/" className="text-xs font-bold text-black hover:underline uppercase tracking-widest">
                  Home
                </Link>
                <Link href="/login" className="btn-secondary text-xs uppercase tracking-widest font-bold">
                  Organizer Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <ValidateDetailClient certificate={serializedCertificate} />
      </main>

      {/* Institutional Footnote */}
      <footer className="bg-white border-t-2 border-black py-8 text-center mt-auto">
        <span className="text-xs font-bold text-black uppercase tracking-widest">
          Event Certificate Platform • Public Validation Portal • Official Credential Registry
        </span>
      </footer>
    </div>
  );
}
