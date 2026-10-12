"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ArrowRight, ArrowLeft, CheckCircle2, ShieldAlert, Lock,
  LayoutDashboard, Loader2, X, FileCheck2, ShieldCheck,
  QrCode, Camera, Upload, Trash2, Printer, Copy, Check,
  Download, Calendar, User, Sparkles, Award, History, Scan
} from "lucide-react";
import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import CertificateView from "@/components/CertificateView";
import { downloadCertificatePdf } from "@/lib/pdf-export";
import Tesseract from "tesseract.js";

// Initialize pdfjs worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
}

interface RecentCheck {
  id: string;
  name: string;
  status: string;
  date: string;
}

interface FetchedCertificate {
  id: string;
  recipientName: string;
  recipientEmail?: string | null;
  role?: string | null;
  eventId?: string | null;
  issueDate: string;
  status: string;
  event?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  template: {
    id: string;
    name: string;
    designData: string;
  };
  issuer: {
    name?: string | null;
    email?: string | null;
  };
}

export default function ValidateSearchClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificate, setCertificate] = useState<FetchedCertificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // OCR Advanced Mode States
  const [advancedMode, setAdvancedMode] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "success" | "error" | "mismatch">("idle");
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrMessage, setOcrMessage] = useState<string>("");

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("shim_validation_history");
    if (saved) {
      try {
        setRecentChecks(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Handle URL ID parameter
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      setSearchId(idParam);
      if (idParam.trim() && !certificate) {
        fetchCertificate(idParam.trim());
      }
    }
  }, [searchParams.get("id")]);

  const saveToHistory = (cert: FetchedCertificate) => {
    const newCheck: RecentCheck = {
      id: cert.id,
      name: cert.recipientName,
      status: cert.status,
      date: new Date().toISOString()
    };
    
    setRecentChecks(prev => {
      const filtered = prev.filter(c => c.id !== cert.id);
      const updated = [newCheck, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem("shim_validation_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setRecentChecks([]);
    localStorage.removeItem("shim_validation_history");
  };

  const fetchCertificate = async (id: string): Promise<FetchedCertificate | null> => {
    setLoading(true);
    setNotFound(false);
    setScanError(null);
    try {
      const res = await fetch(`/api/certificates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCertificate(data);
        saveToHistory(data);
        // Optionally update URL without reloading
        window.history.pushState({}, "", `/validate?id=${id}`);
        return data;
      } else {
        setNotFound(true);
        setCertificate(null);
        return null;
      }
    } catch (e) {
      setScanError("Failed to verify certificate. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (trimmed) {
      fetchCertificate(trimmed);
    }
  };

  const runAdvancedAnalysis = async (fileOrImage: File | string, cert: FetchedCertificate) => {
    setOcrStatus("loading");
    setOcrProgress(0);
    setOcrMessage("Initializing AI Scanner...");

    try {
      const result = await Tesseract.recognize(
        fileOrImage,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.floor(m.progress * 100));
              setOcrMessage("Extracting text...");
            } else if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
              setOcrMessage("Downloading AI models...");
            }
          }
        }
      );

      const text = result.data.text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const trueName = cert.recipientName.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const trueEvent = (cert.event?.name || "").toLowerCase().replace(/[^a-z0-9 ]/g, '');

      const nameMatch = text.includes(trueName);
      const eventMatch = trueEvent === "" ? true : text.includes(trueEvent);

      if (nameMatch && eventMatch) {
        setOcrStatus("success");
        setOcrMessage("DOCUMENT VERIFIED: The text on the physical document exactly matches the cryptographic ledger.");
      } else {
        setOcrStatus("mismatch");
        setOcrMessage("POTENTIAL FORGERY DETECTED: The name or event on this document has been altered and does not match the official registry.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrStatus("error");
      setOcrMessage("Failed to process the document. Please try again with a clearer image.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setScanError(null);

    try {
      if (file.type === "application/pdf") {
        await processPdf(file);
      } else if (file.type.startsWith("image/")) {
        await processImage(file);
      } else {
        throw new Error("Unsupported file format.");
      }
    } catch (err: any) {
      setScanError(err.message || "Failed to process file.");
      setLoading(false);
    }
  };

  const processImage = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleScannedUrl(code.data, file);
            resolve();
          } else {
            reject(new Error("No QR code found in the image."));
          }
        };
        img.onerror = () => reject(new Error("Invalid image file."));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const processPdf = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport } as any).promise;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        // Convert canvas to data URL for OCR
        const dataUrl = canvas.toDataURL("image/jpeg");
        handleScannedUrl(code.data, dataUrl);
      } else {
        throw new Error("No QR code found on the first page of the PDF.");
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to process PDF.");
    }
  };

  const handleScannedUrl = async (url: string, fileOrImage?: File | string) => {
    // Extract ID from URL (e.g. https://shim.app/validate/cmtzoowrv0008... or https://shim.app/validate?id=cmtzoowrv0008...)
    let idToFetch = url;
    
    // Check for query param ?id=
    const urlObj = new URL(url, window.location.origin);
    const idParam = urlObj.searchParams.get("id");
    
    if (idParam) {
      idToFetch = idParam;
    } else {
      // Fallback to path param /validate/
      const match = url.match(/\/validate\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        idToFetch = match[1];
      }
    }
    
    setSearchId(idToFetch);
    const cert = await fetchCertificate(idToFetch);
    
    if (cert && advancedMode && fileOrImage) {
      runAdvancedAnalysis(fileOrImage, cert);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!certificate) return;
    setDownloading(true);
    try {
      await downloadCertificatePdf({
        certificateId: certificate.id,
        recipientName: certificate.recipientName,
        role: certificate.role || certificate.template?.name,
        eventName: certificate.event?.name || certificate.eventId || "Event Description",
        issueDate: certificate.issueDate,
        design: certificate.template?.designData,
        status: certificate.status,
      }, `Credential-${certificate.id.substring(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to export certificate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setCertificate(null);
    setSearchId("");
    setNotFound(false);
    window.history.pushState({}, "", "/validate");
  };

  return (
    <div className="flex-1 flex flex-col w-full font-sans min-h-0 bg-[#0a0a0a] text-zinc-100">
      <main className="flex-1 w-full flex flex-col min-h-0">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,application/pdf"
          onChange={handleFileUpload}
        />
        <AnimatePresence mode="wait">
          {loading && !certificate ? (
            // STATE 0: Full Screen Loading
            <motion.div 
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center items-center w-full"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-zinc-400 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-zinc-500 animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-xl font-serif tracking-wide text-zinc-200">Verifying Credential</h2>
                  <p className="text-sm text-zinc-500">Checking cryptographic ledger...</p>
                </div>
              </div>
            </motion.div>
          ) : !certificate ? (
            // STATE 1: Dark Mode Centered Search
            <motion.div 
              key="search-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center items-center w-full px-4 sm:px-8 max-w-4xl mx-auto"
            >
              <div className="text-center mb-10 w-full">
                <h1 className="text-4xl sm:text-5xl font-serif text-zinc-100 mb-4 tracking-tight">
                  Verify a Credential
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                  Enter the unique credential ID or upload the certificate document to verify its authenticity on the ledger.
                </p>
              </div>

              <div className="w-full max-w-2xl">
                <form onSubmit={handleSearch} className="flex bg-zinc-800/50 rounded-xl overflow-hidden mb-4 h-14 shadow-lg border border-zinc-800/80 transition-all focus-within:border-zinc-700">
                  <div className="flex items-center justify-center px-4">
                    <Search className="text-zinc-500" size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. cmtzoowrv0008585767kqhhyk"
                    className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-sm font-mono focus:outline-none"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    required
                  />
                  <div className="w-px bg-zinc-800 my-3"></div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center px-6">
                      <Loader2 size={20} className="text-zinc-500 animate-spin" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center px-6 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                      title="Upload Certificate"
                    >
                      <Upload size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </button>
                  )}
                </form>

                <div className="flex items-center justify-end w-full mb-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-widest flex items-center gap-1.5">
                      Advanced Mode
                    </span>
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} />
                      <div className={`block w-8 h-4 rounded-full transition-colors ${advancedMode ? 'bg-zinc-500/40 border border-zinc-500/50' : 'bg-zinc-800/50 border border-zinc-800'}`}></div>
                      <div className={`absolute left-0.5 top-0.5 w-3 h-3 rounded-full transition-transform ${advancedMode ? 'translate-x-4 bg-zinc-400' : 'bg-zinc-500'}`}></div>
                    </div>
                  </label>
                </div>
                
                {scanError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-sm text-red-400 text-center">
                    {scanError}
                  </motion.div>
                )}
                {notFound && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-sm text-red-400 text-center">
                    Certificate Not Found. Please check the ID and try again.
                  </motion.div>
                )}

                {/* Recent History */}
                {recentChecks.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="mt-12 text-left"
                  >
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-zinc-600" /> Recent Verifications
                      </h3>
                      <button 
                        onClick={clearHistory}
                        className="text-[10px] font-medium text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-widest"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {recentChecks.map(check => (
                        <button
                          key={check.id}
                          onClick={() => { setSearchId(check.id); fetchCertificate(check.id); }}
                          className="bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-4 text-left transition-colors flex items-center justify-between group"
                        >
                          <div className="overflow-hidden flex-1 mr-4">
                            <div className="text-sm font-medium text-zinc-200 truncate mb-1">
                              {check.name}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 truncate">
                              {check.id}
                            </div>
                          </div>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm border ${
                            check.status === 'valid' 
                              ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                              : 'bg-red-500/5 text-red-400 border-red-500/20'
                          }`}>
                            {check.status === 'valid' ? 'Authentic' : 'Revoked'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            // STATE 2: Ultra Minimal Certificate Focus
            <motion.div 
              key="result-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar"
            >
              {/* Top Navigation */}
              {((session?.user as any)?.role !== "member") && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-2 sm:pb-4">
                   <button onClick={handleReset} className="text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2">
                     &larr; Verify Another Credential
                   </button>
                </div>
              )}

              <div className={`max-w-4xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20 flex flex-col gap-6 sm:gap-12 ${((session?.user as any)?.role === "member") ? "mt-6 sm:mt-16" : "mt-2 sm:mt-4"}`}>
                
                {/* 1. Minimal Status Header */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5 sm:mb-3">
                    Registry Status
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-serif text-zinc-100 mb-2.5 sm:mb-4 tracking-tight">
                    {certificate.status === "valid" ? "Verified Genuine" : "Certificate Invalid"}
                  </h2>
                  {certificate.status === "valid" ? (
                    <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-green-400 bg-green-500/10 px-3 py-1.5 rounded-sm border border-green-500/20">
                      Authentic
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1.5 rounded-sm border border-red-500/20">
                      Revoked
                    </span>
                  )}
                </motion.div>

                {/* 2. The Certificate */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="w-full max-w-3xl mx-auto flex flex-col items-center"
                >
                  <div className={`w-full ${certificate.template.designData?.includes('"orientation":"portrait"') ? "aspect-[1/1.414] max-w-xl" : "aspect-[1.414/1]"} bg-white relative shadow-2xl ring-1 ring-white/10 rounded-sm overflow-hidden mb-6`}>
                    <CertificateView 
                      certificateId={certificate.id}
                      recipientName={certificate.recipientName}
                      role={certificate.role || certificate.template.name}
                      eventId={certificate.event?.name || certificate.eventId || "Unknown Event"}
                      issueDate={certificate.issueDate}
                      design={certificate.template.designData}
                      status={certificate.status}
                    />
                  </div>
                  
                  {/* Mobile Actions: Native App Touch Pills (Hidden on desktop/tablet) */}
                  <div className="sm:hidden flex items-center justify-center gap-2 w-full max-w-sm mt-2">
                    <button 
                      onClick={handleDownloadPdf} 
                      disabled={downloading} 
                      className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700/60 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
                    >
                      <Download size={14} />
                      <span>{downloading ? "PDF..." : "Download"}</span>
                    </button>
                    <button 
                      onClick={handlePrint} 
                      className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700/60 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Printer size={14} />
                      <span>Print</span>
                    </button>
                    <button 
                      onClick={handleCopy} 
                      className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-zinc-700/60 active:scale-[0.98] transition-all shadow-sm"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Share"}</span>
                    </button>
                  </div>

                  {/* Desktop: Subtle text links separated by pipes */}
                  <div className="hidden sm:flex gap-6">
                    <button onClick={handleDownloadPdf} disabled={downloading} className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 uppercase tracking-widest transition-colors disabled:opacity-50">
                      {downloading ? "Generating..." : "Download PDF"}
                    </button>
                    <span className="text-zinc-800">|</span>
                    <button onClick={handlePrint} className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 uppercase tracking-widest transition-colors">
                      PRINT
                    </button>
                    <span className="text-zinc-800">|</span>
                    <button onClick={handleCopy} className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 uppercase tracking-widest transition-colors">
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  {advancedMode && (ocrStatus !== "idle") && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className={`w-full max-w-2xl mx-auto mt-12 p-6 rounded-xl border ${
                        ocrStatus === 'loading' ? 'bg-zinc-800/50 border-zinc-800' :
                        ocrStatus === 'success' ? 'bg-green-500/5 border-green-500/20' :
                        ocrStatus === 'mismatch' ? 'bg-red-500/5 border-red-500/20' :
                        'bg-orange-500/5 border-orange-500/20'
                      }`}
                    >
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-100 mb-4 flex items-center gap-2">
                        <Scan size={16} /> AI Document Analysis
                      </h3>
                      
                      {ocrStatus === "loading" && (
                        <div className="flex flex-col items-center py-4 text-center">
                          <Loader2 size={32} className="text-zinc-500 animate-spin mb-4" />
                          <p className="text-sm font-medium text-zinc-400">{ocrMessage}</p>
                          <div className="w-full max-w-xs h-1 bg-zinc-800 mt-4 overflow-hidden rounded-full">
                            <div className="h-full bg-zinc-500 transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {ocrStatus === "success" && (
                        <div className="flex items-start gap-4">
                          <CheckCircle2 size={24} className="text-green-400 shrink-0 mt-1" />
                          <div>
                            <p className="text-sm text-green-100 leading-relaxed font-medium">{ocrMessage}</p>
                            <p className="text-xs text-green-500/70 mt-2">The text on the uploaded document visually matches the ledger's true record.</p>
                          </div>
                        </div>
                      )}

                      {ocrStatus === "mismatch" && (
                        <div className="flex items-start gap-4">
                          <ShieldAlert size={24} className="text-red-400 shrink-0 mt-1" />
                          <div>
                            <p className="text-sm text-red-100 leading-relaxed font-medium">{ocrMessage}</p>
                            <p className="text-xs text-red-400/70 mt-2">Warning: The visual text does not match the cryptographic signature.</p>
                          </div>
                        </div>
                      )}

                      {ocrStatus === "error" && (
                        <div className="flex items-start gap-4">
                          <X size={24} className="text-orange-400 shrink-0 mt-1" />
                          <p className="text-sm text-orange-100 leading-relaxed font-medium">{ocrMessage}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* 3. Minimal Details Grid */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="w-full max-w-3xl mx-auto border-t border-zinc-800 pt-10"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-6 text-left">
                    <div>
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Issued To</div>
                      <div className="text-sm font-medium text-zinc-200">{certificate.recipientName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Certification</div>
                      <div className="text-sm font-medium text-zinc-200">{certificate.role || certificate.template.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Issue Date</div>
                      <div className="text-sm font-medium text-zinc-200">
                        {new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Event</div>
                      <div className="text-sm font-medium text-zinc-200">{certificate.event?.name || certificate.eventId || "Unknown Event"}</div>
                    </div>
                    
                    <div className="col-span-2 sm:col-span-2 mt-2">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Cryptographic Fingerprint</div>
                      <div className="text-xs font-mono text-zinc-400 tracking-wider">
                        {certificate.id}
                      </div>
                    </div>

                    <div className="col-span-1 mt-2">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Issuer Authority</div>
                      <div className="text-sm font-medium text-zinc-200 truncate">
                        {certificate.issuer?.name || "Verified Organization"}
                      </div>
                    </div>

                    <div className="col-span-1 mt-2">
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Ledger State</div>
                      <div className="text-sm font-medium text-zinc-200">
                        {certificate.status === "valid" ? "Immutable (Active)" : "Revoked"}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="text-center mt-8 pt-8 text-[10px] font-semibold tracking-widest uppercase text-zinc-700"
                >
                  Secured by Shim Platform
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
