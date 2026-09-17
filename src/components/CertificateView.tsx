"use client";

import React, { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";
import { PRESETS } from "@/lib/presets";

export type CanvasElementType = "dynamicText" | "staticText" | "image" | "qrCode" | "signature" | "badge" | "shape";

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height?: number; // For images/qr
  text?: string; // Static text or dynamic field mapping (e.g. 'recipientName')
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold" | string;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number; // Added for advanced typography tracking
  src?: string; // For images
}

export interface CertificateDesignConfig {
  theme?: "pup" | "gold" | "emerald" | "crimson" | "indigo" | "modern";
  titleFont?: "diploma" | "serif" | "sans"; 
  bodyFont?: "sans" | "serif";
  borderStyle?: "pinstripe" | "double" | "solid" | "none";
  backgroundTexture?: "ivory" | "parchment" | "white";
  institutionName?: string;
  institutionSub?: string;
  certificateTitle?: string;
  documentTitle?: string;
  honorText?: string;
  prefixText?: string;
  completionText?: string;
  firstSignatoryName?: string;
  firstSignatoryTitle?: string;
  secondSignatoryName?: string;
  secondSignatoryTitle?: string;
  sealText?: string;
  showQr?: boolean;
  qrPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOutcomes?: boolean;
  backgroundImageUrl?: string; // Base64 or absolute URL
  
  // New Canva-style elements array
  canvasElements?: CanvasElement[];
  
  // Legacy fixed layout elements (keep for backwards compatibility)
  elements?: {
    recipientName?: { x: number; y: number; fontSize: number; color: string; align: string; width: number };
    role?: { x: number; y: number; fontSize: number; color: string; align: string; width: number };
    eventName?: { x: number; y: number; fontSize: number; color: string; align: string; width: number };
    issueDate?: { x: number; y: number; fontSize: number; color: string; align: string; width: number };
    qrCode?: { x: number; y: number; size: number };
  };
}

interface CertificateViewProps {
  certificateId?: string;
  recipientName: string;
  role?: string | null;
  eventId?: string | null;
  issueDate?: string | Date;
  design?: CertificateDesignConfig | string;
  status?: string;
}

export default function CertificateView({
  certificateId = "SPECIMEN-RECORD",
  recipientName,
  role = "Bachelor of Science in Computer Science",
  eventId,
  issueDate = new Date(),
  design,
  status = "valid",
}: CertificateViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const parsedDesign = useMemo(() => {
    let def: CertificateDesignConfig = PRESETS.find(p => p.id === "creative")?.design || {
      theme: "pup",
      titleFont: "diploma",
      bodyFont: "sans",
      borderStyle: "pinstripe",
      backgroundTexture: "ivory",
      institutionName: "shim Professional",
      institutionSub: "Official Credentialing Portal",
      certificateTitle: "Bachelor of Science in Computer Science",
      honorText: "For active participation and outstanding engagement",
      prefixText: "This certifies that",
      completionText: "has successfully completed the requirements for",
      firstSignatoryName: "Alex Morgan",
      firstSignatoryTitle: "Event Director",
      secondSignatoryName: "Sam Rivera",
      secondSignatoryTitle: "Program Lead",
      showQr: true,
      showOutcomes: true,
    };

    if (design) {
      if (typeof design === "string") {
        try {
          def = { ...def, ...JSON.parse(design) };
        } catch (e) {
          console.warn("Could not parse certificate design JSON:", e);
        }
      } else {
        def = { ...def, ...design };
      }
    }
    return def;
  }, [design]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        if (width > 0) {
          const baseW = parsedDesign.canvasElements ? 3508 : 760;
          const baseH = parsedDesign.canvasElements ? 2480 : 538;
          const scaleW = width / baseW;
          const scaleH = height > 0 ? height / baseH : scaleW;
          setScale(Math.min(scaleW, scaleH));
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [parsedDesign.canvasElements]);

  const isEmerald = parsedDesign.theme === "emerald";
  const isGoldOnly = parsedDesign.theme === "gold";

  const primaryInk = isEmerald ? "#064e3b" : isGoldOnly ? "#0f172a" : "#800000";
  const accentInk = isEmerald ? "#047857" : isGoldOnly ? "#b4841e" : "#800000";

  const hasOutcomes = Boolean(parsedDesign.showOutcomes && eventId && eventId.trim().length > 0);

  // Process and sanitize outcomes list into clean, distinct items
  const outcomesList = useMemo(() => {
    if (!eventId || !eventId.trim()) return [];
    const rawLines = eventId
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean);

    if (rawLines.length === 1 && (rawLines[0].includes(";") || rawLines[0].includes(" • "))) {
      return rawLines[0]
        .split(/[;•]+/)
        .map(s => s.trim())
        .filter(Boolean);
    }
    return rawLines;
  }, [eventId]);

  // Dynamic Typography Mapping
  const titleFontFamily = parsedDesign.titleFont === "serif" ? "var(--font-serif)" : parsedDesign.titleFont === "sans" ? "var(--font-sans)" : "var(--font-diploma-title)";
  const bodyFontFamily = parsedDesign.bodyFont === "serif" ? "var(--font-serif)" : "var(--font-sans)";

  // Dynamic Border Logic
  const getBorderClass = () => {
    if (parsedDesign.borderStyle === "none") return "";
    const theme = parsedDesign.theme || "pup";
    return `diploma-border-${theme}`;
  };

  // Dynamic Background
  const getBackgroundStyle = () => {
    if (parsedDesign.backgroundTexture === "white") return { background: "#ffffff" };
    return {}; // Let the CSS handle the rich ivory pattern
  };

  useEffect(() => {
    if (certificateId && typeof window !== "undefined") {
      const validateUrl = `${window.location.origin}/validate/${certificateId}`;
      QRCode.toDataURL(validateUrl, {
        width: 160,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#fcfbf7"
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR generation error:", err));
    }
  }, [certificateId]);

  const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const getSignatureCursive = (fullName?: string, fallback: string = "Signatory") => {
    if (!fullName) return fallback;
    const cleaned = fullName
      .replace(/^(Assoc\.\s*Prof\.|Asst\.\s*Prof\.|Prof\.|Dr\.|Dean|Provost|Hon\.|Engr\.|Atty\.|Mr\.|Ms\.|Mrs\.)\s+/gi, "")
      .replace(/,\s*(P\.E\.|Ph\.D\.|Ed\.D\.|M\.S\.|M\.A\.|M\.Sc\.|M\.D\.|CPA|REB|CESO|FRIEdr|CCIS|DBA|DPA|LL\.B\.|J\.D\.)(\s*,.*)?$/gi, "")
      .replace(/[,\.]/g, "")
      .trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts[0] || fallback;
  };

  // Resolve Degree Title vs Document Designation
  const rawDegree = role && role.trim().length > 0 && role !== "Curriculum Specification" && role !== "Program Specification"
    ? role.trim()
    : (parsedDesign.certificateTitle || "Bachelor of Science in Computer Science");

  const isCustomDocType = parsedDesign.certificateTitle &&
    (parsedDesign.certificateTitle.toLowerCase().includes("diploma") ||
     parsedDesign.certificateTitle.toLowerCase().includes("certificate") ||
     parsedDesign.certificateTitle.toLowerCase().includes("katibayan"));

  const documentBanner = parsedDesign.documentTitle 
    ? parsedDesign.documentTitle
    : "CERTIFICATE OF ACHIEVEMENT";

  const IssuedDegree = rawDegree;

  if (parsedDesign.canvasElements) {
    return (
      <div 
        ref={containerRef}
        style={{
          width: "100%",
          aspectRatio: "3508 / 2480",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{
          width: "3508px",
          height: "2480px",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          backgroundColor: "#ffffff",
          backgroundImage: parsedDesign.backgroundImageUrl ? `url(${parsedDesign.backgroundImageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}>
          {parsedDesign.canvasElements.map(el => {
            let content = el.text;
            if (el.type === "dynamicText") {
              if (el.text === "recipientName") content = recipientName || "Candidate Full Name";
              else if (el.text === "role") content = role || "Role / Title";
              else if (el.text === "eventName") content = eventId || "Event Description";
              else if (el.text === "issueDate") content = formattedDate;
              else if (el.text === "certificateId") content = certificateId || "SERIAL-NO-PLACEHOLDER";
            }

            if (el.type === "qrCode") {
              return (
                <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height }}>
                  {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{ width: "100%", height: "100%" }} />}
                </div>
              );
            }

            if (el.type === "image" || el.type === "badge") {
              return (
                <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height }}>
                  {el.src ? (
                    <img src={el.src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : el.type === "badge" ? (
                    <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 30 70 L 30 115 L 50 100 L 70 115 L 70 70 Z" fill="#b45309" />
                      <circle cx="50" cy="50" r="45" fill="#d97706" />
                      <circle cx="50" cy="50" r="38" fill="#f59e0b" />
                      <circle cx="50" cy="50" r="36" fill="none" stroke="#fef3c7" strokeWidth="2" strokeDasharray="4,4" />
                      <path d="M 40 50 L 47 57 L 60 40" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </div>
              );
            }

            if (el.type === "shape") {
              return (
                <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height, backgroundColor: el.color || "#000000" }} />
              );
            }

            if (el.type === "signature") {
              return (
                <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {el.src ? (
                    <img src={el.src} alt="Signature" style={{ maxWidth: "100%", maxHeight: "70%", objectFit: "contain", marginBottom: "10px" }} />
                  ) : (
                    <div style={{ fontFamily: el.fontFamily || "var(--font-script, cursive)", fontSize: `${(el.fontSize || 120) * 1.5}px`, color: el.color || "#000000", marginBottom: "0px", fontStyle: "italic", lineHeight: 1 }}>
                      {el.text?.split('|')[0] || "Signature"}
                    </div>
                  )}
                  <div style={{ width: "100%", height: "4px", backgroundColor: el.color || "#000000", marginBottom: "10px", marginTop: "10px" }} />
                  <div style={{ fontSize: `${(el.fontSize || 60) * 0.4}px`, fontFamily: "var(--font-sans, sans-serif)", color: el.color || "#000000", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "4px" }}>
                    {el.text?.split('|')[1] || "Title"}
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={el.id} 
                style={{ 
                  position: "absolute", 
                  left: el.x, 
                  top: el.y, 
                  width: el.width,
                  fontSize: `${el.fontSize || 16}px`,
                  fontFamily: el.fontFamily || "var(--font-sans, sans-serif)",
                  color: el.color || "#000000",
                  textAlign: (el.align as any) || "left",
                  fontWeight: el.fontWeight || "normal",
                  fontStyle: el.fontStyle || "normal",
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                  lineHeight: 1,
                  whiteSpace: "pre-wrap",
                  opacity: 1
                }}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: "760 / 538",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "760px",
          height: "538px",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "center center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: parsedDesign.backgroundImageUrl ? `url(${parsedDesign.backgroundImageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {parsedDesign.backgroundImageUrl ? (
          <>
            {parsedDesign.elements?.recipientName && (
              <div style={{ position: "absolute", left: parsedDesign.elements.recipientName.x, top: parsedDesign.elements.recipientName.y, width: parsedDesign.elements.recipientName.width, fontSize: parsedDesign.elements.recipientName.fontSize, color: parsedDesign.elements.recipientName.color, textAlign: parsedDesign.elements.recipientName.align as any, fontFamily: "var(--font-serif)", fontWeight: "bold" }}>
                {recipientName || "Recipient Name"}
              </div>
            )}
            {parsedDesign.elements?.role && (
              <div style={{ position: "absolute", left: parsedDesign.elements.role.x, top: parsedDesign.elements.role.y, width: parsedDesign.elements.role.width, fontSize: parsedDesign.elements.role.fontSize, color: parsedDesign.elements.role.color, textAlign: parsedDesign.elements.role.align as any, fontFamily: "var(--font-sans)", fontWeight: "bold" }}>
                {IssuedDegree}
              </div>
            )}
            {parsedDesign.elements?.eventName && hasOutcomes && (
              <div style={{ position: "absolute", left: parsedDesign.elements.eventName.x, top: parsedDesign.elements.eventName.y, width: parsedDesign.elements.eventName.width, fontSize: parsedDesign.elements.eventName.fontSize, color: parsedDesign.elements.eventName.color, textAlign: parsedDesign.elements.eventName.align as any, fontFamily: "var(--font-sans)" }}>
                {outcomesList.join(", ")}
              </div>
            )}
            {parsedDesign.elements?.issueDate && (
              <div style={{ position: "absolute", left: parsedDesign.elements.issueDate.x, top: parsedDesign.elements.issueDate.y, width: parsedDesign.elements.issueDate.width, fontSize: parsedDesign.elements.issueDate.fontSize, color: parsedDesign.elements.issueDate.color, textAlign: parsedDesign.elements.issueDate.align as any, fontFamily: "var(--font-sans)" }}>
                {formattedDate}
              </div>
            )}
            {parsedDesign.elements?.qrCode && parsedDesign.showQr && qrDataUrl && (
              <img src={qrDataUrl} style={{ position: "absolute", left: parsedDesign.elements.qrCode.x, top: parsedDesign.elements.qrCode.y, width: parsedDesign.elements.qrCode.size, height: parsedDesign.elements.qrCode.size }} alt="QR" />
            )}
          </>
        ) : (
          <div
            className={`diploma-parchment ${getBorderClass()}`}
            id="certificate-render"
            style={{ width: "760px", height: "538px", flexShrink: 0, ...getBackgroundStyle() }}
          >
          {/* Dedicated Fonts Preload */}
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Great+Vibes&family=Pinyon+Script&display=swap" />

          {/* Revoked Stamp if status is revoked */}
          {status === "revoked" && (
            <div className="diploma-revoked-overlay">
              INVALIDATED / REVOKED
            </div>
          )}

          {/* 1. Modern Seminar Header */}
          <header style={{ padding: "3rem 4rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "36px", height: "36px", background: primaryInk, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src="/icon.svg" alt="shim Logo" style={{ width: "24px", height: "24px", objectFit: "contain", filter: "invert(1)" }} />
              </div>
              <div>
                <div style={{ fontFamily: titleFontFamily, fontSize: "1.2rem", fontWeight: 800, color: primaryInk, letterSpacing: "-0.02em" }}>
                  {parsedDesign.institutionName || "shim"}
                </div>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", fontWeight: 600 }}>
                  {parsedDesign.institutionSub || "Professional Credentialing"}
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem", fontWeight: 600 }}>
                Date of Issue
              </div>
              <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.85rem", color: primaryInk, fontWeight: 500 }}>
                {formattedDate}
              </div>
            </div>
          </header>

          {/* 2. Minimalist Body */}
          <div style={{ padding: "1.5rem 4rem", textAlign: "left" }}>
            <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600, marginBottom: "0.5rem" }}>
              {documentBanner || "Certificate of Completion"}
            </div>
            
            <div style={{ fontSize: "0.95rem", color: primaryInk, fontWeight: 400, marginBottom: "1.5rem" }}>
              {parsedDesign.prefixText || "This certifies that"}
            </div>

            <div style={{
              fontFamily: titleFontFamily,
              fontSize: (recipientName || "").length > 30 ? "2.2rem" : "2.8rem",
              fontWeight: 800,
              color: primaryInk,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              wordBreak: "break-word"
            }}>
              {recipientName || "Candidate Full Name"}
            </div>

            <div style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 400, marginBottom: "0.75rem", maxWidth: "80%" }}>
              {parsedDesign.completionText || "has successfully completed the requirements for"}
            </div>

            <h1 style={{ 
              fontFamily: titleFontFamily, 
              fontSize: (IssuedDegree || "").length > 45 ? "1.4rem" : "1.75rem", 
              color: primaryInk,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "0.5rem",
              maxWidth: "85%"
            }}>
              {IssuedDegree}
            </h1>

            {parsedDesign.honorText && (
              <div style={{ fontSize: "0.85rem", color: accentInk, fontWeight: 600, marginBottom: "1rem" }}>
                {parsedDesign.honorText}
              </div>
            )}
            
            {/* Outcomes Grid */}
            {hasOutcomes && outcomesList.length > 0 && (
              <div style={{ marginTop: "1.5rem", background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", maxWidth: "90%" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                  Key Competencies & Outcomes
                </div>
                <div style={{ display: "grid", gridTemplateColumns: outcomesList.length > 1 ? "1fr 1fr" : "1fr", gap: "0.5rem 1rem" }}>
                  {outcomesList.slice(0, 4).map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.35rem", alignItems: "flex-start", fontSize: "0.7rem", color: "#334155", lineHeight: 1.4 }}>
                      <div style={{ width: "4px", height: "4px", background: accentInk, borderRadius: "50%", marginTop: "0.3rem", flexShrink: 0 }} />
                      <div>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Modern Footer & Signatures */}
          <footer style={{ position: "absolute", bottom: "3rem", left: "4rem", right: "4rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "4rem" }}>
              {/* Left Signatory */}
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "1.25rem", color: primaryInk, marginBottom: "0.25rem" }}>
                  {parsedDesign.firstSignatoryName || "M. Muhi"}
                </div>
                <div style={{ width: "120px", height: "1px", background: "#cbd5e1", marginBottom: "0.5rem" }} />
                <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                  {parsedDesign.firstSignatoryTitle || "Lead Organizer"}
                </div>
              </div>
              
              {/* Right Signatory */}
              <div>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "1.25rem", color: primaryInk, marginBottom: "0.25rem" }}>
                  {parsedDesign.secondSignatoryName || "R. Ado"}
                </div>
                <div style={{ width: "120px", height: "1px", background: "#cbd5e1", marginBottom: "0.5rem" }} />
                <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                  {parsedDesign.secondSignatoryTitle || "Program Director"}
                </div>
              </div>
            </div>
          </footer>

          {/* Dedicated Security Verification QR Code with Registrar Security Thread */}
          {parsedDesign.showQr && qrDataUrl && (
            <div 
              className="diploma-qr-badge" 
              title="Official Cryptographic Ledger Verification Matrix • Security Thread Protected"
              style={{
                bottom: parsedDesign.qrPosition?.includes("top") ? "auto" : "19px",
                top: parsedDesign.qrPosition?.includes("top") ? "19px" : "auto",
                right: parsedDesign.qrPosition?.includes("left") ? "auto" : "24px",
                left: parsedDesign.qrPosition?.includes("left") ? "24px" : "auto",
              }}
            >
              {/* Security Thread & Indicator */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px" }}>
                <div style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%", marginRight: "4px" }}></div>
                <span style={{ fontSize: "0.4rem", fontWeight: 700, letterSpacing: "0.1em", color: "#10b981", textTransform: "uppercase" }}>
                  Verified
                </span>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrDataUrl} 
                alt="Validation QR" 
                style={{ width: "42px", height: "42px", display: "block", background: "white", padding: "2px", borderRadius: "4px" }} 
              />
              <div style={{ fontSize: "0.4rem", color: "#64748b", fontFamily: "var(--font-mono, monospace)", marginTop: "4px", letterSpacing: "0.05em", textAlign: "center" }}>
                ID: {certificateId.length > 12 ? `${certificateId.substring(0, 8)}…` : certificateId}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

