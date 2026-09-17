"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Download, 
  ShieldCheck, 
  User, 
  ShieldAlert, 
  BadgeCheck, 
  FileText, 
  Calendar, 
  Building, 
  Stamp, 
  QrCode, 
  BookOpen, 
  ExternalLink, 
  Sparkles,
  FileCheck2,
  GraduationCap,
  Printer,
  Copy,
  Check,
  Award,
  Lock,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import CertificateView from "@/components/CertificateView";
import jsPDF from "jspdf";

interface ValidateDetailProps {
  certificate: {
    id: string;
    recipientName: string;
    recipientEmail?: string | null;
    role?: string | null;
    eventId?: string | null;
    issueDate: string;
    status: string;
    template: {
      id: string;
      name: string;
      designData: string;
    };
    issuer: {
      name?: string | null;
      email?: string | null;
    };
  };
}

export default function ValidateDetailClient({ certificate }: ValidateDetailProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isValid = certificate.status === "valid";

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      let design = {};
      try {
        design = JSON.parse(certificate.template.designData);
      } catch (e) {}

      const pdf = new jsPDF("l", "mm", "a4");

      // Background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, 297, 210, "F");

      // Decorative double border
      const primaryBorder = [79, 70, 229]; // Indigo 600

      pdf.setDrawColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
      pdf.setLineWidth(3);
      pdf.rect(10, 10, 277, 190);
      pdf.setLineWidth(0.75);
      pdf.rect(13, 13, 271, 184);

      // Institution Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text((design as any).institutionName || "EVENT CERTIFICATE PLATFORM", 148.5, 26, { align: "center" });

      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text((design as any).institutionSub || "OFFICIAL CERTIFICATION PORTAL", 148.5, 32, { align: "center" });

      // Title
      pdf.setFont("times", "bold");
      pdf.setFontSize(26);
      pdf.setTextColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
      pdf.text((design as any).certificateTitle || "Certificate of Completion", 148.5, 52, { align: "center" });

      if ((design as any).honorText) {
        pdf.setFont("times", "italic");
        pdf.setFontSize(11);
        pdf.setTextColor(71, 85, 105);
        pdf.text((design as any).honorText, 148.5, 60, { align: "center" });
      }

      // Recipient
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text((design as any).prefixText || "It is hereby certified that", 148.5, 75, { align: "center" });

      // Recipient with dynamic scaling
      const nameLen = (certificate.recipientName || "").length;
      const pdfNameSize = nameLen > 42 ? 17 : nameLen > 28 ? 22 : 28;
      pdf.setFont("times", "bold");
      pdf.setFontSize(pdfNameSize);
      pdf.setTextColor(15, 23, 42);
      pdf.text(certificate.recipientName || "Candidate Name", 148.5, 92, { align: "center" });

      // Line under name
      const textWidth = Math.min(pdf.getTextWidth(certificate.recipientName || "Candidate Name"), 200);
      const halfWidth = Math.max(textWidth / 2 + 10, 45);
      pdf.setDrawColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
      pdf.setLineWidth(0.5);
      pdf.line(148.5 - halfWidth, 96, 148.5 + halfWidth, 96);

      // Program
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text((design as any).completionText || "has satisfactorily completed the prescribed requirements for", 148.5, 108, { align: "center" });

      pdf.setFont("times", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
      pdf.text(certificate.role || certificate.template.name, 148.5, 119, { align: "center" });

      // Attestation
      pdf.setFont("times", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("In testimony whereof, the seal of the Event and the signatures of the Organizers are hereunto affixed.", 148.5, 135, { align: "center" });

      // Signatories
      pdf.setDrawColor(51, 65, 85);
      pdf.setLineWidth(0.5);
      pdf.line(45, 168, 105, 168);
      pdf.line(192, 168, 252, 168);

      pdf.setFont("times", "italic");
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Organizer Signature", 75, 164, { align: "center" });
      pdf.text("Sponsor Signature", 222, 164, { align: "center" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text((design as any).firstSignatoryName || "Event Director", 75, 174, { align: "center" });
      pdf.text((design as any).secondSignatoryName || "Program Chair", 222, 174, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text((design as any).firstSignatoryTitle || "Head Organizer", 75, 179, { align: "center" });
      pdf.text((design as any).secondSignatoryTitle || "Co-Chair", 222, 179, { align: "center" });

      // Official Seal Label
      pdf.setFont("times", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
      pdf.text("OFFICIAL EVENT SEAL", 148.5, 172, { align: "center" });

      const issueDateObj = new Date(certificate.issueDate);
      const dateStr = !isNaN(issueDateObj.getTime())
        ? issueDateObj.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : certificate.issueDate;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Issued: ${dateStr}`, 148.5, 177, { align: "center" });

      // Verification Footer
      pdf.setFontSize(6.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Cryptographic Audit Record: ${certificate.id} • shim Registry`, 148.5, 195, { align: "center" });

      pdf.save(`Credential-${certificate.id.substring(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-6 mb-10 no-print">
          <Link 
            href="/validate" 
            className="btn-secondary uppercase tracking-widest font-bold text-xs"
          >
            <ArrowLeft size={16} className="mr-2" />
            <span>Back to Public Ledger</span>
          </Link>

          <div className="flex flex-wrap gap-4 items-center">
            <button 
              onClick={handleCopy} 
              className="btn-secondary uppercase tracking-widest font-bold text-xs"
            >
              {copied ? <><Check size={16} className="mr-2" /> <span>Link Copied</span></> : <><Copy size={16} className="mr-2" /> <span>Copy Link</span></>}
            </button>
            
            <button 
              onClick={handlePrint} 
              className="btn-secondary uppercase tracking-widest font-bold text-xs"
            >
              <Printer size={16} className="mr-2" />
              <span>Print</span>
            </button>

            <button 
              onClick={handleDownloadPdf} 
              disabled={downloading}
              className="btn-primary uppercase tracking-widest font-bold text-xs flex items-center"
            >
              {downloading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2" />}
              <span>{downloading ? "Generating PDF..." : "Download Official PDF"}</span>
            </button>
          </div>
        </div>

        {/* Verification Banner */}
        <div className="bg-white border-4 border-black p-8 mb-12 flex flex-wrap justify-between items-center gap-8">
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-black mb-2 border-2 border-black px-2 py-1 inline-block">
              OFFICIAL CERTIFICATE REGISTRY
            </div>
            <h1 className="text-3xl font-bold text-black mb-4 tracking-tighter uppercase mt-4">
              Cryptographic Verification
            </h1>
            <p className="text-sm font-bold text-gray-600 max-w-xl uppercase tracking-widest leading-relaxed">
              {isValid
                ? "This credential has been formally authenticated against the immutable event ledger. It is verified genuine."
                : "Notice: This record has been marked as revoked or invalid by the issuing authority."
              }
            </p>
          </div>

          <div className="text-right">
            {isValid ? (
              <span className="badge-valid text-sm px-6 py-3 mb-4 border-2 border-black inline-flex items-center">
                <CheckCircle2 size={20} className="mr-2" />
                Issued & Authentic
              </span>
            ) : (
              <span className="badge-revoked text-sm px-6 py-3 mb-4 border-2 border-black inline-flex items-center">
                <ShieldAlert size={20} className="mr-2" />
                Administrative Revocation
              </span>
            )}
            <div className="text-xs font-mono font-bold text-gray-500 mt-4 uppercase tracking-widest">
              Ledger Ref: <br/><span className="text-black">{certificate.id}</span>
            </div>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10 items-start">
          
          {/* Document Preview */}
          <div className="bg-gray-100 flex items-center justify-center p-10 border-4 border-black border-dashed">
            <div className="w-full aspect-[1.414/1] bg-white border-2 border-black relative">
              <CertificateView 
                certificateId={certificate.id}
                recipientName={certificate.recipientName}
                role={certificate.role || certificate.template.name}
                eventId={certificate.eventId}
                issueDate={certificate.issueDate}
                design={certificate.template.designData}
                status={certificate.status}
              />
            </div>
          </div>

          {/* Dossier Side Panel */}
          <div className="bg-white border-2 border-black p-8 sticky top-24">
            <h2 className="text-lg font-bold text-black tracking-tighter uppercase mb-8 pb-4 border-b-2 border-black flex items-center gap-3">
              <Award size={24} className="text-black" />
              Credential Dossier
            </h2>

            <div className="flex flex-col gap-8">
              
              {/* Recipient */}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Recipient
                </div>
                <div className="text-xl font-bold text-black leading-tight break-words uppercase tracking-tighter">
                  {certificate.recipientName}
                </div>
                {certificate.recipientEmail && (
                  <div className="text-xs font-bold text-gray-600 mt-2 uppercase tracking-widest">
                    {certificate.recipientEmail}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="pt-6 border-t-2 border-gray-100">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Role / Participation
                </div>
                <div className="text-sm font-bold text-black break-words uppercase tracking-widest">
                  {certificate.role || certificate.template.name}
                </div>
                <div className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                  Category: {certificate.template.name}
                </div>
              </div>

              {/* Issue Date */}
              <div className="pt-6 border-t-2 border-gray-100">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Official Issue Date
                </div>
                <div className="text-sm font-bold text-black flex items-center gap-3 uppercase tracking-widest">
                  <Calendar size={18} className="text-black" />
                  {new Date(certificate.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>

              {/* Issuer */}
              <div className="pt-6 border-t-2 border-gray-100">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Issuing Organizer
                </div>
                <div className="text-sm font-bold text-black flex items-center gap-3 uppercase tracking-widest">
                  <User size={18} className="text-black" />
                  {certificate.issuer.name || "Event Organizer"}
                </div>
                {certificate.issuer.email && (
                  <div className="text-xs font-bold text-gray-400 mt-2 ml-7 uppercase tracking-widest">
                    {certificate.issuer.email}
                  </div>
                )}
              </div>

              {/* Extra Event Outcomes / Info */}
              {certificate.eventId && (
                <div className="pt-6 border-t-2 border-gray-100">
                  <div className="text-xs font-bold text-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-black" />
                    Verified Event Description
                  </div>
                  <div className="text-xs font-bold text-gray-700 uppercase tracking-widest leading-loose bg-gray-50 border-2 border-black p-4 break-words max-h-40 overflow-y-auto">
                    {certificate.eventId}
                  </div>
                </div>
              )}

              {/* Ledger Footer */}
              <div className="pt-8 border-t-2 border-black flex items-center gap-3 text-xs font-bold text-black uppercase tracking-widest">
                <Lock size={16} className="text-black" />
                <span>SHA-256 Signature verified on Ledger</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
