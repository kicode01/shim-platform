"use client";

import React, { useEffect, useState, useMemo } from "react";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { PRESETS } from "@/lib/presets";
import { fitFontSize } from "@/lib/fit-text";

export type CanvasElementType = "dynamicText" | "staticText" | "image" | "qrCode" | "signature" | "badge" | "shape";

const QrCodeElement = ({ url, color, width, height }: { url: string, color: string, width: number | string, height: number | string }) => {
  return (
    <QRCodeSVG 
      value={url} 
      fgColor={color || "#000000"} 
      bgColor="#fcfbf7" 
      width={width} 
      height={height} 
      level="M"
      marginSize={1}
    />
  );
};
const FONT_SUPPORTED_WEIGHTS: Record<string, string[]> = {
  "Playfair Display": [
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Cinzel": [
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Cormorant Garamond": [
    "300",
    "400",
    "500",
    "600",
    "700"
  ],
  "Merriweather": [
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Lora": [
    "400",
    "500",
    "600",
    "700"
  ],
  "PT Serif": [
    "400",
    "700"
  ],
  "Noto Serif": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Libre Baskerville": [
    "400",
    "500",
    "600",
    "700"
  ],
  "EB Garamond": [
    "400",
    "500",
    "600",
    "700",
    "800"
  ],
  "Bodoni Moda": [
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Prata": [
    "400"
  ],
  "Castoro": [
    "400"
  ],
  "DM Serif Display": [
    "400"
  ],
  "Fraunces": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Cardo": [
    "400",
    "700"
  ],
  "Inter": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Roboto": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Open Sans": [
    "300",
    "400",
    "500",
    "600",
    "700",
    "800"
  ],
  "Montserrat": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Lato": [
    "100",
    "300",
    "400",
    "700",
    "900"
  ],
  "Poppins": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Oswald": [
    "200",
    "300",
    "400",
    "500",
    "600",
    "700"
  ],
  "Raleway": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Outfit": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Space Grotesk": [
    "300",
    "400",
    "500",
    "600",
    "700"
  ],
  "Work Sans": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Rubik": [
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Manrope": [
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800"
  ],
  "DM Sans": [
    "100",
    "1000",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Syne": [
    "400",
    "500",
    "600",
    "700",
    "800"
  ],
  "Bebas Neue": [
    "400"
  ],
  "Anton": [
    "400"
  ],
  "Lobster": [
    "400"
  ],
  "Abril Fatface": [
    "400"
  ],
  "Righteous": [
    "400"
  ],
  "Alfa Slab One": [
    "400"
  ],
  "Unica One": [
    "400"
  ],
  "Fjalla One": [
    "400"
  ],
  "Titan One": [
    "400"
  ],
  "Syncopate": [
    "400",
    "700"
  ],
  "Bowlby One": [
    "400"
  ],
  "Oleo Script": [
    "400",
    "700"
  ],
  "Russo One": [
    "400"
  ],
  "Yeseva One": [
    "400"
  ],
  "Rampart One": [
    "400"
  ],
  "Great Vibes": [
    "400"
  ],
  "Dancing Script": [
    "400",
    "500",
    "600",
    "700"
  ],
  "Pacifico": [
    "400"
  ],
  "Caveat": [
    "400",
    "500",
    "600",
    "700"
  ],
  "Satisfy": [
    "400"
  ],
  "Sacramento": [
    "400"
  ],
  "Alex Brush": [
    "400"
  ],
  "Parisienne": [
    "400"
  ],
  "Monsieur La Doulaise": [
    "400"
  ],
  "Herr Von Muellerhoff": [
    "400"
  ],
  "Pinyon Script": [
    "400"
  ],
  "Tangerine": [
    "400",
    "700"
  ],
  "Clicker Script": [
    "400"
  ],
  "Allura": [
    "400"
  ],
  "Rochester": [
    "400"
  ],
  "Fira Code": [
    "300",
    "400",
    "500",
    "600",
    "700"
  ],
  "Space Mono": [
    "400",
    "700"
  ],
  "JetBrains Mono": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800"
  ],
  "Inconsolata": [
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "Source Code Pro": [
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900"
  ],
  "IBM Plex Mono": [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700"
  ],
  "Ubuntu Mono": [
    "400",
    "700"
  ],
  "PT Mono": [
    "400"
  ],
  "Anonymous Pro": [
    "400",
    "700"
  ],
  "Share Tech Mono": [
    "400"
  ],
  "VT323": [
    "400"
  ],
  "Courier Prime": [
    "400",
    "700"
  ],
  "Cutive Mono": [
    "400"
  ],
  "Overpass Mono": [
    "300",
    "400",
    "500",
    "600",
    "700"
  ],
  "Oxygen Mono": [
    "400"
  ]
};

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  /** Box width. Optional: text elements with no fixed width size to content. */
  width?: number;
  height?: number; // For images/qr
  text?: string; // Static text or dynamic field mapping (e.g. 'recipientName')
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  fontWeight?: "normal" | "bold" | string;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number; // Added for advanced typography tracking
  lineSpacing?: number; // Added for line height control
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  src?: string; // For images
  signatoryName?: string;
  signatoryTitle?: string;
  hideLine?: boolean;
  lineThickness?: number;
  linePadding?: number;
  lineColor?: string;
  titleFontSize?: number;
  titleFontFamily?: string;
  titleColor?: string;
  titleLetterSpacing?: number;
  locked?: boolean;
  // Proportional auto-fit: shrink the font so the text stays inside `width`.
  // `maxFontSize` is the ceiling; when omitted, `fontSize` acts as the ceiling.
  autoFit?: boolean;
  maxFontSize?: number;
  /** Max lines the text may occupy when auto-fitting. Default 1 (never wrap). */
  maxLines?: number;
}

export interface CertificateDesignConfig {
  theme?: "pup" | "gold" | "emerald" | "crimson" | "indigo" | "modern";
  orientation?: "portrait" | "landscape";
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
  printMode?: boolean;
}

export default function CertificateView({
  certificateId = "SPECIMEN-RECORD",
  recipientName,
  role = "Bachelor of Science in Computer Science",
  eventId,
  issueDate = new Date(),
  design,
  status = "valid",
  printMode = false,
}: CertificateViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const isPortrait = parsedDesign.orientation === "portrait";
  const baseW = parsedDesign.canvasElements ? (isPortrait ? 2480 : 3508) : (isPortrait ? 538 : 760);
  const baseH = parsedDesign.canvasElements ? (isPortrait ? 3508 : 2480) : (isPortrait ? 760 : 538);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        if (width > 0) {
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
  }, [baseW, baseH]);

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

  const validateUrl = isMounted ? `${window.location.origin}/validate?id=${certificateId}` : `https://example.com/validate?id=${certificateId}`;

  // Keep for backwards compatibility with legacy layout
  const qrColor = useMemo(() => {
    return parsedDesign.canvasElements?.find((el) => el.type === "qrCode")?.color || "#0f172a";
  }, [parsedDesign.canvasElements]);

  useEffect(() => {
    if (certificateId && typeof window !== "undefined") {
      QRCode.toDataURL(validateUrl, {
        width: 160,
        margin: 1,
        color: {
          dark: qrColor,
          light: "#fcfbf7"
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR generation error:", err));
    }
  }, [certificateId, qrColor, validateUrl]);

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
    
  // Dynamic Typography Engine: extract used Google Fonts
  const usedFonts = useMemo(() => {
    const fonts = new Set<string>();
    if (parsedDesign?.canvasElements) {
      parsedDesign.canvasElements.forEach(el => {
        if (el.fontFamily && !el.fontFamily.startsWith('var(') && el.fontFamily !== 'Arial' && el.fontFamily !== 'sans-serif') {
          fonts.add(el.fontFamily);
        }
      });
    }
    return Array.from(fonts);
  }, [parsedDesign?.canvasElements]);

  const googleFontsUrl = usedFonts.length > 0
    ? `https://fonts.googleapis.com/css2?${usedFonts.map(f => {
        const weights = FONT_SUPPORTED_WEIGHTS[f] || ["400"];
        return `family=${f.replace(/ /g, '+')}:wght@${weights.join(';')}`;
      }).join('&')}&display=swap`
    : null;

  // Proportional auto-fit: map each element id -> resolved font size so long
  // text shrinks instead of wrapping and colliding with neighbouring elements.
  // Runs once fonts are ready so measurement uses the real glyph metrics.
  // Proportional auto-fit: map each element id -> resolved font size so long
  // text shrinks instead of wrapping and colliding with neighbouring elements.
  // Calculated synchronously and recalculates whenever web fonts load.
  const [fontsReady, setFontsReady] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      setFontsReady(1);
      return;
    }
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setFontsReady((n) => n + 1);
    };
    document.fonts.ready.then(bump);
    // Web fonts injected by the <link> this component renders can finish AFTER
    // `ready` resolves. Re-fit whenever any font finishes so long text does not
    // wrap in the fallback face and then stay wrapped once the real font loads.
    document.fonts.addEventListener?.("loadingdone", bump);
    return () => {
      cancelled = true;
      document.fonts.removeEventListener?.("loadingdone", bump);
    };
  }, []);

  const fitSizes = useMemo(() => {
    if (!parsedDesign.canvasElements) return {};

    const next: Record<string, number> = {};
    parsedDesign.canvasElements.forEach((el) => {
      if (el.type !== "dynamicText" && el.type !== "staticText") return;

      let content = el.text || "";
      if (el.type === "dynamicText") {
        if (el.text === "recipientName") content = recipientName || "Candidate Full Name";
        else if (el.text === "role") content = role || "Role / Title";
        else if (el.text === "eventName") content = eventId || "Event Description";
        else if (el.text === "issueDate") content = formattedDate;
        else if (el.text === "certificateId") content = certificateId || "SERIAL-NO-PLACEHOLDER";
      }
      if (!content) return;

      // Ceiling: explicit maxFontSize, else the authored fontSize.
      const ceiling = el.maxFontSize ?? el.fontSize ?? 16;

      // Only fit when the author opted in, or the text is clearly at risk of
      // overflowing its box at the authored size.
      const measured = fitFontSize(
        {
          text: content,
          fontFamily: el.fontFamily || "var(--font-sans, sans-serif)",
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          letterSpacing: el.letterSpacing || 0,
          maxLines: el.autoFit ? el.maxLines ?? 1 : Math.max(1, Math.ceil(content.length / 40)),
          lineHeight: 1.2,
        },
        { width: el.width ?? 0 },
        ceiling
      );

      if (measured < ceiling || el.autoFit) {
        next[el.id] = measured;
      }
    });
    return next;
  }, [
    fontsReady,
    parsedDesign.canvasElements,
    recipientName,
    role,
    eventId,
    formattedDate,
    certificateId,
  ]);

  return (
    <>
      {googleFontsUrl && <link href={googleFontsUrl} rel="stylesheet" />}
      <div 
        ref={containerRef}
        style={{
          width: printMode ? `${baseW}px` : "100%",
          height: printMode ? `${baseH}px` : "100%",
          position: "relative",
          overflow: printMode ? "visible" : "hidden",
        }}
      >
        <div 
          id="certificate-print-node"
          style={{
            width: `${baseW}px`,
            height: `${baseH}px`,
            position: printMode ? "relative" : "absolute",
            top: printMode ? "0" : "50%",
            left: printMode ? "0" : "50%",
            transform: printMode ? "none" : `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            backgroundColor: "#ffffff",
            backgroundImage: parsedDesign.backgroundImageUrl ? `url(${parsedDesign.backgroundImageUrl})` : "none",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            boxShadow: printMode ? "none" : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
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
                  <QrCodeElement url={validateUrl} color={el.color || "#0f172a"} width="100%" height="100%" />
                </div>
              );
            }
            if (el.type === "image" || el.type === "badge") {
              return (
                <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height }}>
                  {el.src ? (
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <img crossOrigin="anonymous" src={el.src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1)) drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }} />
                      <div className="animate-badge-shine" style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 60%, transparent 80%)",
                        backgroundSize: "200% 100%",
                        WebkitMaskImage: `url(${el.src})`,
                        WebkitMaskSize: "contain",
                        WebkitMaskPosition: "center",
                        WebkitMaskRepeat: "no-repeat",
                        pointerEvents: "none"
                      }} />
                    </div>
                  ) : el.type === "badge" ? (
                    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="goldOuterBadgeV" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fef08a" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#854d0e" />
                        </linearGradient>
                        <linearGradient id="goldInnerBadgeV" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fef08a" />
                          <stop offset="40%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#a16207" />
                        </linearGradient>
                        
                        {/* Animated Shine Effect */}
                        <linearGradient id="badgeShineV" x1="-100%" y1="-100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          <animate attributeName="x1" values="-100%; 200%" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="x2" values="0%; 300%" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="y1" values="-100%; 200%" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="y2" values="0%; 300%" dur="3s" repeatCount="indefinite" />
                        </linearGradient>
                      </defs>

                      {/* Sharp Rosette Base */}
                      <path d="M 60.0 10.0 L 65.7 16.4 L 72.9 11.7 L 76.8 19.3 L 85.0 16.7 L 86.8 25.1 L 95.4 24.6 L 94.9 33.2 L 103.3 35.0 L 100.7 43.2 L 108.3 47.1 L 103.6 54.3 L 110.0 60.0 L 103.6 65.7 L 108.3 72.9 L 100.7 76.8 L 103.3 85.0 L 94.9 86.8 L 95.4 95.4 L 86.8 94.9 L 85.0 103.3 L 76.8 100.7 L 72.9 108.3 L 65.7 103.6 L 60.0 110.0 L 54.3 103.6 L 47.1 108.3 L 43.2 100.7 L 35.0 103.3 L 33.2 94.9 L 24.6 95.4 L 25.1 86.8 L 16.7 85.0 L 19.3 76.8 L 11.7 72.9 L 16.4 65.7 L 10.0 60.0 L 16.4 54.3 L 11.7 47.1 L 19.3 43.2 L 16.7 35.0 L 25.1 33.2 L 24.6 24.6 L 33.2 25.1 L 35.0 16.7 L 43.2 19.3 L 47.1 11.7 L 54.3 16.4 Z" fill="url(#goldOuterBadgeV)" />
                      
                      {/* Animated Shine overlaying the rosette base */}
                      <path d="M 60.0 10.0 L 65.7 16.4 L 72.9 11.7 L 76.8 19.3 L 85.0 16.7 L 86.8 25.1 L 95.4 24.6 L 94.9 33.2 L 103.3 35.0 L 100.7 43.2 L 108.3 47.1 L 103.6 54.3 L 110.0 60.0 L 103.6 65.7 L 108.3 72.9 L 100.7 76.8 L 103.3 85.0 L 94.9 86.8 L 95.4 95.4 L 86.8 94.9 L 85.0 103.3 L 76.8 100.7 L 72.9 108.3 L 65.7 103.6 L 60.0 110.0 L 54.3 103.6 L 47.1 108.3 L 43.2 100.7 L 35.0 103.3 L 33.2 94.9 L 24.6 95.4 L 25.1 86.8 L 16.7 85.0 L 19.3 76.8 L 11.7 72.9 L 16.4 65.7 L 10.0 60.0 L 16.4 54.3 L 11.7 47.1 L 19.3 43.2 L 16.7 35.0 L 25.1 33.2 L 24.6 24.6 L 33.2 25.1 L 35.0 16.7 L 43.2 19.3 L 47.1 11.7 L 54.3 16.4 Z" fill="url(#badgeShineV)" />
                      
                      {/* Inner Bevel / Ring */}
                      <circle cx="60" cy="60" r="41" fill="url(#goldInnerBadgeV)" />
                      <circle cx="60" cy="60" r="36" fill="none" stroke="#fef3c7" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.8" />
                      <circle cx="60" cy="60" r="32" fill="none" stroke="#fef3c7" strokeWidth="0.75" opacity="0.5" />
                      
                      {/* SHIM Text */}
                      <text x="60" y="58" fontFamily="Inter, system-ui, sans-serif" fontSize="20" fontWeight="900" letterSpacing="-0.5px" fill="rgba(255,255,255,0.9)" textAnchor="middle" style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.15))" }}>shim</text>
                      
                      {/* CERTIFIED Text */}
                      <text x="60" y="68" fontFamily="var(--font-sans, Arial, sans-serif)" fontSize="6.5" fontWeight="900" fill="rgba(254,243,199,0.9)" textAnchor="middle" style={{ letterSpacing: "2px", filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.15))" }}>CERTIFIED</text>
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
                      <img crossOrigin="anonymous" src={el.src} alt="Signature" style={{ maxWidth: "100%", maxHeight: "70%", objectFit: "contain", marginBottom: `${el.linePadding ?? 10}px` }} />
                    ) : (
                      <div style={{ whiteSpace: "nowrap", fontFamily: el.fontFamily || "var(--font-script, cursive)", fontSize: `${(el.fontSize || 120) * 1.5}px`, color: el.color || "#000000", paddingTop: "0.3em", paddingBottom: "0.1em", fontStyle: "italic", lineHeight: "normal" }}>
                        {el.signatoryName ?? (el.text?.split('|')[0] || "Signature")}
                      </div>
                    )}
                    {!el.hideLine && (
                      <div style={{ width: "100%", borderTop: `${el.lineThickness ?? 4}px solid ${el.lineColor || el.color || "#000000"}`, flexShrink: 0, marginBottom: `${el.linePadding ?? 10}px`, marginTop: `${el.linePadding ?? 10}px` }} />
                    )}
                    <div style={{ whiteSpace: "nowrap", fontSize: `${(el.fontSize || 120) * (el.titleFontSize ?? 0.4)}px`, fontFamily: el.titleFontFamily || "var(--font-sans, sans-serif)", color: el.titleColor || el.color || "#000000", fontWeight: "bold", textTransform: "uppercase", letterSpacing: `${el.titleLetterSpacing ?? 4}px` }}>
                      {el.signatoryTitle ?? (el.text?.split('|')[1] || "Title")}
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
                  height: el.height,
                  fontSize: `${fitSizes[el.id] ?? el.fontSize ?? 16}px`,
                  fontFamily: el.fontFamily || "var(--font-sans, sans-serif)",
                  color: el.color || "#000000",
                  textAlign: (el.align as any) || "left",
                  fontWeight: el.fontWeight || "normal",
                  fontStyle: el.fontStyle || "normal",
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                  textTransform: el.textTransform as any || "none",
                  lineHeight: 1.2,
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
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        id="certificate-print-node"
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
          backgroundSize: "100% 100%",
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
              <img crossOrigin="anonymous" src={qrDataUrl} style={{ position: "absolute", left: parsedDesign.elements.qrCode.x, top: parsedDesign.elements.qrCode.y, width: parsedDesign.elements.qrCode.size, height: parsedDesign.elements.qrCode.size }} alt="QR" />
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

