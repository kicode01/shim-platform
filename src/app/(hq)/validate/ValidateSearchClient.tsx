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
import { computeCertificateFingerprint } from "@/lib/security";
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
  fingerprint?: string;
  isPiiMasked?: boolean;
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

export function extractCertificateId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.includes("://") || trimmed.includes("/validate")) {
      const parsedUrl = trimmed.includes("://")
        ? new URL(trimmed)
        : new URL(trimmed, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const idParam = parsedUrl.searchParams.get("id");
      if (idParam) return idParam.trim();
      const match = parsedUrl.pathname.match(/\/validate\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1].trim();
    }
  } catch {
    // Fallback regex matching if URL parsing fails
    const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (queryMatch && queryMatch[1]) return queryMatch[1].trim();
    const pathMatch = trimmed.match(/\/validate\/([a-zA-Z0-9_-]+)/);
    if (pathMatch && pathMatch[1]) return pathMatch[1].trim();
  }
  return trimmed;
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
  const [copiedHash, setCopiedHash] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const displayFingerprint = certificate
    ? certificate.fingerprint || computeCertificateFingerprint({
        id: certificate.id,
        recipientName: certificate.recipientName,
        role: certificate.role || certificate.template?.name,
        eventName: certificate.event?.name || certificate.eventId || "Event Description",
        issueDate: certificate.issueDate,
        issuerId: (certificate as any).issuerId,
      })
    : "";

  // OCR Advanced Mode States
  const [advancedMode, setAdvancedMode] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "success" | "error" | "mismatch">("idle");
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrMessage, setOcrMessage] = useState<string>("");

  // Live Camera Scanner States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

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
    const extracted = extractCertificateId(searchId);
    if (extracted) {
      if (extracted !== searchId.trim()) {
        setSearchId(extracted);
      }
      fetchCertificate(extracted);
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

    // Reset input value so the same file can be selected again if needed
    e.target.value = "";

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

  const extractIdFromOcrText = (rawText: string): string => {
    if (!rawText) return "";
    // 1. Direct match after ID: / 1D: / lD:
    const directMatch = rawText.match(/(?:[I1l|]D|CREDENTIAL)[:.;\s-]+([a-zA-Z0-9]{18,32})/i);
    if (directMatch?.[1]) return directMatch[1].trim().toLowerCase();

    // 2. Match after ID: even if OCR inserted a space inside the 25-char CUID
    const lines = rawText.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/(?:[I1l|]D)[:.;\s-]+([a-zA-Z0-9\s]{20,35})/i);
      if (m?.[1]) {
        const compact = m[1].replace(/\s+/g, "").toLowerCase();
        if (compact.length >= 20 && compact.length <= 30) {
          return compact;
        }
      }
    }

    // 3. Standalone CUID-like token starting with 'c' (or 'e'/'o' if OCR misread 'c') followed by 20-28 alphanumeric chars
    const tokenMatch = rawText.match(/\b([ce][m][a-z0-9]{18,28})\b/i) || rawText.match(/\b(c[a-z0-9]{20,28})\b/i);
    if (tokenMatch?.[1]) {
      const tok = tokenMatch[1].trim().toLowerCase();
      return tok.startsWith("em") ? "c" + tok.slice(1) : tok;
    }
    return "";
  };

  const cropBottomStripDataUrl = (sourceCanvas: HTMLCanvasElement): string => {
    const startY = Math.floor(sourceCanvas.height * 0.72);
    const stripH = sourceCanvas.height - startY;
    const stripW = sourceCanvas.width;
    const scale = 2;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = stripW * scale + 40;
    cropCanvas.height = stripH * scale + 40;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return sourceCanvas.toDataURL("image/png");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(sourceCanvas, 0, startY, stripW, stripH, 20, 20, stripW * scale, stripH * scale);
    return cropCanvas.toDataURL("image/png");
  };

  const handleNoQrFallback = async (fileOrImage: File | string, sourceCanvas?: HTMLCanvasElement) => {
    // 1. Check if a Certificate ID is already typed or loaded on screen
    let candidateId = extractCertificateId(searchId) || certificate?.id || "";

    // 2. If no ID is typed yet, attempt to extract the ID from the bottom credential strip first, then full page via OCR
    if (!candidateId) {
      setOcrStatus("loading");
      setOcrProgress(0);
      setOcrMessage("Scanning document for Credential ID...");

      if (sourceCanvas) {
        try {
          const bottomStripUrl = cropBottomStripDataUrl(sourceCanvas);
          const stripRes = await Tesseract.recognize(bottomStripUrl, "eng");
          candidateId = extractIdFromOcrText(stripRes.data.text || "");
        } catch {}
      }

      if (!candidateId) {
        const ocrResult = await Tesseract.recognize(fileOrImage, "eng", {
          logger: m => {
            if (m.status === "recognizing text") {
              setOcrProgress(Math.floor(m.progress * 100));
            }
          }
        });
        candidateId = extractIdFromOcrText(ocrResult.data.text || "");
      }
    }

    if (!candidateId) {
      setOcrStatus("idle");
      throw new Error("No QR code or readable Credential ID found. Enter the Certificate ID in the search bar first, then upload the file to run AI verification.");
    }

    setSearchId(candidateId);
    const cert = await fetchCertificate(candidateId);
    if (cert) {
      if (cert.id !== candidateId) {
        setSearchId(cert.id);
      }
      setAdvancedMode(true);
      await runAdvancedAnalysis(fileOrImage, cert);
    } else {
      setOcrStatus("idle");
    }
  };

  const tryDecodeQrFromCanvas = (canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Full image scan
    const fullData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const fullCode = jsQR(fullData.data, fullData.width, fullData.height);
    if (fullCode?.data) return fullCode.data;

    // 2. Bottom-right and bottom-left quadrant scans (higher relative resolution for corner QR codes)
    const halfW = Math.floor(canvas.width / 2);
    const halfH = Math.floor(canvas.height / 2);
    const brData = ctx.getImageData(halfW, halfH, canvas.width - halfW, canvas.height - halfH);
    const brCode = jsQR(brData.data, brData.width, brData.height);
    if (brCode?.data) return brCode.data;

    const blData = ctx.getImageData(0, halfH, halfW, canvas.height - halfH);
    const blCode = jsQR(blData.data, blData.width, blData.height);
    if (blCode?.data) return blCode.data;

    return null;
  };

  const processImage = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const qrData = tryDecodeQrFromCanvas(canvas);

          if (qrData) {
            await handleScannedUrl(qrData, file);
            resolve();
          } else {
            try {
              await handleNoQrFallback(file, canvas);
              resolve();
            } catch (fallbackErr) {
              reject(fallbackErr);
            }
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
      const viewport = page.getViewport({ scale: 2.5 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport } as any).promise;

      const dataUrl = canvas.toDataURL("image/png");
      let qrData = tryDecodeQrFromCanvas(canvas);

      // Also check PDF metadata if exported with embedded SHIM-CERT-ID
      if (!qrData) {
        try {
          const meta: any = await pdf.getMetadata();
          const subj = meta?.info?.Subject || "";
          const kw = meta?.info?.Keywords || "";
          if (subj.startsWith("SHIM-CERT-ID:")) {
            qrData = subj.replace("SHIM-CERT-ID:", "").trim();
          } else if (kw && /^c[a-z0-9]{20,30}$/i.test(kw.trim())) {
            qrData = kw.trim();
          }
        } catch {}
      }

      if (qrData) {
        await handleScannedUrl(qrData, dataUrl);
      } else {
        await handleNoQrFallback(dataUrl, canvas);
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to process PDF.");
    }
  };

  const handleScannedUrl = async (url: string, fileOrImage?: File | string) => {
    const idToFetch = extractCertificateId(url);
    if (!idToFetch) return;
    
    setSearchId(idToFetch);
    const cert = await fetchCertificate(idToFetch);
    
    if (cert && fileOrImage) {
      if (cert.id !== idToFetch) {
        setSearchId(cert.id);
      }
      setAdvancedMode(true);
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
        fingerprint: displayFingerprint,
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

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCameraStream = async (mode: "environment" | "user") => {
    setCameraError(null);
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Live QR code scanning loop every 200ms
      scanTimerRef.current = window.setInterval(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const qrData = tryDecodeQrFromCanvas(canvas);
        if (qrData) {
          const snapshotUrl = canvas.toDataURL("image/png");
          stopCamera();
          setLoading(true);
          setScanError(null);
          handleScannedUrl(qrData, snapshotUrl).finally(() => setLoading(false));
        }
      }, 200);
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings."
          : "Unable to access camera on this device. You can upload an image or PDF instead."
      );
    }
  };

  const openCameraModal = () => {
    setIsCameraOpen(true);
    setScanError(null);
    setTimeout(() => {
      startCameraStream(facingMode);
    }, 50);
  };

  const switchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCameraStream(nextMode);
  };

  const handleCaptureCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const snapshotUrl = canvas.toDataURL("image/png");
    const qrData = tryDecodeQrFromCanvas(canvas);

    stopCamera();
    setLoading(true);
    setScanError(null);

    try {
      if (qrData) {
        await handleScannedUrl(qrData, snapshotUrl);
      } else {
        await handleNoQrFallback(snapshotUrl, canvas);
      }
    } catch (err: any) {
      setScanError(err.message || "Could not read credential from captured photo.");
      setLoading(false);
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

        {/* Live Camera Scanner & Document Capture Modal */}
        <AnimatePresence>
          {isCameraOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Camera size={18} className="text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">Camera Credential Scanner</h3>
                      <p className="text-[11px] text-zinc-400">Point at a QR code or capture the full certificate for AI verification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="relative bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
                  {cameraError ? (
                    <div className="p-6 text-center max-w-xs">
                      <ShieldAlert size={32} className="text-red-400 mx-auto mb-3" />
                      <p className="text-xs text-red-300 leading-relaxed mb-4">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
                      >
                        Upload Image / PDF Instead
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder Overlay */}
                      <div className="absolute inset-6 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-48 relative">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 border border-white/10 text-[11px] text-zinc-300 flex items-center gap-1.5 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Auto-scanning QR code...</span>
                      </div>
                    </>
                  )}
                </div>

                {!cameraError && (
                  <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={switchCamera}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors shrink-0"
                    >
                      Flip Camera
                    </button>
                    <button
                      type="button"
                      onClick={handleCaptureCameraPhoto}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Scan size={15} />
                      <span>Capture & Verify Document</span>
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  Verify Credential
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                  Enter credential ID, upload a PDF or image, or scan with your camera to verify on the ledger.
                </p>
              </div>

              <div className="w-full max-w-2xl">
                <form onSubmit={handleSearch} className="flex bg-zinc-800/50 rounded-xl overflow-hidden mb-4 h-14 shadow-lg border border-zinc-800/80 transition-all focus-within:border-zinc-700">
                  <div className="flex items-center justify-center px-4">
                    <Search className="text-zinc-500" size={20} />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Certificate ID (e.g. cmtzoowrv...) or paste verification link"
                    className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm font-mono focus:outline-none"
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
                    <>
                      <button
                        type="button"
                        onClick={openCameraModal}
                        className="flex items-center justify-center px-4 sm:px-5 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                        title="Scan with Camera"
                      >
                        <Camera size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </button>
                      <div className="w-px bg-zinc-800 my-3"></div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center px-4 sm:px-5 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                        title="Upload Certificate (Image or PDF)"
                      >
                        <Upload size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      </button>
                    </>
                  )}
                </form>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full mb-8">
                  <p className="text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Certificate ID is found on your certificate, in your email, or in the QR code.</span>
                  </p>
                  <label className="flex items-center gap-3 cursor-pointer group self-end sm:self-auto shrink-0">
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
                      fingerprint={displayFingerprint}
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
                      {certificate.recipientEmail && (
                        <div 
                          className="text-xs text-zinc-400 font-mono mt-1.5 flex items-center gap-1.5" 
                          title={certificate.isPiiMasked ? "Attendee email masked for privacy compliance" : undefined}
                        >
                          {certificate.isPiiMasked && <Lock size={11} className="text-zinc-500 shrink-0" />}
                          <span className="truncate">{certificate.recipientEmail}</span>
                        </div>
                      )}
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
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Ledger Record ID</div>
                      <div className="text-xs font-mono text-zinc-300 tracking-wider break-all select-all">
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

                    <div className="col-span-2 sm:col-span-4 mt-2 pt-4 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-emerald-400" />
                          <span>Cryptographic SHA-256 Digest (Tamper Seal)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(displayFingerprint);
                            setCopiedHash(true);
                            setTimeout(() => setCopiedHash(false), 2000);
                          }}
                          className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          title="Copy full 256-bit cryptographic digest"
                        >
                          {copiedHash ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedHash ? "Copied" : "Copy Hash"}</span>
                        </button>
                      </div>
                      <div className="text-[11px] sm:text-xs font-mono text-emerald-400/90 tracking-wider bg-zinc-900/90 px-3 py-2.5 rounded-lg border border-zinc-800 break-all select-all flex items-start gap-2 shadow-inner">
                        <span className="text-zinc-600 select-none">SHA256:</span>
                        <span className="flex-1">{displayFingerprint}</span>
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
