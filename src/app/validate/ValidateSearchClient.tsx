"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Lock,
  LayoutDashboard,
  Loader2,
  X,
  FileCheck2,
  ShieldCheck,
  QrCode,
  Camera,
  Upload
} from "lucide-react";
import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist";

// Initialize pdfjs worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

function ValidateSearchContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-redirect if ID query parameter is present from home page search
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && idParam.trim()) {
      setLoading(true);
      router.push(`/validate/${idParam.trim()}`);
    }
  }, [searchParams, router]);

  const sampleCertificates = [
    {
      id: "cmtzoowrv0008585767kqhhyk",
      name: "Angelica M. Santos",
      role: "Keynote Speaker",
      event: "AI Global Conference 2026",
      status: "valid",
    },
    {
      id: "cmtzoows3000a58572anps3nn",
      name: "Juan Carlos Dela Cruz",
      role: "Participant",
      event: "Web Dev Bootcamp",
      status: "valid",
    },
    {
      id: "cmtzoowsg000e5857p8clcshm",
      name: "Julian M. Sterling",
      role: "Volunteer",
      event: "Tech Summit 2026",
      status: "revoked",
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (trimmed) {
      setLoading(true);
      router.push(`/validate/${trimmed}`);
    }
  };

  const handleSelectSpecimen = (id: string) => {
    setLoading(true);
    router.push(`/validate/${id}`);
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
        throw new Error("Unsupported file type. Please upload a PDF or image.");
      }
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || "Failed to parse file. Please try again.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const processImage = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        
        const MAX_WIDTH = 1500;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleDetectedQR(code.data);
          resolve();
        } else {
          reject(new Error("No QR code found in the image."));
        }
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = URL.createObjectURL(file);
    });
  };

  const processPdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer) as any);
    const pdf = await loadingTask.promise;
    
    // Process first page
    const page = await pdf.getPage(1);
    
    // Render at a high enough scale to get a sharp QR code
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    } as any).promise;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      handleDetectedQR(code.data);
    } else {
      throw new Error("No QR code found on the first page of the PDF.");
    }
  };

  const handleDetectedQR = (data: string) => {
    let id = data;
    try {
      const url = new URL(data);
      const paths = url.pathname.split("/").filter(Boolean);
      if (paths.length > 0) {
        id = paths[paths.length - 1];
      }
    } catch (e) {
      // Not a URL, proceed as raw ID
    }
    
    const trimmed = id.trim();
    if (trimmed.length > 10) {
      setSearchId(trimmed);
      router.push(`/validate/${trimmed}`);
    } else {
      throw new Error("QR code found, but it does not contain a valid Shim credential ID.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        {/* Validator Hero */}
        <div className="flex-1 flex flex-col justify-center text-white px-6 relative overflow-hidden border-b-4 border-black">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          
          <div className="max-w-3xl mx-auto w-full text-center relative z-10 animate-in fade-in duration-700">
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase text-white">Verify a Credential</h1>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 uppercase tracking-widest font-bold text-xs md:text-sm">
              Enter the 25-character credential ID or scan the QR code on the certificate to verify its cryptographic authenticity.
            </p>

            <form onSubmit={handleSearch} className="flex w-full max-w-3xl mx-auto bg-white border-4 border-white focus-within:border-gray-200 transition-colors">
              <div className="flex-1 flex items-center bg-white pl-4 min-h-[4rem] w-full">
                <Search size={24} className="text-black shrink-0" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="E.G. CMTZOOWRV0008585767KQHHYK"
                  className="w-full bg-transparent border-none text-black font-bold uppercase tracking-widest placeholder:text-gray-400 focus:outline-none focus:ring-0 text-base px-4 h-full m-0"
                  required
                />
                {searchId && (
                  <button
                    type="button"
                    onClick={() => setSearchId("")}
                    className="h-full px-6 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0 border-l-2 border-gray-100"
                    title="Clear input"
                  >
                    <X size={24} />
                  </button>
                )}
                {!searchId && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-full px-6 text-black hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0 border-l-2 border-gray-100"
                    title="Upload QR Code Image or PDF"
                  >
                    <Upload size={24} />
                  </button>
                )}
                {/* Submit / Scan QR Button */}
                <button
                  type="submit"
                  disabled={loading || !searchId.trim()}
                  className="h-full px-6 flex items-center justify-center shrink-0 border-l-2 border-gray-100 transition-all text-black hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Verify ID"
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : <QrCode size={24} />}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleFileUpload} 
              />
            </form>

            <div className="mt-10 flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-3 text-[0.65rem] md:text-xs font-bold uppercase tracking-widest text-gray-400">
                <Lock size={14} />
                Cryptographically Secured by shim
              </div>
              
              {scanError && (
                <div className="flex items-center justify-center gap-3 p-4 bg-red-600 text-white font-bold uppercase tracking-widest border-4 border-red-600 w-full max-w-3xl">
                  <span className="text-sm">{scanError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ValidateSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin mb-6 text-black" />
        <p className="font-bold text-sm text-black uppercase tracking-widest">Connecting to Ledger...</p>
      </div>
    }>
      <ValidateSearchContent />
    </Suspense>
  );
}
