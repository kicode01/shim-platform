import { v4 as uuidv4 } from "uuid";
import { CertificateDesignConfig, CanvasElement } from "@/components/CertificateView";

const brutalistBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyNmY2ZiZjcnIC8+PHJlY3QgeD0nMTA1JyB5PScxMDYnIHdpZHRoPSczMjk4JyBoZWlnaHQ9JzIyNjgnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzBmMTcyYScgc3Ryb2tlLXdpZHRoPScxNycgLz48cmVjdCB4PScxMzEnIHk9JzEzMycgd2lkdGg9JzMyNDYnIGhlaWdodD0nMjIxNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMGYxNzJhJyBzdHJva2Utd2lkdGg9JzQnIC8+PC9zdmc+`;

const academicBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyNmZmZkZjUnIC8+PHJlY3QgeD0nMTMxJyB5PScxMzMnIHdpZHRoPSczMjQ1JyBoZWlnaHQ9JzIyMTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzdmMWQxZCcgc3Ryb2tlLXdpZHRoPSczNScgLz48cmVjdCB4PScxODQnIHk9JzE4Nicgd2lkdGg9JzMxNDAnIGhlaWdodD0nMjEwOCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjN2YxZDFkJyBzdHJva2Utd2lkdGg9JzgnIC8+PHJlY3QgeD0nMjEwJyB5PScyMTInIHdpZHRoPSczMDg3JyBoZWlnaHQ9JzIwNTQnIGZpbGw9J25vbmUnIHN0cm9rZT0nIzdmMWQxZCcgc3Ryb2tlLXdpZHRoPSc0JyAvPjwvc3ZnPg==`;

const minimalistBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxwYXR0ZXJuIGlkPSdncmlkJyB3aWR0aD0nMTc1JyBoZWlnaHQ9JzE3NScgcGF0dGVyblVuaXRzPSd1c2VyU3BhY2VPblVzZSc+PHBhdGggZD0nTSAxNzUgMCBMIDAgMCAwIDE3NScgZmlsbD0nbm9uZScgc3Ryb2tlPScjZmZmZmZmJyBzdHJva2Utd2lkdGg9JzQnLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9JyMwNjRlM2InIC8+PHJlY3Qgd2lkdGg9JzM1MDgnIGhlaWdodD0nMjQ4MCcgZmlsbD0ndXJsKCNncmlkKScgb3BhY2l0eT0nMC4xJyAvPjxyZWN0IHg9JzE3NScgeT0nMTc3JyB3aWR0aD0nMzE1NycgaGVpZ2h0PScyMTI1JyBmaWxsPScjZmZmZmZmJyAvPjxyZWN0IHg9JzE3NScgeT0nMTc3JyB3aWR0aD0nMzE1NycgaGVpZ2h0PSczNScgZmlsbD0nIzEwYjk4MScgLz48L3N2Zz4=`;

const corporateBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0nY29ycEdyYWQnIHgxPScwJScgeTE9JzAlJyB4Mj0nMTAwJScgeTI9JzEwMCUnPjxzdG9wIG9mZnNldD0nMCUnIHN0b3AtY29sb3I9JyNlZWYyZmYnIC8+PHN0b3Agb2Zmc2V0PScxMDAlJyBzdG9wLWNvbG9yPScjZTBlN2ZmJyAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSczNTA4JyBoZWlnaHQ9JzI0ODAnIGZpbGw9J3VybCgjY29ycEdyYWQpJyAvPjxwYXRoIGQ9J00gMCAwIEwgMzUwOCAwIEwgMzUwOCA1MzEgQyAyMTkyIDg4NSAxMzE1IDAgMCA1MzEgWicgZmlsbD0nIzMxMmU4MScgLz48L3N2Zz4=`;

const creativeBg = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMzUwOCAyNDgwJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0nY3JlYXRpdmVHcmFkJyB4MT0nMCUnIHkxPScwJScgeDI9JzEwMCUnIHkyPScxMDAlJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjZmZmMWYyJyAvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nI2ZmZTRlNicgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0nMzUwOCcgaGVpZ2h0PScyNDgwJyBmaWxsPSd1cmwoI2NyZWF0aXZlR3JhZCknIC8+PHRleHQgeD0nMTc1NCcgeT0nMTU1MCcgZm9udC1mYW1pbHk9J3NhbnMtc2VyaWYnIGZvbnQtc2l6ZT0nMTA1MicgZm9udC13ZWlnaHQ9JzkwMCcgZmlsbD0nI2ZlY2RkMycgb3BhY2l0eT0nMC40JyB0ZXh0LWFuY2hvcj0nbWlkZGxlJz5TSElNPC90ZXh0PjxjaXJjbGUgY3g9JzQzOCcgY3k9JzQ0Micgcj0nNjU3JyBmaWxsPScjZjQzZjVlJyBvcGFjaXR5PScwLjEnIC8+PGNpcmNsZSBjeD0nMzA3MCcgY3k9JzE5OTInIHI9Jzg3NycgZmlsbD0nI2ZiOTIzYycgb3BhY2l0eT0nMC4xJyAvPjxyZWN0IHg9JzI2MycgeT0nMTU1MCcgd2lkdGg9JzM1MCcgaGVpZ2h0PSczNScgZmlsbD0nI2Y0M2Y1ZScgLz48L3N2Zz4=`;

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
        { id: uuidv4(), type: "staticText", text: "shim", x: 281, y: 225, width: 600, fontSize: 140, color: "#0f172a", fontWeight: "900", letterSpacing: -7, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "PROFESSIONAL CREDENTIALING", x: 281, y: 396, width: 800, fontSize: 48, color: "#64748b", fontWeight: "700", letterSpacing: 13, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "DATE OF ISSUE", x: 2227, y: 311, width: 1000, align: "right", fontSize: 44, color: "#64748b", fontWeight: "700", letterSpacing: 9, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "issueDate", x: 2227, y: 376, width: 1000, align: "right", fontSize: 70, color: "#0f172a", fontWeight: "600", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF ACHIEVEMENT", x: 281, y: 910, width: 2000, fontSize: 61, color: "#64748b", fontWeight: "800", letterSpacing: 18, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "This certifies that", x: 281, y: 1061, width: 2000, fontSize: 88, color: "#0f172a", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 281, y: 1194, width: 3000, fontSize: 281, color: "#0f172a", fontWeight: "700", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "staticText", text: "has successfully completed the requirements for", x: 281, y: 1631, width: 3000, fontSize: 88, color: "#0f172a", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 281, y: 1774, width: 3000, fontSize: 123, color: "#0f172a", fontWeight: "900", letterSpacing: -2, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "John Smith|EVENT DIRECTOR", x: 281, y: 1933, width: 859, height: 260, color: "#0f172a", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "qrCode", text: "", x: 2789, y: 1754, width: 439, height: 439 }
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
        { id: uuidv4(), type: "staticText", text: "SHIM UNIVERSITY", x: 0, y: 284, width: 3508, align: "center", fontSize: 123, color: "#7f1d1d", fontWeight: "700", fontFamily: "var(--font-playfair, serif)", letterSpacing: 18 },
        { id: uuidv4(), type: "staticText", text: "ACADEMIC EXCELLENCE", x: 0, y: 464, width: 3508, align: "center", fontSize: 44, color: "#b45309", fontWeight: "700", letterSpacing: 26, fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "This document is proudly presented to", x: 0, y: 850, width: 3508, align: "center", fontSize: 79, color: "#475569", fontStyle: "italic", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 0, y: 975, width: 3508, align: "center", fontSize: 281, color: "#1e293b", fontWeight: "700", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "staticText", text: "in recognition of outstanding contributions to the", x: 0, y: 1428, width: 3508, align: "center", fontSize: 70, color: "#475569", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 0, y: 1563, width: 3508, align: "center", fontSize: 114, color: "#7f1d1d", fontWeight: "700", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "signature", text: "Alice Johnson|PROGRAM CHAIR", x: 526, y: 1757, width: 789, height: 260, color: "#1e293b", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "badge", text: "", x: 1600, y: 1820, width: 307, height: 307 },
        { id: uuidv4(), type: "shape", text: "", x: 2193, y: 2017, width: 789, height: 4, color: "#1e293b" },
        { id: uuidv4(), type: "dynamicText", text: "issueDate", x: 2193, y: 1872, width: 789, align: "center", fontSize: 88, color: "#1e293b", fontFamily: "var(--font-playfair, serif)" },
        { id: uuidv4(), type: "staticText", text: "DATE OF ISSUE", x: 2193, y: 2065, width: 789, align: "center", fontSize: 44, color: "#64748b", fontWeight: "700", letterSpacing: 9, fontFamily: "var(--font-inter, sans-serif)" }
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
        { id: uuidv4(), type: "staticText", text: "shim // VERIFIED", x: 351, y: 360, width: 1000, fontSize: 88, color: "#047857", fontWeight: "700", letterSpacing: 4, fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "issueDate", x: 2157, y: 384, width: 1000, align: "right", fontSize: 61, color: "#94a3b8", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "role", x: 351, y: 829, width: 2500, fontSize: 53, color: "#64748b", fontWeight: "800", letterSpacing: 18, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 351, y: 963, width: 2500, fontSize: 246, color: "#0f172a", fontWeight: "900", letterSpacing: -7, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "Awarded first place in the", x: 351, y: 1332, width: 2500, fontSize: 79, color: "#475569", fontWeight: "400", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 351, y: 1461, width: 2500, fontSize: 105, color: "#047857", fontWeight: "800", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Michael Chen|LEAD ORGANIZER", x: 2280, y: 1757, width: 877, height: 260, color: "#0f172a", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "qrCode", text: "", x: 351, y: 1841, width: 351, height: 351 }
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
        { id: uuidv4(), type: "staticText", text: "SHIM INSTITUTE", x: 175, y: 152, width: 1000, fontSize: 123, color: "#ffffff", fontWeight: "900", letterSpacing: -2, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "ENTERPRISE CREDENTIAL", x: 175, y: 303, width: 1000, fontSize: 53, color: "#a5b4fc", fontWeight: "600", letterSpacing: 4, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF COMPLETION", x: 175, y: 989, width: 2000, fontSize: 70, color: "#4338ca", fontWeight: "800", letterSpacing: 9, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 175, y: 1182, width: 3000, fontSize: 246, color: "#1e1b4b", fontWeight: "900", letterSpacing: -4, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "has completed the professional training program:", x: 175, y: 1551, width: 3000, fontSize: 79, color: "#475569", fontWeight: "400", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 175, y: 1687, width: 3000, fontSize: 123, color: "#312e81", fontWeight: "800", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Sarah Jenkins|LEAD INSTRUCTOR", x: 175, y: 1933, width: 877, height: 260, color: "#1e1b4b", align: "left", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "badge", text: "", x: 2982, y: 175, width: 351, height: 351 }
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
        { id: uuidv4(), type: "staticText", text: "CREATIVE MASTERCLASS", x: 263, y: 384, width: 1000, fontSize: 61, color: "#e11d48", fontWeight: "900", letterSpacing: 18, fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 2245, y: 384, width: 1000, align: "right", fontSize: 61, color: "#881337", fontWeight: "700", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 263, y: 856, width: 3000, fontSize: 316, color: "#881337", fontWeight: "900", letterSpacing: -9, fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 263, y: 1308, width: 3000, fontSize: 105, color: "#e11d48", fontWeight: "700", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "shape", text: "", x: 263, y: 1535, width: 351, height: 35, color: "#f43f5e" },
        { id: uuidv4(), type: "signature", text: "Alex Morgan|CREATIVE DIRECTOR", x: 263, y: 1933, width: 877, height: 260, color: "#881337", align: "left", fontFamily: "var(--font-script, cursive)" }
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
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF EXCELLENCE", x: 0, y: 350, width: 3508, align: "center", fontSize: 100, color: "#d4af37", fontWeight: "700", letterSpacing: 25, fontFamily: "var(--font-cinzel, serif)" },
        { id: uuidv4(), type: "staticText", text: "PROUDLY PRESENTED TO", x: 0, y: 800, width: 3508, align: "center", fontSize: 50, color: "#71717a", fontWeight: "400", letterSpacing: 10, fontFamily: "var(--font-cormorant, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 0, y: 1000, width: 3508, align: "center", fontSize: 260, color: "#000000", fontWeight: "400", fontFamily: "var(--font-cormorant, serif)" },
        { id: uuidv4(), type: "staticText", text: "FOR EXCEPTIONAL PERFORMANCE IN", x: 0, y: 1400, width: 3508, align: "center", fontSize: 50, color: "#71717a", fontWeight: "400", letterSpacing: 10, fontFamily: "var(--font-cormorant, serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 0, y: 1550, width: 3508, align: "center", fontSize: 140, color: "#000000", fontWeight: "600", fontFamily: "var(--font-cinzel, serif)" },
        { id: uuidv4(), type: "signature", text: "Eleanor Vance|MANAGING DIRECTOR", x: 1300, y: 1900, width: 900, height: 260, color: "#000000", align: "center", fontFamily: "var(--font-script, cursive)" }
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
        { id: uuidv4(), type: "staticText", text: "// SYSTEM_VERIFICATION_PASS", x: 250, y: 250, width: 1500, fontSize: 50, color: "#06b6d4", fontWeight: "700", letterSpacing: 5, fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "certificateId", x: 2000, y: 250, width: 1250, align: "right", fontSize: 50, color: "#8b5cf6", fontWeight: "700", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "staticText", text: "CERTIFICATE OF ACHIEVEMENT", x: 250, y: 700, width: 3000, fontSize: 120, color: "#ffffff", fontWeight: "900", letterSpacing: 15, fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "AWARDED TO USER:", x: 250, y: 1050, width: 3000, fontSize: 60, color: "#a1a1aa", fontWeight: "500", fontFamily: "var(--font-spacemono, monospace)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 250, y: 1200, width: 3000, fontSize: 280, color: "#06b6d4", fontWeight: "900", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 250, y: 1650, width: 3000, fontSize: 100, color: "#8b5cf6", fontWeight: "700", fontFamily: "var(--font-spacegrotesk, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Admin Sigma|SYSTEM ARCHITECT", x: 250, y: 1950, width: 900, height: 260, color: "#ffffff", align: "left", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "qrCode", text: "", x: 2800, y: 1800, width: 400, height: 400 }
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
        { id: uuidv4(), type: "staticText", text: "SUSTAINABILITY PLEDGE", x: 0, y: 400, width: 3508, align: "center", fontSize: 80, color: "#166534", fontWeight: "800", letterSpacing: 20, fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "presented to", x: 0, y: 800, width: 3508, align: "center", fontSize: 60, color: "#4ade80", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "recipientName", x: 0, y: 1000, width: 3508, align: "center", fontSize: 280, color: "#14532d", fontWeight: "900", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "staticText", text: "for completing the environmental training program:", x: 0, y: 1450, width: 3508, align: "center", fontSize: 60, color: "#15803d", fontWeight: "500", fontFamily: "var(--font-inter, sans-serif)" },
        { id: uuidv4(), type: "dynamicText", text: "eventName", x: 0, y: 1600, width: 3508, align: "center", fontSize: 120, color: "#166534", fontWeight: "700", fontFamily: "var(--font-outfit, sans-serif)" },
        { id: uuidv4(), type: "signature", text: "Maya Lin|GREEN INITIATIVE LEAD", x: 1300, y: 1950, width: 900, height: 260, color: "#14532d", align: "center", fontFamily: "var(--font-script, cursive)" },
        { id: uuidv4(), type: "badge", text: "", x: 2600, y: 1900, width: 350, height: 350 }
      ]
    }
  }
];
