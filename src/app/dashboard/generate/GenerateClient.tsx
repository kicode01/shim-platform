"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { 
  FileSpreadsheet, 
  Upload, 
  UserCheck, 
  CheckCircle, 
  ArrowRight, 
  Download, 
  FileText, 
  PlusCircle, 
  AlertCircle,
  ShieldCheck,
  Loader2,
  LayoutTemplate,
  Eye,
  Zap,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import CertificateView from "@/components/CertificateView";

function GenerateCertificatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("templateId");

  const [mode, setMode] = useState<"single" | "bulk">("single");
  
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(err => console.error(err));
  }, []);

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Single Issue state
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleRole, setSingleRole] = useState("");
  const [singleEventId, setSingleEventId] = useState("");
  const [singleIssuing, setSingleIssuing] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState<any>(null);

  // Bulk Issue state
  const [csvData, setCsvData] = useState<any[]>([]);
  const [bulkStep, setBulkStep] = useState(1);
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");
  const [issuedCerts, setIssuedCerts] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data);
          if (data.length > 0) {
            if (preselectedTemplateId) {
              const match = data.find(t => t.id === preselectedTemplateId);
              if (match) setSelectedTemplate(match);
              else setSelectedTemplate(data[0]);
            } else {
              setSelectedTemplate(data[0]);
            }
          }
        }
      })
      .catch(err => console.error("Error fetching templates:", err));
  }, [preselectedTemplateId]);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const eventParam = searchParams.get("event");
    if (roleParam) setSingleRole(roleParam);
    if (eventParam) setSingleEventId(eventParam);
  }, [searchParams]);

  // Download Sample CSV Helper
  const downloadSampleCsv = () => {
    const csvContent = 
`name,email,role,event
"Jane Doe","jane@example.com","Participant","Global Tech Summit 2026"
"John Smith","john@example.com","Keynote Speaker","Global Tech Summit 2026"
"Alice Johnson","alice@example.com","VIP Guest","Global Tech Summit 2026"`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "shim_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file) return;
    
    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Invalid file type. Please upload a .csv file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const valid = results.data.filter((row: any) => row.name && String(row.name).trim().length > 0);
        setCsvData(valid);
        setPreviewIndex(0);
        if (valid.length > 0) {
          setBulkStep(2);
        } else {
          setUploadError("Uploaded CSV contains no valid rows with a 'name' column.");
        }
      },
      error: () => {
        setUploadError("Failed to parse the CSV file.");
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Helper to draw a single certificate on jsPDF
  const renderCertToPdf = async (pdf: jsPDF, cert: any, design: any, isFirst: boolean) => {
    if (!isFirst) pdf.addPage();

    if (design.canvasElements) {
      if (design.backgroundImageUrl) {
        try {
          const imgType = design.backgroundImageUrl.includes('image/png') ? 'PNG' : 'JPEG';
          pdf.addImage(design.backgroundImageUrl, imgType, 0, 0, 297, 210);
        } catch (err) {
          console.error("Failed to load custom background image", err);
        }
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 297, 210, "F");
      }

      const pxToMmX = (px: number) => px * (297 / 3508);
      const pxToMmY = (px: number) => px * (210 / 2480);

      for (const el of design.canvasElements) {
        if (el.type === 'image' && el.src) {
          try {
            const imgType = el.src.includes('image/png') ? 'PNG' : 'JPEG';
            pdf.addImage(el.src, imgType, pxToMmX(el.x), pxToMmY(el.y), pxToMmX(el.width), pxToMmY(el.height || 100));
          } catch(e) {}
          continue;
        }

        if (el.type === 'qrCode' && design.showQr !== false) {
          try {
            const validateUrl = `${window.location.origin}/validate/${cert.id}`;
            const qrDataUrl = await QRCode.toDataURL(validateUrl, { margin: 0 });
            const qrSize = pxToMmX(el.width || 100);
            pdf.addImage(qrDataUrl, "PNG", pxToMmX(el.x), pxToMmY(el.y), qrSize, qrSize);
          } catch (e) {}
          continue;
        }

        if (el.type === 'dynamicText' || el.type === 'staticText') {
          let content = el.text || "";
          if (el.type === 'dynamicText') {
            if (el.text === "recipientName") content = cert.recipientName || "";
            else if (el.text === "role") content = cert.role || "";
            else if (el.text === "eventName") content = cert.eventId || "";
            else if (el.text === "issueDate") content = new Date(cert.issueDate || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
          }

          if (!content) continue;

          // Map HTML fonts to jsPDF standard fonts
          let pdfFont = "helvetica";
          if (el.fontFamily?.includes("serif")) pdfFont = "times";
          if (el.fontFamily?.includes("mono")) pdfFont = "courier";

          let pdfStyle = "normal";
          if (el.fontWeight === "bold" && el.fontStyle === "italic") pdfStyle = "bolditalic";
          else if (el.fontWeight === "bold") pdfStyle = "bold";
          else if (el.fontStyle === "italic") pdfStyle = "italic";

          pdf.setFont(pdfFont, pdfStyle);
          pdf.setFontSize((el.fontSize || 16) * (210 / 2480) * 3.5); // Adjusted font scale roughly matching HTML line heights
          pdf.setTextColor(el.color || "#000000");
          
          let textX = pxToMmX(el.x);
          if (el.align === 'center') textX += pxToMmX(el.width) / 2;
          else if (el.align === 'right') textX += pxToMmX(el.width);

          pdf.text(content, textX, pxToMmY(el.y) + (el.fontSize || 16) * 0.35, { align: el.align || "left", maxWidth: pxToMmX(el.width) });
        }
      }
      return;
    }
    // Default Rendering Logic (No Custom Background)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 297, 210, "F");

    const primaryBorder = [79, 70, 229]; // Indigo 600 default

    pdf.setDrawColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
    pdf.setLineWidth(3);
    pdf.rect(10, 10, 277, 190);
    pdf.setLineWidth(0.75);
    pdf.rect(13, 13, 271, 184);

    // Institution Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(design.institutionName || "EVENT CERTIFICATE PLATFORM", 148.5, 26, { align: "center" });

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(design.institutionSub || "OFFICIAL CERTIFICATION PORTAL", 148.5, 32, { align: "center" });

    // Certificate Title
    pdf.setFont("times", "bold");
    pdf.setFontSize(26);
    pdf.setTextColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
    pdf.text(design.certificateTitle || "Certificate of Completion", 148.5, 52, { align: "center" });

    if (design.honorText) {
      pdf.setFont("times", "italic");
      pdf.setFontSize(11);
      pdf.setTextColor(71, 85, 105);
      pdf.text(design.honorText, 148.5, 60, { align: "center" });
    }

    // Prefix
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(design.prefixText || "This certificate is proudly presented to", 148.5, 75, { align: "center" });

    // Recipient Name with dynamic scaling
    const nameLen = (cert.recipientName || "").length;
    const pdfNameSize = nameLen > 42 ? 17 : nameLen > 28 ? 22 : 28;
    pdf.setFont("times", "bold");
    pdf.setFontSize(pdfNameSize);
    pdf.setTextColor(15, 23, 42);
    pdf.text(cert.recipientName, 148.5, 96, { align: "center" });
    pdf.setDrawColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
    pdf.setLineWidth(0.5);
    pdf.line(70, 100, 227, 100);

    // Completion text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(design.completionText || "has successfully completed the requirements for", 148.5, 112, { align: "center" });

    // Course Name with dynamic scaling
    const roleLen = (cert.role || "").length;
    const pdfCourseSize = roleLen > 45 ? 12 : 16;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(pdfCourseSize);
    pdf.setTextColor(15, 23, 42);
    pdf.text(cert.role || "General Event Program", 148.5, 124, { align: "center" });

    // Course Outcomes (if available)
    if (cert.eventId) {
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      const lines = cert.eventId
        .split(/\n+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
      lines.forEach((l: string, idx: number) => {
        pdf.text(l.substring(0, 95), 148.5, 136 + (idx * 4.2), { align: "center" });
      });
    }

    // Signatories Section
    const dateStr = new Date(cert.issueDate || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    
    // Left Signatory
    pdf.setFont("times", "italic");
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(design.firstSignatoryName?.split(" ")[1] || "Organizer", 60, 172, { align: "center" });
    pdf.setLineWidth(0.5);
    pdf.line(35, 175, 85, 175);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(design.firstSignatoryName || "Event Organizer", 60, 180, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(design.firstSignatoryTitle || "Main Host", 60, 184, { align: "center" });

    // Center Seal representation
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(primaryBorder[0], primaryBorder[1], primaryBorder[2]);
    pdf.text("• OFFICIAL VERIFIED EVENT •", 148.5, 178, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Issued: ${dateStr}`, 148.5, 183, { align: "center" });

    // Right Signatory
    pdf.setFont("times", "italic");
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(design.secondSignatoryName?.split(" ")[1] || "Sponsor", 215, 172, { align: "center" });
    pdf.setLineWidth(0.5);
    pdf.line(190, 175, 240, 175);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(design.secondSignatoryName || "Keynote Speaker", 215, 180, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(design.secondSignatoryTitle || "Guest Speaker", 215, 184, { align: "center" });

    // QR Code
    if (design.showQr !== false) {
      const validateUrl = `${window.location.origin}/validate/${cert.id}`;
      const qrDataUrl = await QRCode.toDataURL(validateUrl, { margin: 1, width: 120 });
      
      let qrX = 250;
      let qrY = 155;
      
      if (design.qrPosition === "bottom-left") {
        qrX = 17;
        qrY = 155;
      } else if (design.qrPosition === "top-right") {
        qrX = 250;
        qrY = 15;
      } else if (design.qrPosition === "top-left") {
        qrX = 17;
        qrY = 15;
      }

      pdf.addImage(qrDataUrl, "PNG", qrX, qrY, 30, 30);
      pdf.setFontSize(6);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`ID: ${cert.id.substring(0, 8)}`, qrX + 15, qrY + 33, { align: "center" });
    }
  };

  // Handle Single Issue
  const handleSingleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !singleName.trim()) {
      alert("Please provide candidate name and select a template.");
      return;
    }

    setSingleIssuing(true);
    setSingleSuccess(null);

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: singleName.trim(),
          recipientEmail: singleEmail.trim(),
          role: singleRole.trim() || selectedTemplate.name,
          eventId: singleEventId.trim(),
          templateId: selectedTemplate.id,
        })
      });

      if (!res.ok) throw new Error("Failed to issue single certificate");

      const certificate = await res.json();
      setSingleSuccess(certificate);

      // Generate PDF
      const pdf = new jsPDF("l", "mm", "a4");
      let design = {};
      try {
        design = JSON.parse(selectedTemplate.designData);
      } catch (e) {}

      await renderCertToPdf(pdf, certificate, design, true);
      pdf.save(`Certificate_${certificate.recipientName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error issuing credential.");
    } finally {
      setSingleIssuing(false);
    }
  };

  // Handle Bulk Issue
  const handleBulkIssue = async () => {
    if (!selectedTemplate || csvData.length === 0) return;

    setBulkIssuing(true);

    try {
      const res = await fetch("/api/certificates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipients: csvData,
          defaultRole: selectedTemplate.name
        })
      });

      if (!res.ok) throw new Error("Bulk issuance failed");

      const { certificates } = await res.json();
      setIssuedCerts(certificates);

      // Generate multi-page PDF
      const pdf = new jsPDF("l", "mm", "a4");
      let design = {};
      try {
        design = JSON.parse(selectedTemplate.designData);
      } catch (e) {}

      for (let i = 0; i < certificates.length; i++) {
        await renderCertToPdf(pdf, certificates[i], design, i === 0);
      }

      pdf.save(`Batch_Certificates_${certificates.length}.pdf`);
      setBulkSuccessMsg(`Successfully generated, issued, and downloaded ${certificates.length} validated credentials.`);
      setBulkStep(3);
    } catch (err) {
      console.error(err);
      alert("Error processing batch credential issuance.");
    } finally {
      setBulkIssuing(false);
    }
  };

  let parsedPreviewDesign = {};
  if (selectedTemplate) {
    try {
      parsedPreviewDesign = JSON.parse(selectedTemplate.designData);
    } catch (e) {}
  }

  const templateSelectorBlock = (
    <div className="bg-white border-2 border-black p-6 flex flex-col gap-4">
      <div className="w-full">
        <label className="text-xs font-bold text-black uppercase tracking-widest mb-2 block">
          Active Template Profile
        </label>
        <div className="relative">
          <LayoutTemplate size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
          <select
            className="input-field pl-12 bg-white border-2 border-black w-full uppercase tracking-widest text-xs font-bold focus: cursor-pointer"
            value={selectedTemplate?.id || ""}
            onChange={(e) => {
              const t = templates.find(item => item.id === e.target.value);
              if (t) setSelectedTemplate(t);
            }}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t._count?.certificates || 0} ISSUED)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
        <Link href="/dashboard/templates/new" className="btn-secondary uppercase tracking-widest font-bold flex-1 flex justify-center items-center">
          <Plus size={16} className="mr-2" /> NEW TEMPLATE
        </Link>
        {selectedTemplate && (
          <Link href={`/dashboard/templates/${selectedTemplate.id}`} className="btn-secondary bg-black text-white hover:bg-gray-800 uppercase tracking-widest font-bold flex-1 flex justify-center items-center">
            Customize
          </Link>
        )}
      </div>
    </div>
  );

  let previewName = "Candidate Name";
  let previewRole = selectedTemplate?.name || "Event Role";
  let previewEvent = "";

  if (mode === "single") {
    previewName = singleName || previewName;
    previewRole = singleRole || previewRole;
    previewEvent = singleEventId;
  } else if (mode === "bulk" && csvData.length > 0) {
    const activeRow = csvData[previewIndex] || csvData[0];
    previewName = activeRow.name || previewName;
    previewRole = activeRow.role || previewRole;
    previewEvent = activeRow.event || "";
  }

  const livePreviewBlock = (
    <div className="flex flex-col h-full min-h-0">
      <div className="bg-white border-2 border-black p-6 sm:p-8 flex-1 flex flex-col relative min-h-0 overflow-hidden">
        <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-black shrink-0">
          <h3 className="text-lg font-bold text-black tracking-tighter uppercase flex items-center gap-3">
            <Eye size={20} className="text-black shrink-0" />
            Live Preview
          </h3>
          <span className="text-xs font-bold text-black border-2 border-black px-4 py-1.5 uppercase tracking-widest hidden sm:inline-block">A4 Landscape</span>
        </div>

        <div className="w-full relative flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
          <div className="w-full">
            <CertificateView 
              certificateId="PENDING-ISSUE"
              recipientName={previewName}
              role={previewRole}
              eventId={previewEvent}
              design={parsedPreviewDesign}
              status="valid"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-black shrink-0 min-h-[32px]">
          <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
            Cryptographically secured on the ledger
          </div>
          {mode === "bulk" && csvData.length > 0 && (
            <div className="flex items-center border-2 border-black bg-white h-8 ml-4">
              <button 
                onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                disabled={previewIndex === 0}
                className="px-2 h-full hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center border-r-2 border-black transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold px-4 whitespace-nowrap min-w-[80px] text-center tracking-widest uppercase">
                ROW {previewIndex + 1}
              </span>
              <button 
                onClick={() => setPreviewIndex(p => Math.min(csvData.length - 1, p + 1))}
                disabled={previewIndex === csvData.length - 1}
                className="px-2 h-full hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center border-l-2 border-black transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 py-6 min-h-0 overflow-hidden">
        
        {/* Page Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 shrink-0">
          <div>
            <h1 className="text-4xl font-bold text-black tracking-tighter uppercase leading-none mb-2">
              Generation Studio
            </h1>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
              Issue credentials individually or bulk generate via CSV.
            </p>
          </div>

          <div className="flex gap-0 border-2 border-black w-fit shrink-0">
            <button 
              type="button" 
              onClick={() => setMode("single")}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                mode === "single" 
                  ? "bg-black text-white" 
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              <UserCheck size={16} /> Individual
            </button>
            <div className="w-[2px] bg-black"></div>
            <button 
              type="button" 
              onClick={() => setMode("bulk")}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                mode === "bulk" 
                  ? "bg-black text-white" 
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              <FileSpreadsheet size={16} /> CSV Batch
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">

          {/* ================= MODE 1: SINGLE CERTIFICATE QUICK ISSUE ================= */}
          {mode === "single" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 items-stretch h-full">
              
              {/* Left Column (Template Selector & Form) */}
              <div className="flex flex-col gap-8 h-full min-h-0 pr-4">
                {templateSelectorBlock}

                <div className="bg-white border-2 border-black p-8 flex-1 overflow-y-auto min-h-0 flex flex-col">
                  <div className="mb-8 border-b-2 border-black pb-6 shrink-0">
                    <h3 className="text-2xl font-bold text-black uppercase tracking-tighter">Recipient Details</h3>
                    <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
                      Enter the details to generate and download a single credential instantly.
                    </p>
                  </div>

                  {singleSuccess && (
                    <div className="mb-8 p-6 bg-white border-2 border-black flex flex-col gap-4">
                      <div className="flex items-center gap-3 font-bold text-black uppercase tracking-tighter text-lg">
                        <CheckCircle size={24} className="text-black" />
                        <span>Credential Generated Successfully</span>
                      </div>
                      <div className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                        The PDF is downloading. Ledger ID: <code className="bg-black text-white px-2 py-1 ml-2 font-mono">{singleSuccess.id}</code>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <Link href={`/validate/${singleSuccess.id}`} target="_blank" className="btn-secondary uppercase tracking-widest font-bold text-xs py-3 px-6">
                          View in Public Portal
                        </Link>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSingleSuccess(null);
                            setSingleName("");
                            setSingleEmail("");
                          }} 
                          className="text-xs font-bold text-black hover:text-gray-600 underline uppercase tracking-widest"
                        >
                          Issue another
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSingleIssue} className="flex flex-col gap-6">
                    <div>
                      <label className="text-xs font-bold text-black uppercase tracking-widest">Full Name *</label>
                      <input 
                        type="text" 
                        className="input-field border-2 border-black focus:" 
                        value={singleName}
                        onChange={e => setSingleName(e.target.value)}
                        placeholder="E.G. JANE DOE"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-black uppercase tracking-widest">Email Address (Optional)</label>
                      <input 
                        type="email" 
                        className="input-field border-2 border-black focus:" 
                        value={singleEmail}
                        onChange={e => setSingleEmail(e.target.value)}
                        placeholder="JANE@EXAMPLE.COM"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-black uppercase tracking-widest">Role / Participation</label>
                      <input 
                        type="text" 
                        className="input-field border-2 border-black focus:" 
                        value={singleRole}
                        onChange={e => setSingleRole(e.target.value)}
                        placeholder={(selectedTemplate?.name || "E.G. KEYNOTE SPEAKER").toUpperCase()}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-black uppercase tracking-widest">Event Description / Outcomes (Optional)</label>
                      <textarea 
                        className="input-field border-2 border-black focus: min-h-[100px]" 
                        value={singleEventId}
                        onChange={e => setSingleEventId(e.target.value)}
                        placeholder="ATTENDED THE 2026 GLOBAL TECH SUMMIT..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary w-full py-4 mt-4 uppercase tracking-widest font-bold flex justify-center items-center gap-2"
                      disabled={singleIssuing || !singleName.trim()}
                    >
                      {singleIssuing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{singleIssuing ? "Generating & Signing..." : "Generate & Download"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Live Specimen Preview */}
              {livePreviewBlock}
            </div>
          )}

          {/* ================= MODE 2: BULK COHORT CSV BATCH ISSUANCE ================= */}
          {mode === "bulk" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 items-stretch h-full">
              {/* Left Column */}
              <div className="flex flex-col gap-8 h-full min-h-0 pr-4">
                {templateSelectorBlock}
                
                {bulkStep === 1 && (
                <div className="bg-white border-2 border-black p-8 max-w-4xl mx-auto w-full flex-1 overflow-y-auto min-h-0 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-2 border-black pb-6 shrink-0">
                    <div>
                      <h3 className="text-2xl font-bold text-black tracking-tighter uppercase">Upload CSV Roster</h3>
                      <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
                        Batch process thousands of certificates at once.
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={downloadSampleCsv} 
                      className="btn-secondary uppercase tracking-widest font-bold shrink-0 flex items-center whitespace-nowrap px-4 py-2 text-xs"
                    >
                      <Download size={14} className="mr-2" /> Sample CSV
                    </button>
                  </div>

                  <div 
                    className={`border-2 border-dashed ${isDragging ? "border-black bg-gray-200" : "border-gray-400 bg-gray-50"} p-10 text-center transition-all cursor-pointer group flex flex-col items-center justify-center relative mb-8 hover:bg-gray-100 hover:border-black`}
                    onClick={() => document.getElementById("csv-file-input")?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className={`w-16 h-16 border-2 border-black flex items-center justify-center mb-6 transition-colors ${isDragging ? "bg-black text-white" : "bg-white text-black group-hover:bg-black group-hover:text-white"}`}>
                      <Upload size={28} />
                    </div>
                    <h4 className="font-bold text-2xl text-black mb-3 uppercase tracking-tighter">
                      {isDragging ? "Drop CSV Here" : "Click or Drag CSV"}
                    </h4>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed mt-2">
                      Required: <code className="bg-gray-200 text-black px-2 py-1 font-mono mx-1">name</code> <br/>
                      Optional: <code className="bg-gray-200 text-black px-2 py-1 font-mono mx-1 mt-2 inline-block">email</code>, <code className="bg-gray-200 text-black px-2 py-1 font-mono mx-1 mt-2 inline-block">role</code>
                    </p>
                    {uploadError && (
                      <div className="mt-6 text-xs font-bold text-white bg-red-600 px-4 py-2 uppercase tracking-widest">
                        {uploadError}
                      </div>
                    )}
                    <input 
                      id="csv-file-input" 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </div>

                  <div className="p-5 bg-white border-2 border-black shrink-0">
                    <div className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                      <strong className="text-black mr-2">Pro Tip:</strong> Download the sample CSV and upload it immediately to test the batch generation pipeline without writing any real data.
                    </div>
                  </div>
                </div>
              )}

              {bulkStep === 2 && (
                <div className="bg-white border-2 border-black p-10 max-w-5xl mx-auto w-full flex-1 overflow-y-auto min-h-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b-2 border-black">
                    <div>
                      <h3 className="text-2xl font-bold text-black tracking-tighter uppercase flex flex-col">
                        <span>Validation:</span>
                        <span>{csvData.length} Records Found</span>
                      </h3>
                      <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">
                        Review the roster before initiating batch generation.
                      </p>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => { setBulkStep(1); setCsvData([]); setPreviewIndex(0); }} 
                      className="btn-secondary uppercase tracking-widest font-bold"
                    >
                      Change File
                    </button>
                  </div>

                  <div className="border-2 border-black overflow-hidden mb-10 max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-black sticky top-0 z-10">
                        <tr className="text-xs font-bold text-white uppercase tracking-widest">
                          <th className="px-6 py-4 border-b-2 border-black">#</th>
                          <th className="px-6 py-4 border-b-2 border-black">Name</th>
                          <th className="px-6 py-4 border-b-2 border-black">Email</th>
                          <th className="px-6 py-4 border-b-2 border-black">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-gray-200">
                        {csvData.map((row: any, i: number) => (
                          <tr 
                            key={i} 
                            onClick={() => setPreviewIndex(i)}
                            className={`transition-colors cursor-pointer ${previewIndex === i ? 'bg-gray-200 text-black' : 'hover:bg-gray-50 text-black'}`}
                          >
                            <td className={`px-6 py-4 text-xs font-bold ${previewIndex === i ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}</td>
                            <td className={`px-6 py-4 text-sm font-bold uppercase tracking-wide ${previewIndex === i ? 'text-black' : 'text-black'}`}>{row.name}</td>
                            <td className={`px-6 py-4 text-xs font-bold uppercase ${previewIndex === i ? 'text-gray-600' : 'text-gray-500'}`}>{row.email || "—"}</td>
                            <td className={`px-6 py-4 text-xs font-bold uppercase tracking-widest ${previewIndex === i ? 'text-gray-800' : 'text-gray-600'}`}>{row.role || selectedTemplate?.name || "Default"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleBulkIssue} 
                      className="btn-primary py-4 px-10 uppercase tracking-widest font-bold flex items-center gap-3"
                      disabled={bulkIssuing}
                    >
                      {bulkIssuing ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                      <span>{bulkIssuing ? `Processing ${csvData.length} Records...` : `Generate ${csvData.length} Credentials`}</span>
                    </button>
                  </div>
                </div>
              )}

              {bulkStep === 3 && (
                <div className="border-2 border-black w-full flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
                  <div className="bg-black text-white p-10 flex flex-col items-center justify-center flex-1 min-h-0 relative">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter uppercase text-center leading-none relative z-10 text-white flex items-center justify-center gap-4 sm:gap-6">
                      <CheckCircle size={48} className="text-white shrink-0" />
                      Batch Complete
                    </h2>
                  </div>
                  
                  <div className="p-8 sm:p-12 border-t-2 border-black bg-white flex flex-col items-center shrink-0">
                    <p className="text-sm font-bold text-black uppercase tracking-widest mb-8 max-w-xl mx-auto text-center leading-relaxed">
                      {bulkSuccessMsg}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-xl">
                      <button 
                        className="btn-secondary uppercase tracking-widest font-bold py-4 px-8 flex-1 border-2 border-black bg-white hover:bg-gray-100 text-black transition-colors" 
                        onClick={() => { setBulkStep(1); setCsvData([]); setPreviewIndex(0); }}
                      >
                        New Batch
                      </button>
                      <Link href="/dashboard/templates" className="btn-primary uppercase tracking-widest font-bold py-4 px-8 flex items-center justify-center gap-3 flex-1 bg-black text-white hover:bg-gray-800 transition-colors">
                        View Ledger <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {/* Right Column: Live Specimen Preview */}
              {livePreviewBlock}
            </div>
          )}

        </div>
    </div>
  );
}

export default function GenerateCertificatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin mb-4 text-indigo-600" />
        <p className="font-bold text-lg text-slate-600">Loading Generation Studio...</p>
      </div>
    }>
      <GenerateCertificatesContent />
    </Suspense>
  );
}


