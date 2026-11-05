import { v4 as uuidv4 } from "uuid";
import { CertificateDesignConfig, CanvasElement } from "@/components/CertificateView";

const brutalistBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyNmY2ZiZjcnIC8+PHJlY3QgeD0nMTA1JyB5PScxMDYnIHdpZHRoPSczMjk4JyBoZWlnaHQ9JzIyNjgnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzBmMTcyYScgc3Ryb2tlLXdpZHRoPScxNycgLz48cmVjdCB4PScxMzEnIHk9JzEzMycgd2lkdGg9JzMyNDYnIGhlaWdodD0nMjIxNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMGYxNzJhJyBzdHJva2Utd2lkdGg9JzQnIC8+PC9zdmc+`;

const academicBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyNmZmZkZjUnIC8+PHJlY3QgeD0nMTMxJyB5PScxMzMnIHdpZHRoPSczMjQ1JyBoZWlnaHQ9JzIyMTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzdmMWQxZCcgc3Ryb2tlLXdpZHRoPSczNScgLz48cmVjdCB4PScxODQnIHk9JzE4Nicgd2lkdGg9JzMxNDAnIGhlaWdodD0nMjEwOCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjN2YxZDFkJyBzdHJva2Utd2lkdGg9JzgnIC8+PHJlY3QgeD0nMjEwJyB5PScyMTInIHdpZHRoPSczMDg3JyBoZWlnaHQ9JzIwNTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzdmMWQxZCcgc3Ryb2tlLXdpZHRoPSc0JyAvPjwvc3ZnPg==`;

const minimalistBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxwYXR0ZXJuIGlkPSdncmlkJyB3aWR0aD0nMTc1JyBoZWlnaHQ9JzE3NScgcGF0dGVyblVuaXRzPSd1c2VyU3BhY2VPblVzZSc+PHBhdGggZD0nTSAxNzUgMCBMIDAgMCAwIDE3NScgZmlsbD0nbm9uZScgc3Ryb2tlPScjZmZmZmZmJyBzdHJva2Utd2lkdGg9JzQnLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyMwNjRlM2InIC8+PHJlY3Qgd2lkdGg9JzM1MDgnIGhlaWdodD0nMjQ4MCcgZmlsbD0ndXJsKCNncmlkKScgb3BhY2l0eT0nMC4xJyAvPjxyZWN0IHg9JzE3NScgeT0nMTc3JyB3aWR0aD0nMzE1NycgaGVpZ2h0PScyMTI1JyBmaWxsPScjZmZmZmZmJyAvPjxyZWN0IHg9JzE3NScgeT0nMTc3JyB3aWR0aD0nMzE1NycgaGVpZ2h0PSczNScgZmlsbD0nIzEwYjk4MScgLz48L3N2Zz4=`;

const corporateBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0nY29ycEdyYWQnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyNlZWYyZmYnIC8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjZTBlN2ZmJyAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9J3VybCgjY29ycEdyYWQpJyAvPjxwYXRoIGQ9J00gMCAwIEwgMzUwOCAwIEwgMzUwOCA1MzEgQyAyMTkyIDg4NSAxMzE1IDAgMCA1MzEgWicgZmlsbD0nIzMxMmU4MScgLz48L3N2Zz4=`;

const creativeBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0nY3JlYXRpdmVHcmFkJyB4MT0nMCUnIHkxPScwJScgeDI9JzEwMCUnIHkyPScxMDAlJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjZmZmMWYyJyAvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nI2ZmZTRlNicgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0nMzUwOCcgaGVpZ2h0PScyNDgwJyBmaWxsPSd1cmwoI2NyZWF0aXZlR3JhZCknIC8+PGNpcmNsZSBjeD0nNDM4JyBjeT0nNDQyJyByPSc2NTcnIGZpbGw9JyNmNDNmNWUnIG9wYWNpdHk9JzAuMScgLz48Y2lyY2xlIGN4PSczMDcwJyBjeT0nMTk5Micgcj0nODc3JyBmaWxsPScjZmI5MjNjJyBvcGFjaXR5PScwLjEnIC8+PHRleHQgeD0nMTc1NCcgeT0nNTYwJyBmb250LWZhbWlseT0nc2Fucy1zZXJpZicgZm9udC1zaXplPSc1MjAnIGZvbnQtd2VpZ2h0PSc5MDAnIGZpbGw9JyNmZWNkZDMnIG9wYWNpdHk9JzAuMzUnIHRleHQtYW5jaG9yPSdtaWRkbGUnPlNISU08L3RleHQ+PHJlY3QgeD0nMjYzJyB5PSc2MDAnIHdpZHRoPSczNTAnIGhlaWdodD0nMjYnIGZpbGw9JyNmNDNmNWUnIC8+PC9zdmc+`;

const elegantGoldBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyNmYWY4ZjUnIC8+PHJlY3QgeD0nMTMxJyB5PScxMzMnIHdpZHRoPSczMjQ2JyBoZWlnaHQ9JzIyMTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nI2Q0YWYzNycgc3Ryb2tlLXdpZHRoPSc0JyAvPjxyZWN0IHg9JzE1MCcgeT0nMTUyJyB3aWR0aD0nMzIwOCcgaGVpZ2h0PScyMTc2JyBmaWxsPSdub25lJyBzdHJva2U9JyNkNGFmMzcnIHN0cm9rZS13aWR0aD0nMTInIC8+PGNpcmNsZSBjeD0nMTc1NCcgY3k9JzEyNDAnIHI9JzgwMCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjZDRhZjM3JyBzdHJva2Utd2lkdGg9JzEnIG9wYWNpdHk9JzAuMycgLz48L3N2Zz4=`;

const cyberBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0nY3liZXInIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyMwOTA5MGInIC8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjMTcxNzE3JyAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9J3VybCgjY3liZXIpJyAvPjxwYXRoIGQ9J00gMCA0MDAgTCAxNTAgNDAwIEwgMjUwIDUwMCBMIDM1MDggNTAwJyBmaWxsPSdub25lJyBzdHJva2U9JyMwNmI2ZDQnIHN0cm9rZS13aWR0aD0nNCcgb3BhY2l0eT0nMC41JyAvPjxwYXRoIGQ9J00gMzUwOCAyMDAwIEwgMzMwMCAyMDAwIEwgMzIwMCAxOTAwIEwgMCAxOTAwJyBmaWxsPSdub25lJyBzdHJva2U9JyM4YjVjZjYnIHN0cm9rZS13aWR0aD0nNCcgb3BhY2l0eT0nMC41JyAvPjxyZWN0IHg9JzEzMScgeT0nMTMzJyB3aWR0aD0nMzI0NicgaGVpZ2h0PScyMjE0JyBmaWxsPSdub25lJyBzdHJva2U9JyMzZjNmNDYnIHN0cm9rZS13aWR0aD0nMicgLz48Y2lyY2xlIGN4PScxMDAnIGN5PScxMDAnIHI9JzEwJyBmaWxsPScjMDZiNmQ0JyAvPjxjaXJjbGUgY3g9JzM0MDgnIGN5PScyMzgwJyByPScxMCcgZmlsbD0nIzhiNWNmNicgLz48L3N2Zz4=`;

const ecoBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyNmMGZkZjQnIC8+PGNpcmNsZSBjeD0nMCcgY3k9JzI0ODAnIHI9JzEwMDAnIGZpbGw9JyNkY2ZjZTcnIC8+PGNpcmNsZSBjeD0nMzUwOCcgY3k9JzAnIHI9JzEyMDAnIGZpbGw9JyNkY2ZjZTcnIC8+PHBhdGggZD0nTSAxMzEgMTMzIEwgMzM3NyAxMzMgUSAzNDAwIDEzMyAzNDAwIDE1NiBMIDM0MDAgMjM0NyBRIDM0MDAgMjM3MCAzMzc3IDIzNzAgTCAxMzEgMjM3MCBRIDEwOCAyMzcwIDEwOCAyMzQ3IEwgMTA4IDE1NiBRIDEwOCAxMzMgMTMxIDEzMycgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTU4MDNkJyBzdHJva2Utd2lkdGg9JzYnIC8+PC9zdmc+`;

export interface PresetInfo {
  id: string;
  name: string;
  color: string;
  design: CertificateDesignConfig;
}

export const PRESETS: PresetInfo[] = [
  {
    id: "brutalist",
    name: "Brutalist Professional",
    color: "#0f172a",
    design: {
      backgroundImageUrl: brutalistBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "shim", x: 280, y: 250, width: 900, fontSize: 150, color: "#0f172a", fontWeight: "900", letterSpacing: -7, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "PROFESSIONAL CREDENTIALING", x: 280, y: 430, width: 1400, fontSize: 46, color: "#64748b", fontWeight: "700", letterSpacing: 12, fontFamily: "var(--font-inter, sans-serif)", autoFit: true },
        { id: uuidv4(), type: "staticText", text: "DATE OF ISSUE", x: 2100, y: 340, width: 1130, align: "right", fontSize: 44, color: "#64748b", fontWeight: "700", letterSpacing: 9, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "issueDate", x: 2100, y: 405, width: 1130, align: "right", fontSize: 70, color: "#0f172a", fontWeight: "600", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF ACHIEVEMENT", x: 280, y: 860, width: 2400, fontSize: 61, color: "#64748b", fontWeight: "800", letterSpacing: 18, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "This certifies that", x: 280, y: 1010, width: 2400, fontSize: 80, color: "#0f172a", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 280, y: 1130, width: 2950, fontSize: 250, maxFontSize: 250, autoFit: true, color: "#0f172a", fontWeight: "700", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "staticText", text: "has successfully completed the requirements for", x: 280, y: 1560, width: 2950, fontSize: 80, color: "#0f172a", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 280, y: 1690, width: 2400, fontSize: 115, maxFontSize: 115, autoFit: true, color: "#0f172a", fontWeight: "900", letterSpacing: -2, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "John Smith|EVENT DIRECTOR", x: 280, y: 1990, width: 900, height: 250, color: "#0f172a", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "qrCode", text: "", x: 2830, y: 1830, width: 400, height: 400 },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 2630, y: 2250, width: 800, align: "center", fontSize: 36, color: "#64748b", fontWeight: "600", fontFamily: "var(--font-spacemono, monospace)" }
      ]
    }
  },
  {
    id: "academic",
    name: "Classic Academic",
    color: "#7f1d1d",
    design: {
      backgroundImageUrl: academicBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "SHIM UNIVERSITY", x: 0, y: 300, width: 3508, align: "center", fontSize: 120, color: "#7f1d1d", fontWeight: "700", fontFamily: "var(--font-playfair, serif)", letterSpacing: 16 },
        { id: uuidv4(), type: "staticText", text: "ACADEMIC EXCELLENCE", x: 0, y: 470, width: 3508, align: "center", fontSize: 44, color: "#b45309", fontWeight: "700", letterSpacing: 26, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "This document is proudly presented to", x: 0, y: 860, width: 3508, align: "center", fontSize: 76, color: "#475569", fontStyle: "italic", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 0, y: 985, width: 3300, align: "center", fontSize: 250, maxFontSize: 250, autoFit: true, color: "#1e293b", fontWeight: "700", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "staticText", text: "in recognition of outstanding contributions to the", x: 0, y: 1440, width: 3508, align: "center", fontSize: 68, color: "#475569", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 0, y: 1570, width: 3200, align: "center", fontSize: 110, maxFontSize: 110, autoFit: true, color: "#7f1d1d", fontWeight: "700", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "signature", text: "Alice Johnson|PROGRAM CHAIR", x: 520, y: 1800, width: 800, height: 250, color: "#1e293b", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "badge", text: "", x: 1600, y: 1830, width: 300, height: 300 },
        { id: uuidv4(), type: "shape", text: "", x: 2190, y: 2060, width: 800, height: 4, color: "#1e293b" },
        { id: uuidv4(), type: "dynamicText", text: "issueDate", x: 2190, y: 1915, width: 800, align: "center", fontSize: 88, color: "#1e293b", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "staticText", text: "DATE OF ISSUE", x: 2190, y: 2105, width: 800, align: "center", fontSize: 44, color: "#64748b", fontWeight: "700", letterSpacing: 9, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 0, y: 2260, width: 3508, align: "center", fontSize: 36, color: "#94a3b8", letterSpacing: 4, fontFamily: "var(--font-spacemono, monospace)" }
      ]
    }
  },
  {
    id: "minimalist",
    name: "Tech Minimalist",
    color: "#064e3b",
    design: {
      backgroundImageUrl: minimalistBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "shim // VERIFIED", x: 350, y: 360, width: 1400, fontSize: 88, color: "#047857", fontWeight: "700", letterSpacing: 4, fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "issueDate", x: 2050, y: 384, width: 1100, align: "right", fontSize: 61, color: "#94a3b8", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "role", x: 350, y: 800, width: 2800, fontSize: 53, autoFit: true, color: "#64748b", fontWeight: "800", letterSpacing: 18, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 350, y: 920, width: 2800, fontSize: 220, maxFontSize: 220, autoFit: true, color: "#0f172a", fontWeight: "900", letterSpacing: -6, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "Awarded first place in the", x: 350, y: 1380, width: 2800, fontSize: 76, color: "#475569", fontWeight: "400", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 350, y: 1500, width: 2800, fontSize: 100, maxFontSize: 100, autoFit: true, color: "#047857", fontWeight: "800", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Michael Chen|LEAD ORGANIZER", x: 2280, y: 1860, width: 877, height: 250, color: "#0f172a", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "qrCode", text: "", x: 350, y: 1880, width: 340, height: 340 },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 350, y: 2240, width: 900, align: "left", fontSize: 38, color: "#047857", fontWeight: "600", fontFamily: "var(--font-spacemono, monospace)" }
      ]
    }
  },
  {
    id: "corporate",
    name: "Modern Corporate",
    color: "#312e81",
    design: {
      backgroundImageUrl: corporateBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "SHIM INSTITUTE", x: 175, y: 165, width: 1200, fontSize: 118, color: "#ffffff", fontWeight: "900", letterSpacing: -2, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "ENTERPRISE CREDENTIAL", x: 175, y: 310, width: 1200, fontSize: 52, color: "#a5b4fc", fontWeight: "600", letterSpacing: 4, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 1950, y: 200, width: 1380, align: "right", fontSize: 48, color: "#e0e7ff", fontWeight: "600", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF COMPLETION", x: 175, y: 900, width: 2400, fontSize: 70, color: "#4338ca", fontWeight: "800", letterSpacing: 9, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 175, y: 1070, width: 2900, fontSize: 220, maxFontSize: 220, autoFit: true, color: "#1e1b4b", fontWeight: "900", letterSpacing: -4, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "has completed the professional training program:", x: 175, y: 1450, width: 2900, fontSize: 76, color: "#475569", fontWeight: "400", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 175, y: 1575, width: 2600, fontSize: 115, maxFontSize: 115, autoFit: true, color: "#312e81", fontWeight: "800", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Sarah Jenkins|LEAD INSTRUCTOR", x: 175, y: 1990, width: 900, height: 250, color: "#1e1b4b", align: "left", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "badge", text: "", x: 2960, y: 1880, width: 350, height: 350 }
      ]
    }
  },
  {
    id: "creative",
    name: "Creative Agency",
    color: "#e11d48",
    design: {
      backgroundImageUrl: creativeBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "CREATIVE MASTERCLASS", x: 263, y: 384, width: 1200, fontSize: 61, color: "#e11d48", fontWeight: "900", letterSpacing: 16, fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 2100, y: 384, width: 1100, align: "right", fontSize: 61, color: "#881337", fontWeight: "700", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 263, y: 840, width: 3000, fontSize: 260, maxFontSize: 260, autoFit: true, color: "#881337", fontWeight: "900", letterSpacing: -8, fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "shape", text: "", x: 263, y: 1330, width: 351, height: 32, color: "#f43f5e" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 263, y: 1490, width: 3000, fontSize: 100, maxFontSize: 100, autoFit: true, color: "#e11d48", fontWeight: "700", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Alex Morgan|CREATIVE DIRECTOR", x: 263, y: 1960, width: 900, height: 250, color: "#881337", align: "left", fontFamily: "var(--font-script, cursive)" }
      ]
    }
  },
  {
    id: "elegant-gold",
    name: "Elegant Gold",
    color: "#d4af37",
    design: {
      backgroundImageUrl: elegantGoldBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF EXCELLENCE", x: 0, y: 340, width: 3508, align: "center", fontSize: 96, color: "#d4af37", fontWeight: "700", letterSpacing: 24, fontFamily: "var(--font-cinzel, serif)" },
        { id: uuidv4(), type: "staticText", text: "PROUDLY PRESENTED TO", x: 0, y: 790, width: 3508, align: "center", fontSize: 50, color: "#71717a", fontWeight: "400", letterSpacing: 10, fontFamily: "var(--font-cormorant, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 0, y: 960, width: 3300, align: "center", fontSize: 240, maxFontSize: 240, autoFit: true, color: "#000000", fontWeight: "400", fontFamily: "var(--font-cormorant, serif)" },
        { id: uuidv4(), type: "staticText", text: "FOR EXCEPTIONAL PERFORMANCE IN", x: 0, y: 1390, width: 3508, align: "center", fontSize: 50, color: "#71717a", fontWeight: "400", letterSpacing: 10, fontFamily: "var(--font-cormorant, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 0, y: 1530, width: 3100, align: "center", fontSize: 130, maxFontSize: 130, autoFit: true, color: "#000000", fontWeight: "600", fontFamily: "var(--font-cinzel, serif)" },
        { id: uuidv4(), type: "signature", text: "Eleanor Vance|MANAGING DIRECTOR", x: 1300, y: 1940, width: 900, height: 250, color: "#000000", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 0, y: 2250, width: 3508, align: "center", fontSize: 36, color: "#71717a", letterSpacing: 6, fontFamily: "var(--font-cinzel, serif)" }
      ]
    }
  },
  {
    id: "cyber",
    name: "Futuristic Cyber",
    color: "#06b6d4",
    design: {
      backgroundImageUrl: cyberBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "// SYSTEM_VERIFICATION_PASS", x: 250, y: 250, width: 1600, fontSize: 50, color: "#06b6d4", fontWeight: "700", letterSpacing: 5, fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 1900, y: 250, width: 1350, align: "right", fontSize: 50, color: "#8b5cf6", fontWeight: "700", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF ACHIEVEMENT", x: 250, y: 690, width: 3000, fontSize: 118, color: "#ffffff", fontWeight: "900", letterSpacing: 15, fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "AWARDED TO USER:", x: 250, y: 1030, width: 3000, fontSize: 58, color: "#a1a1aa", fontWeight: "500", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 250, y: 1160, width: 2600, fontSize: 250, maxFontSize: 250, autoFit: true, color: "#06b6d4", fontWeight: "900", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 250, y: 1620, width: 2400, fontSize: 95, maxFontSize: 95, autoFit: true, color: "#8b5cf6", fontWeight: "700", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Admin Sigma|SYSTEM ARCHITECT", x: 250, y: 1990, width: 900, height: 250, color: "#ffffff", align: "left", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "qrCode", text: "", x: 2830, y: 1850, width: 400, height: 400 }
      ]
    }
  },
  {
    id: "eco",
    name: "Eco Natural",
    color: "#15803d",
    design: {
      backgroundImageUrl: ecoBg,
      canvasElements: [
        { id: uuidv4(), type: "staticText", text: "SUSTAINABILITY PLEDGE", x: 0, y: 380, width: 3508, align: "center", fontSize: 78, color: "#166534", fontWeight: "800", letterSpacing: 20, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "presented to", x: 0, y: 770, width: 3508, align: "center", fontSize: 58, color: "#4ade80", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 0, y: 930, width: 3300, align: "center", fontSize: 250, maxFontSize: 250, autoFit: true, color: "#14532d", fontWeight: "900", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "for completing the environmental training program:", x: 0, y: 1420, width: 3508, align: "center", fontSize: 58, color: "#15803d", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 0, y: 1550, width: 3100, align: "center", fontSize: 112, maxFontSize: 112, autoFit: true, color: "#166534", fontWeight: "700", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Maya Lin|GREEN INITIATIVE LEAD", x: 1250, y: 1980, width: 900, height: 250, color: "#14532d", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "badge", text: "", x: 2620, y: 1900, width: 340, height: 340 },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 0, y: 2260, width: 3508, align: "center", fontSize: 36, color: "#15803d", letterSpacing: 4, fontFamily: "var(--font-spacemono, monospace)" }
      ]
    }
  }
];
