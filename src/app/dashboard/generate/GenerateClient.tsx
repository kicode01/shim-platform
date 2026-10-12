"use client";

import { useState, useEffect, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import Papa from "papaparse";
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
import { downloadCertificatePdf, downloadBatchCertificatesPdf } from "@/lib/pdf-export";

function GenerateCertificatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("templateId");

  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [mobileViewTab, setMobileViewTab] = useState<"form" | "preview">("form");
  
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
  const [bulkEventId, setBulkEventId] = useState("");
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
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    setIsLoadingTemplates(true);
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
      .catch(err => console.error("Error fetching templates:", err))
      .finally(() => setIsLoadingTemplates(false));
  }, [preselectedTemplateId]);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const eventParam = searchParams.get("event");
    if (roleParam) setSingleRole(roleParam);
    if (eventParam) setSingleEventId(eventParam);
  }, [searchParams]);

  // Download Sample CSV Helper with proper UTF-8 BOM and memory cleanup
  const downloadSampleCsv = () => {
    const csvContent = 
      "\uFEFFname,email,role,event\n" +
      '"Jane Doe","jane@example.com","Participant","Global Tech Summit 2026"\n' +
      '"John Smith","john@example.com","Keynote Speaker","Global Tech Summit 2026"\n' +
      '"Alice Johnson","alice@example.com","VIP Guest","Global Tech Summit 2026"';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "shim_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // Handle Single Issue
  const handleSingleIssue = async (e: React.FormEvent | null, shouldDownload: boolean = true) => {
    if (e) e.preventDefault();
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

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || `Failed to issue certificate (HTTP ${res.status})`);
      }

      const certificate = await res.json();
      setSingleSuccess(certificate);

      if (shouldDownload) {
        try {
          const selectedEvent = events.find(ev => ev.id === singleEventId);
          const resolvedEventName = certificate.event?.name || selectedEvent?.name || singleEventId || "Event Description";
          await downloadCertificatePdf({
            certificateId: certificate.id,
            recipientName: certificate.recipientName,
            role: certificate.role || selectedTemplate.name,
            eventName: resolvedEventName,
            issueDate: certificate.issueDate,
            design: selectedTemplate.designData,
            status: certificate.status || "valid",
          });
        } catch (pdfErr) {
          console.error("PDF generation/download error:", pdfErr);
        }
      }
    } catch (err: any) {
      console.error("Issuance error:", err);
      alert(err.message || "Error issuing credential.");
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
          defaultRole: selectedTemplate.name,
          defaultEventId: bulkEventId
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || errJson?.error || `Bulk issuance failed (HTTP ${res.status})`);
      }

      const { certificates } = await res.json();
      setIssuedCerts(certificates);

      // Generate multi-page PDF with 1:1 preview fidelity
      try {
        const certRenderList = certificates.map((cert: any, idx: number) => {
          const row = csvData[idx];
          let evName = cert.event?.name;
          if (!evName && row?.event) evName = row.event;
          if (!evName && bulkEventId) {
            evName = events.find(ev => ev.id === bulkEventId)?.name || bulkEventId;
          }
          if (!evName) evName = "Event Description";
          return {
            certificateId: cert.id,
            recipientName: cert.recipientName,
            role: cert.role || selectedTemplate.name,
            eventName: evName,
            issueDate: cert.issueDate,
            design: selectedTemplate.designData,
            status: cert.status || "valid",
          };
        });

        await downloadBatchCertificatesPdf(certRenderList);
      } catch (pdfErr) {
        console.error("Bulk PDF export error:", pdfErr);
      }

      setBulkSuccessMsg(`Successfully generated, issued, and registered ${certificates.length} validated credentials.`);
      setBulkStep(3);
    } catch (err: any) {
      console.error("Bulk issuance error:", err);
      alert(err.message || "Error processing batch credential issuance.");
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
    <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-5 shadow-sm">
      <div className="w-full">
        <label className="text-sm font-medium text-zinc-700 mb-2 block">
          Active Template Profile
        </label>
        <div className="relative">
            <Select
              value={selectedTemplate?.id || ""}
              onChange={(value) => {
                const t = templates.find(item => item.id === value);
                if (t) {
                  setSelectedTemplate(t);
                  if (singleSuccess && singleSuccess.templateId !== t.id) {
                    setSingleSuccess(null);
                  }
                }
              }}
              options={templates.map(t => ({
                value: t.id,
                label: `${t.name} (${t._count?.certificates || 0} Issued)`,
                icon: <LayoutTemplate size={18} className="text-zinc-400" />
              }))}
              placeholder="Select a Template"
              className="w-full"
              dropdownClassName="w-full"
              isLoading={isLoadingTemplates}
            />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <Link href="/dashboard/templates/new" className="flex-1 btn-secondary">
          <Plus size={16} /> New Template
        </Link>
        {selectedTemplate && (
          <Link href={`/dashboard/templates/${selectedTemplate.id}`} className="flex-1 btn-primary">
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
      const selectedEvent = events.find(e => e.id === singleEventId);
      previewEvent = selectedEvent ? selectedEvent.name : singleEventId;
    } else if (mode === "bulk" && csvData.length > 0) {
      const activeRow = csvData[previewIndex] || csvData[0];
      previewName = activeRow.name || previewName;
      previewRole = activeRow.role || previewRole;
      if (activeRow.event) {
        previewEvent = activeRow.event;
      } else if (bulkEventId) {
        const selectedEvent = events.find(e => e.id === bulkEventId);
        previewEvent = selectedEvent ? selectedEvent.name : bulkEventId;
      }
    }

  const livePreviewBlock = (
    <div className={`flex-col h-full min-h-0 ${mobileViewTab === "preview" ? "flex" : "hidden xl:flex"}`}>
      <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 flex-1 flex flex-col relative min-h-0 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-700">
              Live Preview
            </h3>
          </div>
          <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full hidden sm:inline-block">
            {(parsedPreviewDesign as any)?.orientation === "portrait" ? "A4 Portrait" : "A4 Landscape"}
          </span>
        </div>

        <div className="w-full relative flex-1 min-h-[260px] sm:min-h-[340px] flex flex-col justify-center items-center overflow-hidden p-2 lg:p-4">
          <div className="w-full h-full relative mx-auto max-w-5xl flex items-center justify-center">
            {isLoadingTemplates ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/50 backdrop-blur-sm rounded-lg border border-zinc-100 z-10 animate-in fade-in">
                <Loader2 size={32} className="animate-spin text-zinc-400 mb-3" />
                <p className="text-sm font-medium text-zinc-500">Loading template...</p>
              </div>
            ) : (
              <div className={`w-full ${(parsedPreviewDesign as any)?.orientation === "portrait" ? "aspect-[1/1.414] max-w-md" : "aspect-[1.414/1] max-w-full"} relative overflow-hidden rounded-lg shadow-sm border border-zinc-200/80 bg-white`}>
                <CertificateView 
                  certificateId="PENDING-ISSUE"
                  recipientName={previewName}
                  role={previewRole}
                  eventId={previewEvent}
                  design={parsedPreviewDesign}
                  status="valid"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-100 shrink-0 min-h-[32px]">
          <div className="text-xs font-medium text-zinc-400 truncate">
            Cryptographically secured on the ledger
          </div>
          {mode === "bulk" && csvData.length > 0 && (
            <div className="flex items-center border border-zinc-200 rounded-md bg-white h-8 ml-4 shadow-sm overflow-hidden shrink-0">
              <button 
                onClick={() => setPreviewIndex(p => Math.max(0, p - 1))}
                disabled={previewIndex === 0}
                className="px-2 h-full hover:bg-zinc-50 text-zinc-600 disabled:opacity-50 flex items-center justify-center border-r border-zinc-200 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium px-4 whitespace-nowrap min-w-[80px] text-center text-zinc-700">
                ROW {previewIndex + 1}
              </span>
              <button 
                onClick={() => setPreviewIndex(p => Math.min(csvData.length - 1, p + 1))}
                disabled={previewIndex === csvData.length - 1}
                className="px-2 h-full hover:bg-zinc-50 text-zinc-600 disabled:opacity-50 flex items-center justify-center border-l border-zinc-200 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Quick Action Bar inside Preview Tab */}
        <div className="xl:hidden flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100 shrink-0">
          <button
            type="button"
            onClick={() => setMobileViewTab("form")}
            className="flex-1 py-3 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors text-center"
          >
            ← Edit Details
          </button>
          {mode === "single" ? (
            <button
              type="button"
              onClick={() => handleSingleIssue(null, false)}
              disabled={singleIssuing || !singleName.trim()}
              className="flex-1 py-3 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              {singleIssuing && <Loader2 size={14} className="animate-spin" />}
              <span>Issue Credential</span>
            </button>
          ) : bulkStep === 2 ? (
            <button
              type="button"
              onClick={handleBulkIssue}
              disabled={bulkIssuing || csvData.length === 0}
              className="flex-1 py-3 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
            >
              {bulkIssuing && <Loader2 size={14} className="animate-spin" />}
              <span>Issue Batch ({csvData.length})</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
        
        {/* Page Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">
              Generation Studio
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium">
              Issue credentials individually or bulk generate via CSV.
            </p>
          </div>

          <div className="flex p-1 bg-zinc-100 rounded-xl shrink-0 w-full xl:w-auto border border-zinc-200/80">
            <button 
              type="button" 
              onClick={() => setMode("single")}
              className={`flex-1 xl:flex-initial flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === "single" 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
              }`}
            >
              <UserCheck size={15} /> <span>Individual</span>
            </button>
            <button 
              type="button" 
              onClick={() => setMode("bulk")}
              className={`flex-1 xl:flex-initial flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === "bulk" 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
              }`}
            >
              <FileSpreadsheet size={15} /> <span>CSV Batch</span>
            </button>
          </div>
        </div>

        {/* Mobile App Segmented Switcher (Hidden on desktop xl) */}
        <div className="xl:hidden flex p-1 bg-zinc-100 rounded-xl mb-4 border border-zinc-200/80 shrink-0">
          <button
            type="button"
            onClick={() => setMobileViewTab("form")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileViewTab === "form"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <UserCheck size={14} />
            <span>{mode === "single" ? "Recipient Details" : `Batch Setup (${bulkStep === 1 ? "Upload" : "Review"})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewTab("preview")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileViewTab === "preview"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Eye size={14} />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Main Content Area.
            `mob-scroll-pane` (mobile only): the desktop layout relies on the
            page being short and lets an inner panel scroll. Once the panels
            below are released with `mob-flow` they grow past this box, so this
            is the element that has to become the scroller on a phone. */}
        <div className="mob-scroll-pane flex-1 overflow-hidden min-h-0 flex flex-col">

          {/* ================= MODE 1: SINGLE CERTIFICATE QUICK ISSUE ================= */}
          {mode === "single" && (
            <div className="mob-flow grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 items-stretch h-full">
              
              {/* Left Column (Template Selector & Form) */}
              <div className={`mob-flow flex-col gap-6 xl:gap-8 h-full min-h-0 pr-0 xl:pr-4 ${
                mobileViewTab === "form" ? "flex" : "hidden xl:flex"
              }`}>
                {templateSelectorBlock}

                <div className="mob-flow bg-white border border-zinc-200 rounded-xl flex-1 flex flex-col shadow-sm overflow-hidden min-h-0">
                  <div className="border-b border-zinc-100 shrink-0 flex justify-between items-start px-6 sm:px-8 py-5 sm:py-6">
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-700">Recipient Details</h3>
                      <p className="text-sm font-medium text-zinc-500 mt-1">
                        Enter the details to generate a credential instantly.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setSingleName("");
                        setSingleEmail("");
                        setSingleRole("");
                        setSingleEventId("");
                        setSingleSuccess(null);
                      }}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Mobile-only Preview Trigger Banner */}
                  <div className="xl:hidden px-6 pt-4">
                    <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-700">Live preview active</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileViewTab("preview")}
                        title="Inspect Live Certificate"
                        aria-label="Inspect Live Certificate"
                        className="h-8 w-8 text-zinc-700 bg-white border border-zinc-200 rounded-lg shadow-xs hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="px-8 pb-8 pt-6 flex flex-col flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    {singleSuccess && (
                    <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-lg flex flex-col gap-3">
                      <div className="flex items-center gap-2 font-semibold text-emerald-800">
                        <CheckCircle size={20} />
                        <span>Credential Generated Successfully</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-emerald-700">
                        <div>
                          Ledger ID: <code className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-mono text-emerald-900 ml-1">{singleSuccess.id}</code>
                        </div>
                        {singleSuccess.template?.name && (
                          <div className="text-xs text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                            Template: <span className="font-semibold">{singleSuccess.template.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Link href={`/validate/${singleSuccess.id}`} target="_blank" className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-md text-sm font-medium transition-colors shadow-sm">
                          View in Public Portal
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            const selectedEvent = events.find(ev => ev.id === singleEventId);
                            const resolvedEventName = singleSuccess.event?.name || selectedEvent?.name || singleEventId || "Event Description";
                            await downloadCertificatePdf({
                              certificateId: singleSuccess.id,
                              recipientName: singleSuccess.recipientName,
                              role: singleSuccess.role || singleSuccess.template?.name || selectedTemplate?.name,
                              eventName: resolvedEventName,
                              issueDate: singleSuccess.issueDate,
                              design: singleSuccess.template?.designData || selectedTemplate?.designData,
                              status: singleSuccess.status || "valid",
                            });
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Download size={14} /> Download PDF
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSingleSuccess(null);
                            setSingleName("");
                            setSingleEmail("");
                          }} 
                          className="text-sm font-medium text-emerald-700 hover:text-emerald-900 hover:underline transition-colors ml-auto"
                        >
                          Issue another
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={(e) => handleSingleIssue(e, true)} className="flex flex-col gap-5">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Full Name *</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent placeholder:text-zinc-400 shadow-sm" 
                        value={singleName}
                        onChange={e => setSingleName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Email Address (Optional)</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent placeholder:text-zinc-400 shadow-sm" 
                        value={singleEmail}
                        onChange={e => setSingleEmail(e.target.value)}
                        placeholder="jane@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Role / Participation</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent placeholder:text-zinc-400 shadow-sm" 
                        value={singleRole}
                        onChange={e => setSingleRole(e.target.value)}
                        placeholder={selectedTemplate?.name || "e.g. Keynote Speaker"}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Select Event</label>
                      <div className="relative">
                        <Select
                          value={singleEventId}
                          onChange={setSingleEventId}
                          options={[
                            { value: "", label: "-- Choose an Event --" },
                            ...events.map(ev => ({
                              value: ev.id,
                              label: ev.name
                            }))
                          ]}
                          placeholder="-- Choose an Event --"
                          className="w-full"
                          dropdownClassName="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button 
                        type="button"
                        onClick={() => handleSingleIssue(null, false)}
                        className="sm:w-1/2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 py-3 rounded-md text-sm font-medium flex justify-center items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                        disabled={singleIssuing || !singleName.trim()}
                      >
                        {singleIssuing && <Loader2 size={18} className="animate-spin" />}
                        <span>Issue Only</span>
                      </button>
                      <button 
                        type="submit" 
                        className="sm:w-1/2 bg-zinc-700 hover:bg-zinc-700 text-white py-3 rounded-md text-sm font-medium flex justify-center items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={singleIssuing || !singleName.trim()}
                      >
                        {singleIssuing && <Loader2 size={18} className="animate-spin" />}
                        <span>Issue & Download</span>
                      </button>
                    </div>
                  </form>
                  </div>
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
              <div className={`flex-col gap-6 xl:gap-8 h-full min-h-0 pr-0 xl:pr-4 ${
                mobileViewTab === "form" ? "flex" : "hidden xl:flex"
              }`}>
                {templateSelectorBlock}
                
                {bulkStep === 1 && (
                <div className="bg-white border border-zinc-200 rounded-xl max-w-4xl mx-auto w-full flex-1 flex flex-col shadow-sm overflow-hidden min-h-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 shrink-0 px-8 py-6">
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-700">Upload CSV Roster</h3>
                      <p className="text-sm font-medium text-zinc-500 mt-1">
                        Batch process thousands of certificates at once.
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={downloadSampleCsv} 
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-md text-sm font-medium transition-colors shadow-sm shrink-0 whitespace-nowrap"
                    >
                      <Download size={16} /> Sample CSV
                    </button>
                  </div>

                  <div className="px-8 pb-8 pt-6 flex flex-col flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <div className="mb-6 shrink-0">
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Select Default Event (Optional)</label>
                      <p className="text-xs text-zinc-500 mb-2">If your CSV doesn't specify an event for a row, this event will be used.</p>
                      <div className="relative">
                        <Select
                          value={bulkEventId}
                          onChange={setBulkEventId}
                          options={[
                            { value: "", label: "-- No Default Event --" },
                            ...events.map(ev => ({
                              value: ev.id,
                              label: ev.name
                            }))
                          ]}
                          placeholder="-- No Default Event --"
                          className="w-full"
                          dropdownClassName="w-full"
                        />
                      </div>
                    </div>

                    <div 
                      className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative mb-8 hover:bg-zinc-50 ${isDragging ? "border-zinc-700 bg-zinc-50" : "border-zinc-300 bg-white hover:border-zinc-400"}`}
                      onClick={() => document.getElementById("csv-file-input")?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 transition-colors ${isDragging ? "bg-zinc-700 text-white shadow-md" : "bg-zinc-100 text-zinc-500 shadow-sm"}`}>
                        <Upload size={24} />
                      </div>
                      <h4 className="text-lg font-semibold text-zinc-700 mb-2">
                        {isDragging ? "Drop CSV Here" : "Click or Drag CSV to upload"}
                      </h4>
                      <p className="text-sm font-medium text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        Required: <code className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono mx-0.5">name</code> <br/>
                        Optional: <code className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono mx-0.5 mt-1 inline-block">email</code>, <code className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded font-mono mx-0.5 mt-1 inline-block">role</code>
                      </p>
                      {uploadError && (
                        <div className="mt-6 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-md">
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

                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg shrink-0">
                      <div className="text-sm font-medium text-zinc-700 leading-relaxed">
                        <strong className="mr-1">Pro Tip:</strong> Download the sample CSV and upload it immediately to test the batch generation pipeline without writing any real data.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {bulkStep === 2 && (
                <div className="bg-white border border-zinc-200 rounded-xl max-w-5xl mx-auto w-full flex-1 flex flex-col shadow-sm overflow-hidden min-h-0">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-zinc-100 shrink-0 px-8 py-6">
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-700 flex items-center gap-2">
                        Validation: {csvData.length} Records
                      </h3>
                      <p className="text-sm font-medium text-zinc-500 mt-1">
                        Review the roster before initiating batch generation.
                      </p>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => { setBulkStep(1); setCsvData([]); setPreviewIndex(0); }} 
                      className="px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      Change File
                    </button>
                  </div>

                  <div className="px-6 sm:px-8 pb-8 pt-6 flex flex-col flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    {/* Mobile-only Preview Trigger Banner */}
                    <div className="xl:hidden mb-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-700">Previewing row {previewIndex + 1} of {csvData.length}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMobileViewTab("preview")}
                          title="View Specimen Preview"
                          aria-label="View Specimen Preview"
                          className="h-8 w-8 text-zinc-700 bg-white border border-zinc-200 rounded-lg shadow-xs hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center transition-colors active:scale-95 shrink-0"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="border border-zinc-200 rounded-lg overflow-x-auto mb-8 max-h-[400px] overflow-y-auto shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-50 sticky top-0 z-10 border-b border-zinc-200">
                          <tr className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            <th className="px-6 py-3">#</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white">
                          {csvData.map((row: any, i: number) => (
                            <tr 
                              key={i} 
                              onClick={() => setPreviewIndex(i)}
                              className={`transition-colors cursor-pointer ${previewIndex === i ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
                            >
                              <td className="px-6 py-3 text-sm font-medium text-zinc-500">{i + 1}</td>
                              <td className="px-6 py-3 text-sm font-semibold text-zinc-700">{row.name}</td>
                              <td className="px-6 py-3 text-sm font-medium text-zinc-600">{row.email || "—"}</td>
                              <td className="px-6 py-3 text-sm font-medium text-zinc-600">{row.role || selectedTemplate?.name || "Default"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={handleBulkIssue} 
                        className="bg-zinc-700 hover:bg-zinc-700 text-white py-3 px-8 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={bulkIssuing}
                      >
                        {bulkIssuing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                        <span>{bulkIssuing ? `Processing ${csvData.length} Records...` : `Generate ${csvData.length} Credentials`}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {bulkStep === 3 && (
                <div className="border border-zinc-200 rounded-xl w-full flex-1 flex flex-col min-h-0 overflow-hidden bg-white shadow-sm">
                  <div className="bg-emerald-50 text-emerald-900 p-10 flex flex-col items-center justify-center flex-1 min-h-0 relative border-b border-emerald-100">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-center leading-none relative z-10">
                      Batch Complete
                    </h2>
                  </div>
                  
                  <div className="p-8 sm:p-12 bg-white flex flex-col items-center shrink-0">
                    <p className="text-base font-medium text-zinc-600 mb-8 max-w-xl mx-auto text-center leading-relaxed">
                      {bulkSuccessMsg}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-xl">
                      <button 
                        className="px-6 py-3 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-md text-sm font-medium transition-colors shadow-sm flex-1 text-center" 
                        onClick={() => { setBulkStep(1); setCsvData([]); setPreviewIndex(0); }}
                      >
                        New Batch
                      </button>
                      <Link href="/dashboard" className="px-6 py-3 bg-zinc-700 text-white hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 flex-1">
                        View Overview <ArrowRight size={16} />
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
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin mb-4 text-zinc-700" />
        <p className="font-bold text-lg text-zinc-600">Loading Generation Studio...</p>
      </div>
    }>
      <GenerateCertificatesContent />
    </Suspense>
  );
}


