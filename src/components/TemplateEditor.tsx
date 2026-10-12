"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Save, ArrowLeft, Stamp, Sliders, Code2, ShieldCheck, CheckCircle2, RotateCcw, Image as ImageIcon, Move, LayoutTemplate, Loader2, Sparkles, Type, FileImage, MousePointer2, Minus, Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Database, QrCode, Undo, Redo, Hand, X, ArrowUp, ArrowDown, ChevronDown, Lock, Unlock, Eye } from "lucide-react";
import { Rnd } from 'react-rnd';
import CertificateView, { CertificateDesignConfig, CanvasElement, CanvasElementType } from "@/components/CertificateView";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { QRCodeSVG } from "qrcode.react";
import { Select } from "@/components/ui/Select";
import { PRESETS } from "@/lib/presets";
import { AnimatePresence, motion } from "framer-motion";

interface TemplateEditorProps {
  initialId?: string;
  initialName?: string;
  initialDescription?: string;
  initialDesignData?: string;
  isEdit?: boolean;
}





const ELEMENT_FRIENDLY_NAMES: Record<string, string> = {
  staticText: "Text",
  dynamicText: "Data Field",
  signature: "Signature",
  badge: "Badge",
  image: "Image",
  shape: "Divider",
  qrCode: "QR Code"
};

const PRESET_COLORS = [
  "#000000", "#1e293b", "#1e3a8a", "#b45309",
  "#dc2626", "#166534", "#78716c", "#ffffff"
];

function ColorSelector({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button 
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-md border shadow-sm transition-transform hover:scale-110 ${value === c ? 'ring-2 ring-zinc-900 ring-offset-1' : 'border-zinc-200'}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" className="w-8 h-8 p-0 border border-zinc-200 rounded overflow-hidden cursor-pointer bg-white shrink-0" value={value} onChange={(e) => onChange(e.target.value)} />
        <span className="text-xs text-zinc-500 font-mono uppercase">{value}</span>
      </div>
    </div>
  );
}

function FontSizeSelector({ value, onChange }: { value: number, onChange: (val: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const presets = [12, 14, 16, 18, 24, 32, 36, 48, 60, 72, 96, 120];
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert internal pixels to standard points (1 pt Γëê 4.166 px at 300 DPI)
  const pxToPt = (px: number) => Math.round(px / 4.166667);
  const ptToPx = (pt: number) => Math.round(pt * 4.166667);

  const displayValue = value ? pxToPt(value) : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="input-field p-0 flex items-center overflow-hidden focus-within:border-zinc-400 focus-within:shadow-[0_0_0_2px_rgba(24,24,27,0.1)]">
        <input 
          type="text"
          inputMode="numeric"
          className="w-full py-2 pl-3 text-sm outline-none bg-transparent text-zinc-900" 
          value={displayValue} 
          onChange={(e) => {
            const pt = Number(e.target.value.replace(/[^0-9]/g, ''));
            if (pt > 0) onChange(ptToPx(pt));
          }} 
        />
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="pr-3 pl-2 py-2 text-zinc-800 outline-none flex items-center justify-center cursor-default"
        >
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto py-1"
          >
            {presets.map(p => (
              <button
                key={p}
                className={`w-full text-left px-3 py-1 text-sm hover:bg-[#0078d4] hover:text-white transition-colors ${displayValue === p ? 'bg-[#0078d4] text-white' : 'text-zinc-900'}`}
                onClick={() => { onChange(ptToPx(p)); setIsOpen(false); }}
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

const GOOGLE_FONTS = [
  { group: "Serif & Luxury", fonts: ["Playfair Display", "Cinzel", "Cormorant Garamond", "Merriweather", "Lora", "PT Serif", "Noto Serif", "Libre Baskerville", "EB Garamond", "Bodoni Moda", "Prata", "Castoro", "DM Serif Display", "Fraunces", "Cardo"] },
  { group: "Sans-Serif & Modern", fonts: ["Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Oswald", "Raleway", "Outfit", "Space Grotesk", "Work Sans", "Rubik", "Manrope", "DM Sans", "Syne"] },
  { group: "Display & Impact", fonts: ["Bebas Neue", "Anton", "Lobster", "Abril Fatface", "Righteous", "Alfa Slab One", "Unica One", "Fjalla One", "Titan One", "Syncopate", "Bowlby One", "Oleo Script", "Russo One", "Yeseva One", "Rampart One"] },
  { group: "Handwriting & Signatures", fonts: ["Great Vibes", "Dancing Script", "Pacifico", "Caveat", "Satisfy", "Sacramento", "Alex Brush", "Parisienne", "Monsieur La Doulaise", "Herr Von Muellerhoff", "Pinyon Script", "Tangerine", "Clicker Script", "Allura", "Rochester"] },
  { group: "Monospace & Tech", fonts: ["Fira Code", "Space Mono", "JetBrains Mono", "Inconsolata", "Source Code Pro", "IBM Plex Mono", "Ubuntu Mono", "PT Mono", "Anonymous Pro", "Share Tech Mono", "VT323", "Courier Prime", "Cutive Mono", "Overpass Mono", "Oxygen Mono"] }
];

interface PresetCategory {
  name: string;
  orientation: "portrait" | "landscape";
  items: { id: string; name: string; url: string; textScheme?: "light" | "dark" }[];
}

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    "name": "Corporate & Professional",
    "orientation": "landscape",
    "items": [
      {
        "id": "corp-01",
        "name": "Swiss International Style",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iOTkyLDAgMTEyMiwwIDExMjIsNzkzIDg3Miw3OTMiIGZpbGw9IiMwQTE5MkYiIG9wYWNpdHk9IjAuOTIiLz48cG9seWdvbiBwb2ludHM9IjkyMiwwIDk3MiwwIDgyMiw3OTMgNzcyLDc5MyIgZmlsbD0iI0NDNzcyMiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxNCIgaGVpZ2h0PSI3OTMiIGZpbGw9IiMwQTE5MkYiLz48cmVjdCB4PSIwIiB5PSI3ODEiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjEyIiBmaWxsPSIjMEExOTJGIi8+PC9zdmc+"
      },
      {
        "id": "corp-02",
        "name": "Asymmetrical Corporate Edge",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMCwwIDY3LDAgNjcsNzkzIDAsNzkzIiBmaWxsPSIjMzMzMzMzIi8+PHBvbHlnb24gcG9pbnRzPSIxMDU1LDAgMTEyMiwwIDExMjIsNzkzIDEwNTUsNzkzIiBmaWxsPSIjMzMzMzMzIi8+PHJlY3QgeD0iODMiIHk9IjM1Ni41IiB3aWR0aD0iNiIgaGVpZ2h0PSI4MCIgZmlsbD0iI0NDNzcyMiIvPjxyZWN0IHg9IjEwMzMiIHk9IjM1Ni41IiB3aWR0aD0iNiIgaGVpZ2h0PSI4MCIgZmlsbD0iI0NDNzcyMiIvPjwvc3ZnPg=="
      },
      {
        "id": "corp-03",
        "name": "Minimalist Perimeter Frame",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTExMTEiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjQ0IiB5PSI0NCIgd2lkdGg9IjEwMzQiIGhlaWdodD0iNzA1IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTExMTEiIHN0cm9rZS13aWR0aD0iMC43NSIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjkwIiBoZWlnaHQ9IjQiIGZpbGw9IiNDQzc3MjIiLz48cmVjdCB4PSIxMDAyIiB5PSI3NTkiIHdpZHRoPSI5MCIgaGVpZ2h0PSI0IiBmaWxsPSIjQ0M3NzIyIi8+PC9zdmc+"
      },
      {
        "id": "corp-04",
        "name": "Corporate Color Blocking",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijk1IiBmaWxsPSIjNjQ3NDhCIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOTUiIGZpbGw9IiMwRjE3MkEiIG9wYWNpdHk9IjAuMjUiLz48cmVjdCB4PSIwIiB5PSI2OTgiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijk1IiBmaWxsPSIjNjQ3NDhCIi8+PHJlY3QgeD0iMCIgeT0iNjk4IiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI5NSIgZmlsbD0iIzBGMTcyQSIgb3BhY2l0eT0iMC4yNSIvPjxyZWN0IHg9IjAiIHk9Ijk1IiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI1IiBmaWxsPSIjMEYxNzJBIi8+PHJlY3QgeD0iMCIgeT0iNjkzIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI1IiBmaWxsPSIjMEYxNzJBIi8+PC9zdmc+"
      },
      {
        "id": "corp-05",
        "name": "Architectural Grid",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkMDUiIHdpZHRoPSI0NCIgaGVpZ2h0PSI0NCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0NCAwIEwgMCAwIDAgNDQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0NCRDVFMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI3OTMiIGZpbGw9InVybCgjZ3JpZDA1KSIvPjxyZWN0IHg9IjQwIiB5PSI4MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNjMzIiByeD0iOCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC43MiIvPjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjEwNzQiIGhlaWdodD0iNzQ1IiBmaWxsPSJub25lIiBzdHJva2U9IiMwRjE3MkEiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI2IiBmaWxsPSIjQ0M3NzIyIi8+PC9zdmc+"
      },
      {
        "id": "corp-06",
        "name": "Subtle Monoline Pinstripe",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiNDQzc3MjIiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjQ4IiB5PSI0OCIgd2lkdGg9IjEwMjYiIGhlaWdodD0iNjk3IiBmaWxsPSJub25lIiBzdHJva2U9IiNDQzc3MjIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHJlY3QgeD0iNjAiIHk9IjYwIiB3aWR0aD0iMTAwMiIgaGVpZ2h0PSI2NzMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0UyRThGMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMCIgeTE9IjQ0IiB4Mj0iMCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjgiIHkxPSI0NCIgeDI9IjgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxNiIgeTE9IjQ0IiB4Mj0iMTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIyNCIgeTE9IjQ0IiB4Mj0iMjQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIzMiIgeTE9IjQ0IiB4Mj0iMzIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI0MCIgeTE9IjQ0IiB4Mj0iNDAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI0OCIgeTE9IjQ0IiB4Mj0iNDgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI1NiIgeTE9IjQ0IiB4Mj0iNTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI2NCIgeTE9IjQ0IiB4Mj0iNjQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI3MiIgeTE9IjQ0IiB4Mj0iNzIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4MCIgeTE9IjQ0IiB4Mj0iODAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4OCIgeTE9IjQ0IiB4Mj0iODgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI5NiIgeTE9IjQ0IiB4Mj0iOTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMDQiIHkxPSI0NCIgeDI9IjEwNCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjExMiIgeTE9IjQ0IiB4Mj0iMTEyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTIwIiB5MT0iNDQiIHgyPSIxMjAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMjgiIHkxPSI0NCIgeDI9IjEyOCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjEzNiIgeTE9IjQ0IiB4Mj0iMTM2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTQ0IiB5MT0iNDQiIHgyPSIxNDQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxNTIiIHkxPSI0NCIgeDI9IjE1MiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjE2MCIgeTE9IjQ0IiB4Mj0iMTYwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTY4IiB5MT0iNDQiIHgyPSIxNjgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxNzYiIHkxPSI0NCIgeDI9IjE3NiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjE4NCIgeTE9IjQ0IiB4Mj0iMTg0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTkyIiB5MT0iNDQiIHgyPSIxOTIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIyMDAiIHkxPSI0NCIgeDI9IjIwMCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjIwOCIgeTE9IjQ0IiB4Mj0iMjA4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMjE2IiB5MT0iNDQiIHgyPSIyMTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIyMjQiIHkxPSI0NCIgeDI9IjIyNCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjIzMiIgeTE9IjQ0IiB4Mj0iMjMyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMjQwIiB5MT0iNDQiIHgyPSIyNDAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIyNDgiIHkxPSI0NCIgeDI9IjI0OCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjI1NiIgeTE9IjQ0IiB4Mj0iMjU2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMjY0IiB5MT0iNDQiIHgyPSIyNjQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIyNzIiIHkxPSI0NCIgeDI9IjI3MiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjI4MCIgeTE9IjQ0IiB4Mj0iMjgwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMjg4IiB5MT0iNDQiIHgyPSIyODgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIyOTYiIHkxPSI0NCIgeDI9IjI5NiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjMwNCIgeTE9IjQ0IiB4Mj0iMzA0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMzEyIiB5MT0iNDQiIHgyPSIzMTIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIzMjAiIHkxPSI0NCIgeDI9IjMyMCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjMyOCIgeTE9IjQ0IiB4Mj0iMzI4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMzM2IiB5MT0iNDQiIHgyPSIzMzYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIzNDQiIHkxPSI0NCIgeDI9IjM0NCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjM1MiIgeTE9IjQ0IiB4Mj0iMzUyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMzYwIiB5MT0iNDQiIHgyPSIzNjAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIzNjgiIHkxPSI0NCIgeDI9IjM2OCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjM3NiIgeTE9IjQ0IiB4Mj0iMzc2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMzg0IiB5MT0iNDQiIHgyPSIzODQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIzOTIiIHkxPSI0NCIgeDI9IjM5MiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjQwMCIgeTE9IjQ0IiB4Mj0iNDAwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNDA4IiB5MT0iNDQiIHgyPSI0MDgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI0MTYiIHkxPSI0NCIgeDI9IjQxNiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjQyNCIgeTE9IjQ0IiB4Mj0iNDI0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNDMyIiB5MT0iNDQiIHgyPSI0MzIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI0NDAiIHkxPSI0NCIgeDI9IjQ0MCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjQ0OCIgeTE9IjQ0IiB4Mj0iNDQ4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNDU2IiB5MT0iNDQiIHgyPSI0NTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI0NjQiIHkxPSI0NCIgeDI9IjQ2NCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjQ3MiIgeTE9IjQ0IiB4Mj0iNDcyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNDgwIiB5MT0iNDQiIHgyPSI0ODAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI0ODgiIHkxPSI0NCIgeDI9IjQ4OCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjQ5NiIgeTE9IjQ0IiB4Mj0iNDk2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNTA0IiB5MT0iNDQiIHgyPSI1MDQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI1MTIiIHkxPSI0NCIgeDI9IjUxMiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjUyMCIgeTE9IjQ0IiB4Mj0iNTIwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNTI4IiB5MT0iNDQiIHgyPSI1MjgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI1MzYiIHkxPSI0NCIgeDI9IjUzNiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjU0NCIgeTE9IjQ0IiB4Mj0iNTQ0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNTUyIiB5MT0iNDQiIHgyPSI1NTIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI1NjAiIHkxPSI0NCIgeDI9IjU2MCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjU2OCIgeTE9IjQ0IiB4Mj0iNTY4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNTc2IiB5MT0iNDQiIHgyPSI1NzYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI1ODQiIHkxPSI0NCIgeDI9IjU4NCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjU5MiIgeTE9IjQ0IiB4Mj0iNTkyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNjAwIiB5MT0iNDQiIHgyPSI2MDAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI2MDgiIHkxPSI0NCIgeDI9IjYwOCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjYxNiIgeTE9IjQ0IiB4Mj0iNjE2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNjI0IiB5MT0iNDQiIHgyPSI2MjQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI2MzIiIHkxPSI0NCIgeDI9IjYzMiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjY0MCIgeTE9IjQ0IiB4Mj0iNjQwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNjQ4IiB5MT0iNDQiIHgyPSI2NDgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI2NTYiIHkxPSI0NCIgeDI9IjY1NiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjY2NCIgeTE9IjQ0IiB4Mj0iNjY0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNjcyIiB5MT0iNDQiIHgyPSI2NzIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI2ODAiIHkxPSI0NCIgeDI9IjY4MCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjY4OCIgeTE9IjQ0IiB4Mj0iNjg4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNjk2IiB5MT0iNDQiIHgyPSI2OTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI3MDQiIHkxPSI0NCIgeDI9IjcwNCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjcxMiIgeTE9IjQ0IiB4Mj0iNzEyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNzIwIiB5MT0iNDQiIHgyPSI3MjAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI3MjgiIHkxPSI0NCIgeDI9IjcyOCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjczNiIgeTE9IjQ0IiB4Mj0iNzM2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNzQ0IiB5MT0iNDQiIHgyPSI3NDQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI3NTIiIHkxPSI0NCIgeDI9Ijc1MiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9Ijc2MCIgeTE9IjQ0IiB4Mj0iNzYwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNzY4IiB5MT0iNDQiIHgyPSI3NjgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI3NzYiIHkxPSI0NCIgeDI9Ijc3NiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9Ijc4NCIgeTE9IjQ0IiB4Mj0iNzg0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNzkyIiB5MT0iNDQiIHgyPSI3OTIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4MDAiIHkxPSI0NCIgeDI9IjgwMCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjgwOCIgeTE9IjQ0IiB4Mj0iODA4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iODE2IiB5MT0iNDQiIHgyPSI4MTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4MjQiIHkxPSI0NCIgeDI9IjgyNCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjgzMiIgeTE9IjQ0IiB4Mj0iODMyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iODQwIiB5MT0iNDQiIHgyPSI4NDAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4NDgiIHkxPSI0NCIgeDI9Ijg0OCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9Ijg1NiIgeTE9IjQ0IiB4Mj0iODU2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iODY0IiB5MT0iNDQiIHgyPSI4NjQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4NzIiIHkxPSI0NCIgeDI9Ijg3MiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9Ijg4MCIgeTE9IjQ0IiB4Mj0iODgwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iODg4IiB5MT0iNDQiIHgyPSI4ODgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI4OTYiIHkxPSI0NCIgeDI9Ijg5NiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjkwNCIgeTE9IjQ0IiB4Mj0iOTA0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iOTEyIiB5MT0iNDQiIHgyPSI5MTIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI5MjAiIHkxPSI0NCIgeDI9IjkyMCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjkyOCIgeTE9IjQ0IiB4Mj0iOTI4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iOTM2IiB5MT0iNDQiIHgyPSI5MzYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI5NDQiIHkxPSI0NCIgeDI9Ijk0NCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9Ijk1MiIgeTE9IjQ0IiB4Mj0iOTUyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iOTYwIiB5MT0iNDQiIHgyPSI5NjAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI5NjgiIHkxPSI0NCIgeDI9Ijk2OCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9Ijk3NiIgeTE9IjQ0IiB4Mj0iOTc2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iOTg0IiB5MT0iNDQiIHgyPSI5ODQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSI5OTIiIHkxPSI0NCIgeDI9Ijk5MiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjEwMDAiIHkxPSI0NCIgeDI9IjEwMDAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMDA4IiB5MT0iNDQiIHgyPSIxMDA4IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTAxNiIgeTE9IjQ0IiB4Mj0iMTAxNiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjEwMjQiIHkxPSI0NCIgeDI9IjEwMjQiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMDMyIiB5MT0iNDQiIHgyPSIxMDMyIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTA0MCIgeTE9IjQ0IiB4Mj0iMTA0MCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjEwNDgiIHkxPSI0NCIgeDI9IjEwNDgiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMDU2IiB5MT0iNDQiIHgyPSIxMDU2IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTA2NCIgeTE9IjQ0IiB4Mj0iMTA2NCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjEwNzIiIHkxPSI0NCIgeDI9IjEwNzIiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMDgwIiB5MT0iNDQiIHgyPSIxMDgwIiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTA4OCIgeTE9IjQ0IiB4Mj0iMTA4OCIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjEwOTYiIHkxPSI0NCIgeDI9IjEwOTYiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjxsaW5lIHgxPSIxMTA0IiB5MT0iNDQiIHgyPSIxMTA0IiB5Mj0iNTIiIHN0cm9rZT0iI0YxRjVGOSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iMTExMiIgeTE9IjQ0IiB4Mj0iMTExMiIgeTI9IjUyIiBzdHJva2U9IiNGMUY1RjkiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjExMjAiIHkxPSI0NCIgeDI9IjExMjAiIHkyPSI1MiIgc3Ryb2tlPSIjRjFGNUY5IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg=="
      },
      {
        "id": "corp-07",
        "name": "Tech-Corporate Crossover",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iNzAyLDAgMTEyMiwwIDExMjIsOTUiIGZpbGw9IiMwMDAwODAiIG9wYWNpdHk9IjAuOSIvPjxwb2x5Z29uIHBvaW50cz0iODIyLDAgOTQyLDAgMTEyMiw3NSAxMTIyLDk1IiBmaWxsPSIjMDA4MEZGIiBvcGFjaXR5PSIwLjU1Ii8+PHBvbHlnb24gcG9pbnRzPSIwLDY5OCAzMzAsNjk4IDE4MCw3OTMgMCw3OTMiIGZpbGw9IiMwMDAwODAiIG9wYWNpdHk9IjAuOSIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjYiIGZpbGw9IiMwMDAwODAiLz48cmVjdCB4PSIwIiB5PSI3ODciIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjYiIGZpbGw9IiMwMDAwODAiLz48L3N2Zz4="
      },
      {
        "id": "corp-08",
        "name": "Bauhaus Inspired Business",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjY5OCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOTUiIGZpbGw9IiMzNjQ1NEYiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSI3NDUuNSIgcj0iMzQiIGZpbGw9IiNGMkMxNEUiLz48cmVjdCB4PSIyMTAiIHk9IjcyNS41IiB3aWR0aD0iMTMwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjQ0M3NzIyIi8+PGNpcmNsZSBjeD0iOTcyIiBjeT0iNzQ1LjUiIHI9IjI2IiBmaWxsPSIjQ0M3NzIyIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjExMjIiIGhlaWdodD0iMTAiIGZpbGw9IiMzNjQ1NEYiLz48cmVjdCB4PSI2MCIgeT0iMjYiIHdpZHRoPSIxNjAiIGhlaWdodD0iMTIiIGZpbGw9IiMzNjQ1NEYiLz48Y2lyY2xlIGN4PSIxMDQyIiBjeT0iMzIiIHI9IjE0IiBmaWxsPSIjQ0M3NzIyIi8+PC9zdmc+"
      },
      {
        "id": "corp-09",
        "name": "Diagonal Split Bleed",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjY5OCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOTUiIGZpbGw9IiM0QjAwODIiLz48cmVjdCB4PSIwIiB5PSI2OTMiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjUiIGZpbGw9IiNENEFGMzciLz48cG9seWdvbiBwb2ludHM9IjAsMCAyMjAsMCA5MCw5NSAwLDk1IiBmaWxsPSIjNEIwMDgyIiBvcGFjaXR5PSIwLjkiLz48L3N2Zz4="
      },
      {
        "id": "corp-10",
        "name": "The Executive Ribbon",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI2NyIgaGVpZ2h0PSI3OTMiIGZpbGw9IiMwMDAwODAiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNiIgaGVpZ2h0PSI3OTMiIGZpbGw9IiNDQzc3MjIiLz48cmVjdCB4PSIxMDU1IiB5PSIwIiB3aWR0aD0iNjciIGhlaWdodD0iNzkzIiBmaWxsPSIjMDAwMDgwIi8+PHJlY3QgeD0iMTExNiIgeT0iMCIgd2lkdGg9IjYiIGhlaWdodD0iNzkzIiBmaWxsPSIjQ0M3NzIyIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOCIgZmlsbD0iIzAwMDA4MCIvPjxyZWN0IHg9IjAiIHk9Ijc4NSIgd2lkdGg9IjExMjIiIGhlaWdodD0iOCIgZmlsbD0iIzAwMDA4MCIvPjwvc3ZnPg=="
      }
    ]
  },
  {
    "name": "Academic & Education",
    "orientation": "landscape",
    "items": [
      {
        "id": "acad-01",
        "name": "Victorian Filigree",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZGRkZGMCIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiMyQjJCMkIiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjUyIiB5PSI1MiIgd2lkdGg9IjEwMTgiIGhlaWdodD0iNjg5IiBmaWxsPSJub25lIiBzdHJva2U9IiMyQjJCMkIiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTSA3OCA4NiBxIDMwIDAgMzggMjIgcSA4IDIyIDM4IDIyIiBmaWxsPSJub25lIiBzdHJva2U9IiNCMDhENTciIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTSAxMDQ0IDg2IHEgLTMwIDAgLTM4IDIyIHEgLTggMjIgLTM4IDIyIiBmaWxsPSJub25lIiBzdHJva2U9IiNCMDhENTciIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTSA3OCA3MDcgcSAzMCAwIDM4IC0yMiBxIDggLTIyIDM4IC0yMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjA4RDU3IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0gMTA0NCA3MDcgcSAtMzAgMCAtMzggLTIyIHEgLTggLTIyIC0zOCAtMjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0IwOEQ1NyIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48Y2lyY2xlIGN4PSI1NjEiIGN5PSI2MiIgcj0iOSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjA4RDU3IiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSI1NjEiIGN5PSI3MzEiIHI9IjkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0IwOEQ1NyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+"
      },
      {
        "id": "acad-02",
        "name": "Olive Branch Motif",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiMzNTVFM0IiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0gOTcgMzk2LjUgcSA0MCAtMzAgODYgLTEwIiBmaWxsPSJub25lIiBzdHJva2U9IiM2QjhFMjMiIHN0cm9rZS13aWR0aD0iMiIvPjxlbGxpcHNlIGN4PSI5NyIgY3k9IjQwNC41IiByeD0iMTEiIHJ5PSI1IiBmaWxsPSIjNkI4RTIzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSgyOCA5NyAzOTYuNSkiLz48ZWxsaXBzZSBjeD0iMTE0LjIiIGN5PSIzNzIuODciIHJ4PSIxMSIgcnk9IjUiIGZpbGw9IiM2QjhFMjMiIG9wYWNpdHk9IjAuODUiIHRyYW5zZm9ybT0icm90YXRlKC0yOCAxMTQuMiAzODAuODcpIi8+PGVsbGlwc2UgY3g9IjEzMS40IiBjeT0iMzc5Ljk3IiByeD0iMTEiIHJ5PSI1IiBmaWxsPSIjNkI4RTIzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSgyOCAxMzEuNCAzNzEuOTcpIi8+PGVsbGlwc2UgY3g9IjE0OC42IiBjeT0iMzY1Ljk3IiByeD0iMTEiIHJ5PSI1IiBmaWxsPSIjNkI4RTIzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSgtMjggMTQ4LjYgMzczLjk3KSIvPjxlbGxpcHNlIGN4PSIxNjUuOCIgY3k9IjM5NC44NyIgcng9IjExIiByeT0iNSIgZmlsbD0iIzZCOEUyMyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoMjggMTY1LjggMzg2Ljg3KSIvPjxlbGxpcHNlIGN4PSIxODMiIGN5PSIzOTguNSIgcng9IjExIiByeT0iNSIgZmlsbD0iIzZCOEUyMyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoLTI4IDE4MyA0MDYuNSkiLz48cGF0aCBkPSJNIDEwMjUgMzk2LjUgcSAtNDAgLTMwIC04NiAtMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzZCOEUyMyIgc3Ryb2tlLXdpZHRoPSIyIi8+PGVsbGlwc2UgY3g9IjEwMjUiIGN5PSI0MDQuNSIgcng9IjExIiByeT0iNSIgZmlsbD0iIzZCOEUyMyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoLTI4IDEwMjUgMzk2LjUpIi8+PGVsbGlwc2UgY3g9IjEwMDcuOCIgY3k9IjM3Mi44NyIgcng9IjExIiByeT0iNSIgZmlsbD0iIzZCOEUyMyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoMjggMTAwNy44IDM4MC44NykiLz48ZWxsaXBzZSBjeD0iOTkwLjYiIGN5PSIzNzkuOTciIHJ4PSIxMSIgcnk9IjUiIGZpbGw9IiM2QjhFMjMiIG9wYWNpdHk9IjAuODUiIHRyYW5zZm9ybT0icm90YXRlKC0yOCA5OTAuNiAzNzEuOTcpIi8+PGVsbGlwc2UgY3g9Ijk3My40IiBjeT0iMzY1Ljk3IiByeD0iMTEiIHJ5PSI1IiBmaWxsPSIjNkI4RTIzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSgyOCA5NzMuNCAzNzMuOTcpIi8+PGVsbGlwc2UgY3g9Ijk1Ni4yIiBjeT0iMzk0Ljg3IiByeD0iMTEiIHJ5PSI1IiBmaWxsPSIjNkI4RTIzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSgtMjggOTU2LjIgMzg2Ljg3KSIvPjxlbGxpcHNlIGN4PSI5MzkiIGN5PSIzOTguNSIgcng9IjExIiByeT0iNSIgZmlsbD0iIzZCOEUyMyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoMjggOTM5IDQwNi41KSIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9IjU4IiByPSIxMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzU1RTNCIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9IjU4IiByPSI0IiBmaWxsPSIjNkI4RTIzIi8+PC9zdmc+"
      },
      {
        "id": "acad-03",
        "name": "Gothic Arch Border",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjQyIiB5PSI0MiIgd2lkdGg9IjEwMzgiIGhlaWdodD0iNzA5IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0gOTQgMzAgcSAyNiAtMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDk0IDc2MyBxIDI2IDIyIDUyIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDA4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAyMDQgMzAgcSAyNiAtMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDIwNCA3NjMgcSAyNiAyMiA1MiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gMzE0IDMwIHEgMjYgLTIyIDUyIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDA4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAzMTQgNzYzIHEgMjYgMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDQyNCAzMCBxIDI2IC0yMiA1MiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gNDI0IDc2MyBxIDI2IDIyIDUyIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDA4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA1MzQgMzAgcSAyNiAtMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDUzNCA3NjMgcSAyNiAyMiA1MiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gNjQ0IDMwIHEgMjYgLTIyIDUyIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDA4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA2NDQgNzYzIHEgMjYgMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDc1NCAzMCBxIDI2IC0yMiA1MiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gNzU0IDc2MyBxIDI2IDIyIDUyIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDA4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA4NjQgMzAgcSAyNiAtMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDg2NCA3NjMgcSAyNiAyMiA1MiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gOTc0IDMwIHEgMjYgLTIyIDUyIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDA4MCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA5NzQgNzYzIHEgMjYgMjIgNTIgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDgwIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
      },
      {
        "id": "acad-04",
        "name": "Simple Double Line",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZGRkREMCIvPjxyZWN0IHg9IjQ4IiB5PSI0OCIgd2lkdGg9IjEwMjYiIGhlaWdodD0iNjk3IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTExMTEiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjU4IiB5PSI1OCIgd2lkdGg9IjEwMDYiIGhlaWdodD0iNjc3IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTExMTEiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjY2IiB5PSI2NiIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI2NjEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExMTExMSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4="
      },
      {
        "id": "acad-05",
        "name": "Burgundy & Gold",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijc5MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjODAwMDIwIiBzdHJva2Utd2lkdGg9IjkwIi8+PHJlY3QgeD0iNzAiIHk9IjcwIiB3aWR0aD0iOTgyIiBoZWlnaHQ9IjY1MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSI4MCIgeT0iODAiIHdpZHRoPSI5NjIiIGhlaWdodD0iNjMzIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41Ii8+PGNpcmNsZSBjeD0iNzAiIGN5PSI3MCIgcj0iMTYiIGZpbGw9IiNENEFGMzciLz48Y2lyY2xlIGN4PSIxMDUyIiBjeT0iNzAiIHI9IjE2IiBmaWxsPSIjRDRBRjM3Ii8+PGNpcmNsZSBjeD0iNzAiIGN5PSI3MjMiIHI9IjE2IiBmaWxsPSIjRDRBRjM3Ii8+PGNpcmNsZSBjeD0iMTA1MiIgY3k9IjcyMyIgcj0iMTYiIGZpbGw9IiNENEFGMzciLz48L3N2Zz4="
      },
      {
        "id": "acad-06",
        "name": "Ribbon Corner",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZGRkZGMCIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTExMTEiIHN0cm9rZS13aWR0aD0iMSIvPjxwb2x5Z29uIHBvaW50cz0iNDAsNDAgMTI0LDQwIDQwLDEyNCIgZmlsbD0iIzgwMDAyMCIvPjxwb2x5Z29uIHBvaW50cz0iNDAsNjAgOTYsNDAgNDAsMTA4IiBmaWxsPSIjRDRBRjM3IiBvcGFjaXR5PSIwLjkiLz48cG9seWdvbiBwb2ludHM9IjEwODIsNDAgOTk4LDQwIDEwODIsMTI0IiBmaWxsPSIjODAwMDIwIi8+PHBvbHlnb24gcG9pbnRzPSIxMDgyLDYwIDEwMjYsNDAgMTA4MiwxMDgiIGZpbGw9IiNENEFGMzciIG9wYWNpdHk9IjAuOSIvPjxwb2x5Z29uIHBvaW50cz0iNDAsNzUzIDEyNCw3NTMgNDAsNjY5IiBmaWxsPSIjODAwMDIwIi8+PHBvbHlnb24gcG9pbnRzPSI0MCw3MzMgOTYsNzUzIDQwLDY4NSIgZmlsbD0iI0Q0QUYzNyIgb3BhY2l0eT0iMC45Ii8+PHBvbHlnb24gcG9pbnRzPSIxMDgyLDc1MyA5OTgsNzUzIDEwODIsNjY5IiBmaWxsPSIjODAwMDIwIi8+PHBvbHlnb24gcG9pbnRzPSIxMDgyLDczMyAxMDI2LDc1MyAxMDgyLDY4NSIgZmlsbD0iI0Q0QUYzNyIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+"
      },
      {
        "id": "acad-07",
        "name": "Greek Key Pattern",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijc5MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEIwQjBCIiBzdHJva2Utd2lkdGg9IjYwIi8+PHJlY3QgeD0iNDQiIHk9IjQ0IiB3aWR0aD0iMTAzNCIgaGVpZ2h0PSI3MDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBCMEIwQiIgc3Ryb2tlLXdpZHRoPSIxIi8+PHBhdGggZD0iTSA0MCA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA5NiA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAxNTIgNzU1IGggMzQgdiAtMTggaCAtMjIgdiA4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gMjA4IDc1NSBoIDM0IHYgLTE4IGggLTIyIHYgOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDI2NCA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAzMjAgNzU1IGggMzQgdiAtMTggaCAtMjIgdiA4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gMzc2IDc1NSBoIDM0IHYgLTE4IGggLTIyIHYgOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDQzMiA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA0ODggNzU1IGggMzQgdiAtMTggaCAtMjIgdiA4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gNTQ0IDc1NSBoIDM0IHYgLTE4IGggLTIyIHYgOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDYwMCA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA2NTYgNzU1IGggMzQgdiAtMTggaCAtMjIgdiA4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gNzEyIDc1NSBoIDM0IHYgLTE4IGggLTIyIHYgOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDc2OCA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA4MjQgNzU1IGggMzQgdiAtMTggaCAtMjIgdiA4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0gODgwIDc1NSBoIDM0IHYgLTE4IGggLTIyIHYgOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDkzNiA3NTUgaCAzNCB2IC0xOCBoIC0yMiB2IDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA5OTIgNzU1IGggMzQgdiAtMTggaCAtMjIgdiA4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg=="
      },
      {
        "id": "acad-08",
        "name": "Heavy Serif Frame",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iOCIvPjxyZWN0IHg9IjQ2IiB5PSI0NiIgd2lkdGg9IjEwMzAiIGhlaWdodD0iNzAxIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjU2IiB5PSI1NiIgd2lkdGg9IjEwMTAiIGhlaWdodD0iNjgxIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwODAiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBvbHlnb24gcG9pbnRzPSIyODAuNSwyMiAyOTEuNSwzNCAyODAuNSw0NiAyNjkuNSwzNCIgZmlsbD0iIzAwMDA4MCIvPjxwb2x5Z29uIHBvaW50cz0iMjgwLjUsNzcxIDI5MS41LDc1OSAyODAuNSw3NDcgMjY5LjUsNzU5IiBmaWxsPSIjMDAwMDgwIi8+PHBvbHlnb24gcG9pbnRzPSI4NDEuNSwyMiA4NTIuNSwzNCA4NDEuNSw0NiA4MzAuNSwzNCIgZmlsbD0iIzAwMDA4MCIvPjxwb2x5Z29uIHBvaW50cz0iODQxLjUsNzcxIDg1Mi41LDc1OSA4NDEuNSw3NDcgODMwLjUsNzU5IiBmaWxsPSIjMDAwMDgwIi8+PC9zdmc+"
      },
      {
        "id": "acad-09",
        "name": "Floral Damask",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZGRkZGMCIvPjxkZWZzPjxwYXR0ZXJuIGlkPSJkYW1hc2siIHdpZHRoPSI5MCIgaGVpZ2h0PSI5MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTQ1IDEyIHExNiAxMiAwIDI0IHEtMTYgMTIgMCAyNCBxMTYgMTIgMCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRThEN0I4IiBzdHJva2Utd2lkdGg9IjEuMiIvPgogICAgIDxjaXJjbGUgY3g9IjQ1IiBjeT0iNDUiIHI9IjMiIGZpbGw9IiNFOEQ3QjgiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijc5MyIgZmlsbD0idXJsKCNkYW1hc2spIi8+PHJlY3QgeD0iNjAiIHk9IjkyIiB3aWR0aD0iMTAwMiIgaGVpZ2h0PSI2MDkiIHJ4PSIxMCIgZmlsbD0iI0ZGRkZGMCIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iNTgiIHk9IjU4IiB3aWR0aD0iMTAwNiIgaGVpZ2h0PSI2NzciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0M5QTIyNyIgc3Ryb2tlLXdpZHRoPSIzIi8+PHJlY3QgeD0iNjgiIHk9IjY4IiB3aWR0aD0iOTg2IiBoZWlnaHQ9IjY1NyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzlBMjI3IiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4="
      },
      {
        "id": "acad-10",
        "name": "Classic Crest",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiM3MDgwOTAiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMjIiIGhlaWdodD0iNjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiM3MDgwOTAiIHN0cm9rZS13aWR0aD0iMC43NSIvPjxwYXRoIGQ9Ik0gNTYxIDcxNSBsIDI0IDEwIHYgMjIgcSAwIDIwIC0yNCAyOCBxIC0yNCAtOCAtMjQgLTI4IHYgLTIyIHoiIGZpbGw9IiM3MDgwOTAiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9Ijc0MyIgcj0iNyIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMjI0LjQsNzQxIDIzMi40LDc0OSAyMjQuNCw3NTcgMjE2LjQsNzQ5IiBmaWxsPSIjNzA4MDkwIi8+PHBvbHlnb24gcG9pbnRzPSI4OTcuNiw3NDEgOTA1LjYsNzQ5IDg5Ny42LDc1NyA4ODkuNiw3NDkiIGZpbGw9IiM3MDgwOTAiLz48L3N2Zz4="
      }
    ]
  },
  {
    "name": "Tech & Hackathons",
    "orientation": "landscape",
    "items": [
      {
        "id": "tech-01",
        "name": "Cybernetic Node Network",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBCMEIwQiIvPjxyZWN0IHg9IjQ0IiB5PSI3OCIgd2lkdGg9IjEwMzQiIGhlaWdodD0iNjM3IiByeD0iMTQiIGZpbGw9IiMwQjBCMEIiIG9wYWNpdHk9IjAuOTQiLz48cmVjdCB4PSIyOCIgeT0iMjgiIHdpZHRoPSIxMDY2IiBoZWlnaHQ9IjczNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEuNSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gNjIgNjQgaCA1NCB2IC0yMCBoIDM2IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNIDEwNjAgNjQgaCAtNTQgdiAtMjAgaCAtMzYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0gNjIgNzI5IGggNTQgdiAtMjAgaCAzNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEuNSIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTSAxMDYwIDcyOSBoIC01NCB2IC0yMCBoIC0zNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEuNSIgb3BhY2l0eT0iMC44Ii8+PGNpcmNsZSBjeD0iNzIiIGN5PSI2NiIgcj0iNSIgZmlsbD0iIzAwRkZGRiIvPjxjaXJjbGUgY3g9IjEwNTAiIGN5PSI2NiIgcj0iNSIgZmlsbD0iIzAwRkZGRiIvPjxjaXJjbGUgY3g9IjcyIiBjeT0iNzI3IiByPSI1IiBmaWxsPSIjMDBGRkZGIi8+PGNpcmNsZSBjeD0iMTA1MCIgY3k9IjcyNyIgcj0iNSIgZmlsbD0iIzAwRkZGRiIvPjwvc3ZnPg=="
      },
      {
        "id": "tech-02",
        "name": "Isometric Tech Grid",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iNDAsNzczIDcwLDc0NyAxMDAsNzczIDcwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMTAwLDc3MyAxMzAsNzQ3IDE2MCw3NzMgMTMwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMTYwLDc3MyAxOTAsNzQ3IDIyMCw3NzMgMTkwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMjIwLDc3MyAyNTAsNzQ3IDI4MCw3NzMgMjUwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMjgwLDc3MyAzMTAsNzQ3IDM0MCw3NzMgMzEwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMzQwLDc3MyAzNzAsNzQ3IDQwMCw3NzMgMzcwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNDAwLDc3MyA0MzAsNzQ3IDQ2MCw3NzMgNDMwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNDYwLDc3MyA0OTAsNzQ3IDUyMCw3NzMgNDkwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNTIwLDc3MyA1NTAsNzQ3IDU4MCw3NzMgNTUwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNTgwLDc3MyA2MTAsNzQ3IDY0MCw3NzMgNjEwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNjQwLDc3MyA2NzAsNzQ3IDcwMCw3NzMgNjcwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNzAwLDc3MyA3MzAsNzQ3IDc2MCw3NzMgNzMwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNzYwLDc3MyA3OTAsNzQ3IDgyMCw3NzMgNzkwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iODIwLDc3MyA4NTAsNzQ3IDg4MCw3NzMgODUwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iODgwLDc3MyA5MTAsNzQ3IDk0MCw3NzMgOTEwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iOTQwLDc3MyA5NzAsNzQ3IDEwMDAsNzczIDk3MCw3OTkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFFODhFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cG9seWdvbiBwb2ludHM9IjEwMDAsNzczIDEwMzAsNzQ3IDEwNjAsNzczIDEwMzAsNzk5IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTg4RTUiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBvbHlnb24gcG9pbnRzPSIxMDYwLDc3MyAxMDkwLDc0NyAxMTIwLDc3MyAxMDkwLDc5OSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMTEyMCw3NzMgMTE1MCw3NDcgMTE4MCw3NzMgMTE1MCw3OTkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFFODhFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cmVjdCB4PSIzNiIgeT0iMzAiIHdpZHRoPSIxMDUwIiBoZWlnaHQ9IjczMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEYxNzJBIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSIzNiIgeT0iMzAiIHdpZHRoPSIxNDAiIGhlaWdodD0iNiIgZmlsbD0iIzFFODhFNSIvPjwvc3ZnPg=="
      },
      {
        "id": "tech-03",
        "name": "Flat Tech-Brutalism",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxNTAiIGhlaWdodD0iMjAiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSI5NzIiIHk9Ijc3MyIgd2lkdGg9IjE1MCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzAwMDAwMCIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjIyMCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iODYyIiB5PSI3NDUiIHdpZHRoPSIyMjAiIGhlaWdodD0iOCIgZmlsbD0iIzAwRkZGRiIvPjxyZWN0IHg9IjcwIiB5PSI3MTkiIHdpZHRoPSI4IiBoZWlnaHQ9IjM0IiBmaWxsPSIjRkYwMEZGIi8+PC9zdmc+"
      },
      {
        "id": "tech-04",
        "name": "Minimalist Digital Wireframe",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiM3REY5RkYiIHN0cm9rZS13aWR0aD0iMC43NSIvPjxyZWN0IHg9IjQ0IiB5PSI0NCIgd2lkdGg9IjEwMzQiIGhlaWdodD0iNzA1IiBmaWxsPSJub25lIiBzdHJva2U9IiNFMkU4RjAiIHN0cm9rZS13aWR0aD0iMC41Ii8+PGxpbmUgeDE9IjIwMS45NiIgeTE9IjMwIiB4Mj0iMjAxLjk2IiB5Mj0iNTQiIHN0cm9rZT0iIzdERjlGRiIgc3Ryb2tlLXdpZHRoPSIxIi8+PGxpbmUgeDE9IjIwMS45NiIgeTE9Ijc2MyIgeDI9IjIwMS45NiIgeTI9IjczOSIgc3Ryb2tlPSIjN0RGOUZGIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iNTYxIiB5MT0iMzAiIHgyPSI1NjEiIHkyPSI1NCIgc3Ryb2tlPSIjN0RGOUZGIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iNTYxIiB5MT0iNzYzIiB4Mj0iNTYxIiB5Mj0iNzM5IiBzdHJva2U9IiM3REY5RkYiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSI5MjAuMDQiIHkxPSIzMCIgeDI9IjkyMC4wNCIgeTI9IjU0IiBzdHJva2U9IiM3REY5RkYiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSI5MjAuMDQiIHkxPSI3NjMiIHgyPSI5MjAuMDQiIHkyPSI3MzkiIHN0cm9rZT0iIzdERjlGRiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+"
      },
      {
        "id": "tech-05",
        "name": "Binary Algorithm Blocks",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFBMUExQSIvPjxyZWN0IHg9IjQwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSIzNS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjQwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI1IiBmaWxsPSIjMDBFNUZGIi8+PHJlY3QgeD0iMTcwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI0OS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjE3MCIgeT0iMjQiIHdpZHRoPSIxMTAiIGhlaWdodD0iNSIgZmlsbD0iIzAwRTVGRiIvPjxyZWN0IHg9IjMwMCIgeT0iMjQiIHdpZHRoPSIxMTAiIGhlaWdodD0iNjMuMDgiIGZpbGw9IiMzNjQ1NEYiLz48cmVjdCB4PSIzMDAiIHk9IjI0IiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI0MzAiIHk9IjI0IiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjM1LjA4IiBmaWxsPSIjMzY0NTRGIi8+PHJlY3QgeD0iNDMwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI1IiBmaWxsPSIjMDBFNUZGIi8+PHJlY3QgeD0iNTYwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI0OS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjU2MCIgeT0iMjQiIHdpZHRoPSIxMTAiIGhlaWdodD0iNSIgZmlsbD0iIzAwRTVGRiIvPjxyZWN0IHg9IjY5MCIgeT0iMjQiIHdpZHRoPSIxMTAiIGhlaWdodD0iNjMuMDgiIGZpbGw9IiMzNjQ1NEYiLz48cmVjdCB4PSI2OTAiIHk9IjI0IiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI4MjAiIHk9IjI0IiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjM1LjA4IiBmaWxsPSIjMzY0NTRGIi8+PHJlY3QgeD0iODIwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI1IiBmaWxsPSIjMDBFNUZGIi8+PHJlY3QgeD0iOTUwIiB5PSIyNCIgd2lkdGg9IjExMCIgaGVpZ2h0PSI0OS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9Ijk1MCIgeT0iMjQiIHdpZHRoPSIxMTAiIGhlaWdodD0iNSIgZmlsbD0iIzAwRTVGRiIvPjxyZWN0IHg9IjQwIiB5PSI3MzMuOTIiIHdpZHRoPSIxMTAiIGhlaWdodD0iMzUuMDgiIGZpbGw9IiMzNjQ1NEYiLz48cmVjdCB4PSI0MCIgeT0iNzMzLjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSIxNzAiIHk9IjcxOS45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSI0OS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjE3MCIgeT0iNzE5LjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSIzMDAiIHk9IjcwNS45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSI2My4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjMwMCIgeT0iNzA1LjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI0MzAiIHk9IjczMy45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSIzNS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjQzMCIgeT0iNzMzLjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI1NjAiIHk9IjcxOS45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSI0OS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjU2MCIgeT0iNzE5LjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI2OTAiIHk9IjcwNS45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSI2My4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjY5MCIgeT0iNzA1LjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI4MjAiIHk9IjczMy45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSIzNS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9IjgyMCIgeT0iNzMzLjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSI5NTAiIHk9IjcxOS45MiIgd2lkdGg9IjExMCIgaGVpZ2h0PSI0OS4wOCIgZmlsbD0iIzM2NDU0RiIvPjxyZWN0IHg9Ijk1MCIgeT0iNzE5LjkyIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMEU1RkYiLz48cmVjdCB4PSIyNiIgeT0iMjYiIHdpZHRoPSIxMDcwIiBoZWlnaHQ9Ijc0MSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBFNUZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNyIvPjxyZWN0IHg9IjQ2IiB5PSI4MiIgd2lkdGg9IjEwMzAiIGhlaWdodD0iNjI5IiByeD0iMTIiIGZpbGw9IiMxQTFBMUEiIG9wYWNpdHk9IjAuOTQiLz48L3N2Zz4="
      },
      {
        "id": "tech-06",
        "name": "Synthwave Vector",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzJBMEE0QSIvPjxwYXRoIGQ9Ik0gNDgzIDgxIGEgNzggNzggMCAwIDEgMTU2IDAgeiIgZmlsbD0iI0ZGNjlCNCIvPjxyZWN0IHg9IjAiIHk9IjgxIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIzIiBmaWxsPSIjRkZEMTY2Ii8+PGxpbmUgeDE9IjI0MSIgeTE9IjcwNCIgeDI9Ii03OTkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48bGluZSB4MT0iMjgxIiB5MT0iNzA0IiB4Mj0iLTYyOSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIvPjxsaW5lIHgxPSIzMjEiIHkxPSI3MDQiIHgyPSItNDU5IiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PGxpbmUgeDE9IjM2MSIgeTE9IjcwNCIgeDI9Ii0yODkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48bGluZSB4MT0iNDAxIiB5MT0iNzA0IiB4Mj0iLTExOSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIvPjxsaW5lIHgxPSI0NDEiIHkxPSI3MDQiIHgyPSI1MSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIvPjxsaW5lIHgxPSI0ODEiIHkxPSI3MDQiIHgyPSIyMjEiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48bGluZSB4MT0iNTIxIiB5MT0iNzA0IiB4Mj0iMzkxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PGxpbmUgeDE9IjU2MSIgeTE9IjcwNCIgeDI9IjU2MSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIvPjxsaW5lIHgxPSI2MDEiIHkxPSI3MDQiIHgyPSI3MzEiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48bGluZSB4MT0iNjQxIiB5MT0iNzA0IiB4Mj0iOTAxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PGxpbmUgeDE9IjY4MSIgeTE9IjcwNCIgeDI9IjEwNzEiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48bGluZSB4MT0iNzIxIiB5MT0iNzA0IiB4Mj0iMTI0MSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIvPjxsaW5lIHgxPSI3NjEiIHkxPSI3MDQiIHgyPSIxNDExIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PGxpbmUgeDE9IjgwMSIgeTE9IjcwNCIgeDI9IjE1ODEiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48bGluZSB4MT0iODQxIiB5MT0iNzA0IiB4Mj0iMTc1MSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNSIvPjxsaW5lIHgxPSI4ODEiIHkxPSI3MDQiIHgyPSIxOTIxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PGxpbmUgeDE9IjAiIHkxPSI3MTgiIHgyPSIxMTIyIiB5Mj0iNzE4IiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC4zNSIvPjxsaW5lIHgxPSIwIiB5MT0iNzM4IiB4Mj0iMTEyMiIgeTI9IjczOCIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuMzUiLz48bGluZSB4MT0iMCIgeTE9Ijc1OCIgeDI9IjExMjIiIHkyPSI3NTgiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIwLjc1IiBvcGFjaXR5PSIwLjM1Ii8+PGxpbmUgeDE9IjAiIHkxPSI3NzgiIHgyPSIxMTIyIiB5Mj0iNzc4IiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC4zNSIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+PHJlY3QgeD0iNTYiIHk9IjkyIiB3aWR0aD0iMTAxMCIgaGVpZ2h0PSI2MDEiIHJ4PSIxMiIgZmlsbD0iIzJBMEE0QSIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+"
      },
      {
        "id": "tech-07",
        "name": "Pixel Art Interface",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMjIiIGhlaWdodD0iNjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjU4IiB5PSI1OCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iNzQiIHk9Ijc0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNGRjAwRkYiLz48cmVjdCB4PSI5MCIgeT0iOTAiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzAwRkZGRiIvPjxyZWN0IHg9IjEwNiIgeT0iMTA2IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNGRjAwRkYiLz48cmVjdCB4PSIxMjIiIHk9IjEyMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iMTA0OCIgeT0iNTgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzAwRkZGRiIvPjxyZWN0IHg9IjEwMzIiIHk9Ijc0IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNGRjAwRkYiLz48cmVjdCB4PSIxMDE2IiB5PSI5MCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iMTAwMCIgeT0iMTA2IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNGRjAwRkYiLz48cmVjdCB4PSI5ODQiIHk9IjEyMiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iNTgiIHk9IjcxOSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iNzQiIHk9IjcwMyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRkYwMEZGIi8+PHJlY3QgeD0iOTAiIHk9IjY4NyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDBGRkZGIi8+PHJlY3QgeD0iMTA2IiB5PSI2NzEiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9IjEyMiIgeT0iNjU1IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiMwMEZGRkYiLz48cmVjdCB4PSIxMDQ4IiB5PSI3MTkiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzAwRkZGRiIvPjxyZWN0IHg9IjEwMzIiIHk9IjcwMyIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRkYwMEZGIi8+PHJlY3QgeD0iMTAxNiIgeT0iNjg3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiMwMEZGRkYiLz48cmVjdCB4PSIxMDAwIiB5PSI2NzEiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iI0ZGMDBGRiIvPjxyZWN0IHg9Ijk4NCIgeT0iNjU1IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiMwMEZGRkYiLz48L3N2Zz4="
      },
      {
        "id": "tech-08",
        "name": "Sine Wave Dynamics",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBEMTExNyIvPjxwYXRoIGQ9Ik0gMCAzMCBRIDcwIDQgMTQwIDMwIFEgMjEwIDQgMjgwIDMwIFEgMzUwIDQgNDIwIDMwIFEgNDkwIDQgNTYwIDMwIFEgNjMwIDQgNzAwIDMwIFEgNzcwIDQgODQwIDMwIFEgOTEwIDQgOTgwIDMwIFEgMTA1MCA0IDExMjAgMzAgUSAxMTkwIDQgMTI2MCAzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjIuNSIgb3BhY2l0eT0iMC45Ii8+PHBhdGggZD0iTSAwIDU4IFEgNzAgNDIgMTQwIDU4IFEgMjEwIDQyIDI4MCA1OCBRIDM1MCA0MiA0MjAgNTggUSA0OTAgNDIgNTYwIDU4IFEgNjMwIDQyIDcwMCA1OCBRIDc3MCA0MiA4NDAgNTggUSA5MTAgNDIgOTgwIDU4IFEgMTA1MCA0MiAxMTIwIDU4IFEgMTE5MCA0MiAxMjYwIDU4IiBmaWxsPSJub25lIiBzdHJva2U9IiM3REY5RkYiIHN0cm9rZS13aWR0aD0iMi41IiBvcGFjaXR5PSIwLjU1Ii8+PHBhdGggZD0iTSAwIDc2MyBRIDcwIDczNyAxNDAgNzYzIFEgMjEwIDczNyAyODAgNzYzIFEgMzUwIDczNyA0MjAgNzYzIFEgNDkwIDczNyA1NjAgNzYzIFEgNjMwIDczNyA3MDAgNzYzIFEgNzcwIDczNyA4NDAgNzYzIFEgOTEwIDczNyA5ODAgNzYzIFEgMTA1MCA3MzcgMTEyMCA3NjMgUSAxMTkwIDczNyAxMjYwIDc2MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjIuNSIgb3BhY2l0eT0iMC45Ii8+PHBhdGggZD0iTSAwIDczNSBRIDcwIDcxOSAxNDAgNzM1IFEgMjEwIDcxOSAyODAgNzM1IFEgMzUwIDcxOSA0MjAgNzM1IFEgNDkwIDcxOSA1NjAgNzM1IFEgNjMwIDcxOSA3MDAgNzM1IFEgNzcwIDcxOSA4NDAgNzM1IFEgOTEwIDcxOSA5ODAgNzM1IFEgMTA1MCA3MTkgMTEyMCA3MzUgUSAxMTkwIDcxOSAxMjYwIDczNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjN0RGOUZGIiBzdHJva2Utd2lkdGg9IjIuNSIgb3BhY2l0eT0iMC41NSIvPjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjEwNzQiIGhlaWdodD0iNzQ1IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iNDQiIHk9Ijg0IiB3aWR0aD0iMTAzNCIgaGVpZ2h0PSI2MjUiIHJ4PSIxMiIgZmlsbD0iIzBEMTExNyIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+"
      },
      {
        "id": "tech-09",
        "name": "Hexagonal Data Architecture",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMTEwNC41MiwxMDcgMTEwNC41MiwxMzMgMTA4MiwxNDYgMTA1OS40OCwxMzMgMTA1OS40OCwxMDcgMTA4Miw5NCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iMTEwNC41MiwxNjkgMTEwNC41MiwxOTUgMTA4MiwyMDggMTA1OS40OCwxOTUgMTA1OS40OCwxNjkgMTA4MiwxNTYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFFODhFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cG9seWdvbiBwb2ludHM9IjExMDQuNTIsMjMxIDExMDQuNTIsMjU3IDEwODIsMjcwIDEwNTkuNDgsMjU3IDEwNTkuNDgsMjMxIDEwODIsMjE4IiBmaWxsPSJub25lIiBzdHJva2U9IiMxRTg4RTUiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBvbHlnb24gcG9pbnRzPSI0Ny4zMiwxNDAgNDcuMzIsMTYwIDMwLDE3MCAxMi42OCwxNjAgMTIuNjgsMTQwIDMwLDEzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUU4OEU1IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwb2x5Z29uIHBvaW50cz0iNDcuMzIsMjAyIDQ3LjMyLDIyMiAzMCwyMzIgMTIuNjgsMjIyIDEyLjY4LDIwMiAzMCwxOTIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFFODhFNSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSIxMDYyIiBoZWlnaHQ9IjczMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEYxNzJBIiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNSIgZmlsbD0iIzFFODhFNSIvPjwvc3ZnPg=="
      },
      {
        "id": "tech-10",
        "name": "Vector Glitch Art",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjEyMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI2IiBmaWxsPSIjMDBGRkZGIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSIwIiB5PSIxOTgiIHdpZHRoPSI1MiIgaGVpZ2h0PSIyNiIgZmlsbD0iI0ZGMDBGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMCIgeT0iMjc2IiB3aWR0aD0iNzQiIGhlaWdodD0iMjYiIGZpbGw9IiMwRjE3MkEiIG9wYWNpdHk9IjAuOSIvPjxyZWN0IHg9IjAiIHk9IjM1NCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI2IiBmaWxsPSIjMDBGRkZGIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSIwIiB5PSI0MzIiIHdpZHRoPSI1MiIgaGVpZ2h0PSIyNiIgZmlsbD0iI0ZGMDBGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMCIgeT0iNTEwIiB3aWR0aD0iNzQiIGhlaWdodD0iMjYiIGZpbGw9IiMwRjE3MkEiIG9wYWNpdHk9IjAuOSIvPjxyZWN0IHg9IjAiIHk9IjU4OCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI2IiBmaWxsPSIjMDBGRkZGIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSIxMDkyIiB5PSIxMjAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyNiIgZmlsbD0iIzAwRkZGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMTA3MCIgeT0iMTk4IiB3aWR0aD0iNTIiIGhlaWdodD0iMjYiIGZpbGw9IiNGRjAwRkYiIG9wYWNpdHk9IjAuOSIvPjxyZWN0IHg9IjEwNDgiIHk9IjI3NiIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjI2IiBmaWxsPSIjMEYxNzJBIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSIxMDkyIiB5PSIzNTQiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyNiIgZmlsbD0iIzAwRkZGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMTA3MCIgeT0iNDMyIiB3aWR0aD0iNTIiIGhlaWdodD0iMjYiIGZpbGw9IiNGRjAwRkYiIG9wYWNpdHk9IjAuOSIvPjxyZWN0IHg9IjEwNDgiIHk9IjUxMCIgd2lkdGg9Ijc0IiBoZWlnaHQ9IjI2IiBmaWxsPSIjMEYxNzJBIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSIxMDkyIiB5PSI1ODgiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyNiIgZmlsbD0iIzAwRkZGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMzQiIHk9IjMwIiB3aWR0aD0iMTA1NCIgaGVpZ2h0PSI3MzMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBGMTcyQSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4="
      }
    ]
  },
  {
    "name": "Creative & Arts",
    "orientation": "landscape",
    "items": [
      {
        "id": "crea-01",
        "name": "De Stijl Geometric",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijk1IiBmaWxsPSIjRkYwMDAwIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOTUiIGZpbGw9IiNGRkZGRkYiIG9wYWNpdHk9IjAiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTkwIiBoZWlnaHQ9Ijk1IiBmaWxsPSIjMDAwMENDIi8+PHJlY3QgeD0iMCIgeT0iNjk4IiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI5NSIgZmlsbD0iI0ZGRDQwMCIvPjxyZWN0IHg9IjkxMiIgeT0iNjk4IiB3aWR0aD0iMjEwIiBoZWlnaHQ9Ijk1IiBmaWxsPSIjMDAwMDAwIi8+PHJlY3QgeD0iMCIgeT0iOTUiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjciIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSIwIiB5PSI2OTEiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjciIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSI5MTIiIHk9Ijk1IiB3aWR0aD0iNyIgaGVpZ2h0PSI2MDMiIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4="
      },
      {
        "id": "crea-02",
        "name": "Fluid Abstract Expressionism",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZGRjVFRSIvPjxwYXRoIGQ9Ik0gMCA0MzYuMTUwMDAwMDAwMDAwMDMgQyAxMTIuMiAzMTcuMjAwMDAwMDAwMDAwMDUsIDExMi4yIDU1NS4wOTk5OTk5OTk5OTk5LCAwIDU5NC43NSBaIiBmaWxsPSIjRkY3RjUwIiBvcGFjaXR5PSIwLjg1Ii8+PHBhdGggZD0iTSAxMTIyIDI3Ny41NDk5OTk5OTk5OTk5NSBDIDk4Ny4zNiAxOTguMjUsIDk4Ny4zNiA0NzUuNzk5OTk5OTk5OTk5OTUsIDExMjIgNDM2LjE1MDAwMDAwMDAwMDAzIFoiIGZpbGw9IiNGRkIzNDciIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNIDAgMCBRIDEzNC42NCAxNS44NjAwMDAwMDAwMDAwMDEgMjI0LjQgMCBaIiBmaWxsPSIjRTI3MjVCIiBvcGFjaXR5PSIwLjYiLz48cGF0aCBkPSJNIDExMjIgNzkzIFEgOTY0LjkyIDc2MS4yOCA4NzUuMTYwMDAwMDAwMDAwMSA3OTMgWiIgZmlsbD0iI0UyNzI1QiIgb3BhY2l0eT0iMC42Ii8+PHJlY3QgeD0iNDQiIHk9IjQwIiB3aWR0aD0iMTAzNCIgaGVpZ2h0PSI3MTMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzdBM0IyRSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjM1Ii8+PC9zdmc+"
      },
      {
        "id": "crea-03",
        "name": "Memphis Milano 80s",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZBRkFGQSIvPjxjaXJjbGUgY3g9Ijc2IiBjeT0iNjIiIHI9IjI2IiBmaWxsPSIjRkYwMEZGIi8+PGNpcmNsZSBjeD0iNjguMiIgY3k9IjU0LjIiIHI9IjUuNzIiIGZpbGw9IiNGQUZBRkEiLz48Y2lyY2xlIGN4PSIxMDQ2IiBjeT0iNjIiIHI9IjIyIiBmaWxsPSIjMDBFNUZGIi8+PGNpcmNsZSBjeD0iMTAzOS40IiBjeT0iNTUuNCIgcj0iNC44NCIgZmlsbD0iI0ZBRkFGQSIvPjxjaXJjbGUgY3g9Ijc2IiBjeT0iNzMxIiByPSIyMiIgZmlsbD0iI0ZGRDQwMCIvPjxjaXJjbGUgY3g9IjY5LjQiIGN5PSI3MjQuNCIgcj0iNC44NCIgZmlsbD0iI0ZBRkFGQSIvPjxjaXJjbGUgY3g9IjEwNDYiIGN5PSI3MzEiIHI9IjI4IiBmaWxsPSIjRkY1QzhBIi8+PGNpcmNsZSBjeD0iMTAzNy42IiBjeT0iNzIyLjYiIHI9IjYuMTYiIGZpbGw9IiNGQUZBRkEiLz48cmVjdCB4PSI1MTUiIHk9IjQ0IiB3aWR0aD0iOTIiIGhlaWdodD0iMjYiIGZpbGw9IiMwMEU1RkYiLz48bGluZSB4MT0iMzM2LjYiIHkxPSI3MjciIHgyPSIzMzYuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iMzU4LjYiIHkxPSI3MjciIHgyPSIzNTguNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iMzgwLjYiIHkxPSI3MjciIHgyPSIzODAuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNDAyLjYiIHkxPSI3MjciIHgyPSI0MDIuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNDI0LjYiIHkxPSI3MjciIHgyPSI0MjQuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNDQ2LjYiIHkxPSI3MjciIHgyPSI0NDYuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNDY4LjYiIHkxPSI3MjciIHgyPSI0NjguNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNDkwLjYiIHkxPSI3MjciIHgyPSI0OTAuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNTEyLjYiIHkxPSI3MjciIHgyPSI1MTIuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNTM0LjYiIHkxPSI3MjciIHgyPSI1MzQuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNTU2LjYiIHkxPSI3MjciIHgyPSI1NTYuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNTc4LjYiIHkxPSI3MjciIHgyPSI1NzguNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNjAwLjYiIHkxPSI3MjciIHgyPSI2MDAuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNjIyLjYiIHkxPSI3MjciIHgyPSI2MjIuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNjQ0LjYiIHkxPSI3MjciIHgyPSI2NDQuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNjY2LjYiIHkxPSI3MjciIHgyPSI2NjYuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNjg4LjYiIHkxPSI3MjciIHgyPSI2ODguNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNzEwLjYiIHkxPSI3MjciIHgyPSI3MTAuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNzMyLjYiIHkxPSI3MjciIHgyPSI3MzIuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNzU0LjYiIHkxPSI3MjciIHgyPSI3NTQuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48bGluZSB4MT0iNzc2LjYiIHkxPSI3MjciIHgyPSI3NzYuNiIgeTI9Ijc1MyIgc3Ryb2tlPSIjRkYwMEZGIiBzdHJva2Utd2lkdGg9IjMiLz48cmVjdCB4PSIzNCIgeT0iMzQiIHdpZHRoPSIxMDU0IiBoZWlnaHQ9IjcyNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4="
      },
      {
        "id": "crea-04",
        "name": "Boho Contemporary Abstract",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZBRjlGNiIvPjxwYXRoIGQ9Ik0gMCAwIEwgMTUwIDAgQSAxNTAgMTUwIDAgMCAxIDAgMTUwIFoiIGZpbGw9IiNFMjcyNUIiIG9wYWNpdHk9IjAuOSIvPjxwYXRoIGQ9Ik0gMTEyMiA3OTMgTCA5NTIgNzkzIEEgMTcwIDE3MCAwIDAgMCAxMTIyIDYyMyBaIiBmaWxsPSIjQzlBMjI3IiBvcGFjaXR5PSIwLjg1Ii8+PHBhdGggZD0iTSAxMTIyIDAgTCAxMDAyIDAgQSAxMjAgMTIwIDAgMCAwIDExMjIgMTIwIFoiIGZpbGw9IiM3RTlBN0EiIG9wYWNpdHk9IjAuOCIvPjxwYXRoIGQ9Ik0gMCA3OTMgTCAxMzAgNzkzIEEgMTMwIDEzMCAwIDAgMSAwIDY2MyBaIiBmaWxsPSIjRDk4RTczIiBvcGFjaXR5PSIwLjc1Ii8+PC9zdmc+"
      },
      {
        "id": "crea-05",
        "name": "Editorial Color Blocking",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9Ijk1IiBmaWxsPSIjMDAwMDAwIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSI5NSIgZmlsbD0iI0ZGMDA1NSIvPjxyZWN0IHg9IjAiIHk9IjY5OCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOTUiIGZpbGw9IiNGMkYyRjIiLz48cmVjdCB4PSI3ODIiIHk9IjY5OCIgd2lkdGg9IjM0MCIgaGVpZ2h0PSI5NSIgZmlsbD0iIzAwMDAwMCIvPjxyZWN0IHg9Ijc4MiIgeT0iNjk4IiB3aWR0aD0iMTIiIGhlaWdodD0iOTUiIGZpbGw9IiNGRjAwNTUiLz48L3N2Zz4="
      },
      {
        "id": "crea-06",
        "name": "Vector Paint Stroke Illusion",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0gMCA2IFEgMjgwLjUgLTEwIDU2MSA2IFQgMTEyMiA2IEwgMTEyMiAzMiBRIDg0MS41IDQ4IDU2MSAzMiBUIDAgMzIgWiIgZmlsbD0iI0ZGMTQ5MyIgb3BhY2l0eT0iMC45Ii8+PHBhdGggZD0iTSAwIDM4IFEgMjgwLjUgMjIgNTYxIDM4IFQgMTEyMiAzOCBMIDExMjIgNTggUSA4NDEuNSA3NCA1NjEgNTggVCAwIDU4IFoiIGZpbGw9IiNGRkIzNDciIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNIDAgNjQgUSAyODAuNSA0OCA1NjEgNjQgVCAxMTIyIDY0IEwgMTEyMiA3OCBRIDg0MS41IDk0IDU2MSA3OCBUIDAgNzggWiIgZmlsbD0iIzAwQjREOCIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTSAwIDY5MyBRIDI4MC41IDY3NyA1NjEgNjkzIFQgMTEyMiA2OTMgTCAxMTIyIDcxNSBRIDg0MS41IDczMSA1NjEgNzE1IFQgMCA3MTUgWiIgZmlsbD0iIzAwQjREOCIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTSAwIDcxOSBRIDI4MC41IDcwMyA1NjEgNzE5IFQgMTEyMiA3MTkgTCAxMTIyIDc0NyBRIDg0MS41IDc2MyA1NjEgNzQ3IFQgMCA3NDcgWiIgZmlsbD0iI0ZGQjM0NyIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMCA3NDkgUSAyODAuNSA3MzMgNTYxIDc0OSBUIDExMjIgNzQ5IEwgMTEyMiA3NzkgUSA4NDEuNSA3OTUgNTYxIDc3OSBUIDAgNzc5IFoiIGZpbGw9IiNGRjE0OTMiIG9wYWNpdHk9IjAuOSIvPjwvc3ZnPg=="
      },
      {
        "id": "crea-07",
        "name": "Continuous Monoline Art",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0Y1RjVEQyIvPjxwYXRoIGQ9Ik0gNzAgNTAgSCAxMDUyIFEgMTA4OCA1MCAxMDg4IDg2IFYgNzA3IFEgMTA4OCA3NDMgMTA1MiA3NDMgSCA3MCBRIDM0IDc0MyAzNCA3MDcgViA4NiBRIDM0IDUwIDcwIDUwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBGMTcyQSIgc3Ryb2tlLXdpZHRoPSIzIi8+PGNpcmNsZSBjeD0iNzAiIGN5PSI1MCIgcj0iNyIgZmlsbD0iI0ZGNkIzNSIvPjxjaXJjbGUgY3g9IjEwODgiIGN5PSIzOTYuNSIgcj0iNyIgZmlsbD0iI0ZGNkIzNSIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9Ijc0MyIgcj0iNyIgZmlsbD0iI0ZGNkIzNSIvPjwvc3ZnPg=="
      },
      {
        "id": "crea-08",
        "name": "Stained Glass Geometric",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMCwwIDE0MCwwIDcwLDk1IDAsOTUiIGZpbGw9IiNGRjAwNTUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBvbHlnb24gcG9pbnRzPSIxNDAsMCAzMDAsMCAyMzAsOTUgNzAsOTUiIGZpbGw9IiNGRkQ0MDAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBvbHlnb24gcG9pbnRzPSIzMDAsMCA0NDAsMCAzNzAsOTUgMjMwLDk1IiBmaWxsPSIjMDBCNEQ4IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMyIvPjxwb2x5Z29uIHBvaW50cz0iNDQwLDAgMTEyMiwwIDExMjIsOTUgMzcwLDk1IiBmaWxsPSIjMkU3RDMyIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMyIvPjxwb2x5Z29uIHBvaW50cz0iMCw3OTMgMTEwLDc5MyA2MCw2OTggMCw2OTgiIGZpbGw9IiMyRTdEMzIiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBvbHlnb24gcG9pbnRzPSIxMTAsNzkzIDI4MCw3OTMgMjIwLDY5OCA2MCw2OTgiIGZpbGw9IiNGRkQ0MDAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBvbHlnb24gcG9pbnRzPSIyODAsNzkzIDQ1MCw3OTMgMzkwLDY5OCAyMjAsNjk4IiBmaWxsPSIjRkYwMDU1IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMyIvPjxwb2x5Z29uIHBvaW50cz0iNDUwLDc5MyAxMTIyLDc5MyAxMTIyLDY5OCAzOTAsNjk4IiBmaWxsPSIjMDBCNEQ4IiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg=="
      },
      {
        "id": "crea-09",
        "name": "Op-Art Optical Illusion",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxkZWZzPjxwYXR0ZXJuIGlkPSJyaXBwbGUiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjIwMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwMCBRIDU2MSA2MCAxMTIyIDEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjEuNCIvPjxwYXRoIGQ9Ik0gMCAxMDkgUSA1NjEgNjkgMTEyMiAxMDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIxLjQiLz48cGF0aCBkPSJNIDAgMTE4IFEgNTYxIDc4IDExMjIgMTE4IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMS40Ii8+PHBhdGggZD0iTSAwIDEyNyBRIDU2MSA4NyAxMTIyIDEyNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjEuNCIvPjxwYXRoIGQ9Ik0gMCAxMzYgUSA1NjEgOTYgMTEyMiAxMzYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIxLjQiLz48cGF0aCBkPSJNIDAgMTQ1IFEgNTYxIDEwNSAxMTIyIDE0NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjEuNCIvPjxwYXRoIGQ9Ik0gMCAxNTQgUSA1NjEgMTE0IDExMjIgMTU0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMS40Ii8+PHBhdGggZD0iTSAwIDE2MyBRIDU2MSAxMjMgMTEyMiAxNjMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExMSIgc3Ryb2tlLXdpZHRoPSIxLjQiLz48cGF0aCBkPSJNIDAgMTcyIFEgNTYxIDEzMiAxMTIyIDE3MiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExIiBzdHJva2Utd2lkdGg9IjEuNCIvPjxwYXRoIGQ9Ik0gMCAxODEgUSA1NjEgMTQxIDExMjIgMTgxIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMS40Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjcmlwcGxlKSIvPjxyZWN0IHg9IjAiIHk9IjY5MyIgd2lkdGg9IjExMjIiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI3JpcHBsZSkiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSIxMDYyIiBoZWlnaHQ9IjczMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
      },
      {
        "id": "crea-10",
        "name": "Pop Art Halftone Vector",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxkZWZzPjxwYXR0ZXJuIGlkPSJodDEwIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxjaXJjbGUgY3g9IjgiIGN5PSI4IiByPSI1IiBmaWxsPSIjMDBFNUZGIi8+PC9wYXR0ZXJuPjwvZGVmcz48ZGVmcz48cGF0dGVybiBpZD0iaHQxMGIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjUiIGZpbGw9IiNGRjAwRkYiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI0NzEuMjQiIGhlaWdodD0iOTUiIGZpbGw9InVybCgjaHQxMCkiLz48cmVjdCB4PSI2NTAuNzYiIHk9IjAiIHdpZHRoPSI0NzEuMjQiIGhlaWdodD0iOTUiIGZpbGw9InVybCgjaHQxMGIpIi8+PHJlY3QgeD0iMCIgeT0iNjk4IiB3aWR0aD0iNDcxLjI0IiBoZWlnaHQ9Ijk1IiBmaWxsPSJ1cmwoI2h0MTBiKSIvPjxyZWN0IHg9IjY1MC43NiIgeT0iNjk4IiB3aWR0aD0iNDcxLjI0IiBoZWlnaHQ9Ijk1IiBmaWxsPSJ1cmwoI2h0MTApIi8+PHJlY3QgeD0iMzYiIHk9IjMwIiB3aWR0aD0iMTA1MCIgaGVpZ2h0PSI3MzMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+"
      }
    ]
  },
  {
    "name": "Luxury & Prestige",
    "orientation": "landscape",
    "items": [
      {
        "id": "lux-01",
        "name": "Art Deco Opulence",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMTExMSIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMS41Ii8+PHJlY3QgeD0iNDQiIHk9IjQ0IiB3aWR0aD0iMTAzNCIgaGVpZ2h0PSI3MDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNIDMwIDMwIEwgMTIwIDUyIEwgNTAgMTIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMzAgMzAgTCAxMjAgNzQgTCA3MCAxMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjc1IiBvcGFjaXR5PSIwLjg1Ii8+PHBhdGggZD0iTSAzMCAzMCBMIDEyMCA5NiBMIDkwIDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNIDMwIDMwIEwgMTIwIDExOCBMIDExMCAxMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjc1IiBvcGFjaXR5PSIwLjg1Ii8+PHBhdGggZD0iTSAxMDkyIDMwIEwgMTAwMiA1MiBMIDEwNzIgMTIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMTA5MiAzMCBMIDEwMDIgNzQgTCAxMDUyIDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNIDEwOTIgMzAgTCAxMDAyIDk2IEwgMTAzMiAxMjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjc1IiBvcGFjaXR5PSIwLjg1Ii8+PHBhdGggZD0iTSAxMDkyIDMwIEwgMTAwMiAxMTggTCAxMDEyIDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNIDMwIDc2MyBMIDEyMCA3NDEgTCA1MCA2NzMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjc1IiBvcGFjaXR5PSIwLjg1Ii8+PHBhdGggZD0iTSAzMCA3NjMgTCAxMjAgNzE5IEwgNzAgNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMzAgNzYzIEwgMTIwIDY5NyBMIDkwIDY3MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuODUiLz48cGF0aCBkPSJNIDMwIDc2MyBMIDEyMCA2NzUgTCAxMTAgNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMTA5MiA3NjMgTCAxMDAyIDc0MSBMIDEwNzIgNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMTA5MiA3NjMgTCAxMDAyIDcxOSBMIDEwNTIgNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMTA5MiA3NjMgTCAxMDAyIDY5NyBMIDEwMzIgNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxwYXRoIGQ9Ik0gMTA5MiA3NjMgTCAxMDAyIDY3NSBMIDEwMTIgNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC43NSIgb3BhY2l0eT0iMC44NSIvPjxsaW5lIHgxPSIzMzYuNiIgeTE9IjQwIiB4Mj0iNzg1LjQiIHkyPSI0MCIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iMzM2LjYiIHkxPSI3NTMiIHgyPSI3ODUuNCIgeTI9Ijc1MyIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4="
      },
      {
        "id": "lux-02",
        "name": "High-Fashion Minimalism",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjYwIiB5PSI2MCIgd2lkdGg9IjEwMDIiIGhlaWdodD0iNjczIiBmaWxsPSJub25lIiBzdHJva2U9IiNCNzZFNzkiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjcyIiB5PSI3MiIgd2lkdGg9Ijk3OCIgaGVpZ2h0PSI2NDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0U4RDVEOCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48bGluZSB4MT0iNDcxLjI0IiB5MT0iNjYiIHgyPSI2NTAuNzYiIHkyPSI2NiIgc3Ryb2tlPSIjQjc2RTc5IiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iNDcxLjI0IiB5MT0iNzI3IiB4Mj0iNjUwLjc2IiB5Mj0iNzI3IiBzdHJva2U9IiNCNzZFNzkiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9IjQ0IiByPSIxMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQjc2RTc5IiBzdHJva2Utd2lkdGg9IjAuNzUiLz48L3N2Zz4="
      },
      {
        "id": "lux-03",
        "name": "Monoline Diamond Geometry",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzJDMzUzOSIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPjxkZWZzPjxwYXR0ZXJuIGlkPSJkaWEiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTMwIDAgTDYwIDMwIEwzMCA2MCBMMCAzMCBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjkwIiBmaWxsPSJ1cmwoI2RpYSkiLz48cmVjdCB4PSIwIiB5PSI3MDMiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjkwIiBmaWxsPSJ1cmwoI2RpYSkiLz48cG9seWdvbiBwb2ludHM9IjU2MSw1MiA1NzcsNjggNTYxLDg0IDU0NSw2OCIgZmlsbD0iI0Q0QUYzNyIvPjwvc3ZnPg=="
      },
      {
        "id": "lux-04",
        "name": "Burgundy & Gold Regal",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzYwMDAxOCIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMjIiIGhlaWdodD0iNjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjYyIiB5PSI2MiIgd2lkdGg9Ijk5OCIgaGVpZ2h0PSI2NjkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMjYiIGZpbGw9IiM2MDAwMTgiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAzNiA1MCBhIDE0IDE0IDAgMCAxIDI4IDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNSIgZmlsbD0iI0ZGRDcwMCIvPjxjaXJjbGUgY3g9IjEwNzIiIGN5PSI1MCIgcj0iMjYiIGZpbGw9IiM2MDAwMTgiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAxMDU4IDUwIGEgMTQgMTQgMCAwIDEgMjggMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZENzAwIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIxMDcyIiBjeT0iNTAiIHI9IjUiIGZpbGw9IiNGRkQ3MDAiLz48Y2lyY2xlIGN4PSI1MCIgY3k9Ijc0MyIgcj0iMjYiIGZpbGw9IiM2MDAwMTgiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAzNiA3NDMgYSAxNCAxNCAwIDAgMSAyOCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNzQzIiByPSI1IiBmaWxsPSIjRkZENzAwIi8+PGNpcmNsZSBjeD0iMTA3MiIgY3k9Ijc0MyIgcj0iMjYiIGZpbGw9IiM2MDAwMTgiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAxMDU4IDc0MyBhIDE0IDE0IDAgMCAxIDI4IDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PGNpcmNsZSBjeD0iMTA3MiIgY3k9Ijc0MyIgcj0iNSIgZmlsbD0iI0ZGRDcwMCIvPjxsaW5lIHgxPSIzODEuNDgiIHkxPSI2MiIgeDI9Ijc0MC41MiIgeTI9IjYyIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMSIvPjxsaW5lIHgxPSIzODEuNDgiIHkxPSI3MzEiIHgyPSI3NDAuNTIiIHkyPSI3MzEiIHN0cm9rZT0iI0ZGRDcwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+"
      },
      {
        "id": "lux-05",
        "name": "Vector Marble Veining",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZBRkFGQSIvPjxwYXRoIGQ9Ik0gMCA3MCBRIDMzNi41OTk5OTk5OTk5OTk5NyAyMCA2MTcuMSAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNFMEUwRTAiIHN0cm9rZS13aWR0aD0iNCIvPjxwYXRoIGQ9Ik0gMTEyMiA3MjMgUSA3ODUuNCA3NzMgNTA0LjkwMDAwMDAwMDAwMDAzIDc5MyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTBFMEUwIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNIDAgNzMzIFEgMjI0LjQgNjkzIDM1OS4wNCA3OTMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0U4RThFOCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iNDYiIHk9IjQ2IiB3aWR0aD0iMTAzMCIgaGVpZ2h0PSI3MDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0MwQzBDMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+"
      },
      {
        "id": "lux-06",
        "name": "Concentric Golden Frame",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBDMTQ0NSIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iNCIvPjxyZWN0IHg9IjQ2IiB5PSI0NiIgd2lkdGg9IjEwMzAiIGhlaWdodD0iNzAxIiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMS41Ii8+PHJlY3QgeD0iNTgiIHk9IjU4IiB3aWR0aD0iMTAwNiIgaGVpZ2h0PSI2NzciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cG9seWdvbiBwb2ludHM9IjMwLDMwIDkwLDMwIDMwLDkwIiBmaWxsPSIjRDRBRjM3Ii8+PHBvbHlnb24gcG9pbnRzPSIzMCwzMCA2MiwzMCAzMCw2MiIgZmlsbD0iIzBDMTQ0NSIvPjxwb2x5Z29uIHBvaW50cz0iMTA5MiwzMCAxMDMyLDMwIDEwOTIsOTAiIGZpbGw9IiNENEFGMzciLz48cG9seWdvbiBwb2ludHM9IjEwOTIsMzAgMTA2MCwzMCAxMDkyLDYyIiBmaWxsPSIjMEMxNDQ1Ii8+PHBvbHlnb24gcG9pbnRzPSIzMCw3NjMgOTAsNzYzIDMwLDcwMyIgZmlsbD0iI0Q0QUYzNyIvPjxwb2x5Z29uIHBvaW50cz0iMzAsNzYzIDYyLDc2MyAzMCw3MzEiIGZpbGw9IiMwQzE0NDUiLz48cG9seWdvbiBwb2ludHM9IjEwOTIsNzYzIDEwMzIsNzYzIDEwOTIsNzAzIiBmaWxsPSIjRDRBRjM3Ii8+PHBvbHlnb24gcG9pbnRzPSIxMDkyLDc2MyAxMDYwLDc2MyAxMDkyLDczMSIgZmlsbD0iIzBDMTQ0NSIvPjwvc3ZnPg=="
      },
      {
        "id": "lux-07",
        "name": "Scalloped Art Nouveau",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0gMCAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIHEgMjggLTIyIDU2IDAgcSAyOCAtMjIgNTYgMCBxIDI4IC0yMiA1NiAwIEwgMTEyMiAwIEwgMCAwIFoiIGZpbGw9IiM3QjlFNjQiIG9wYWNpdHk9IjAuOSIvPjxwYXRoIGQ9Ik0gMCA3OTMgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgcSAyOCAyMiA1NiAwIHEgMjggMjIgNTYgMCBxIDI4IDIyIDU2IDAgTCAxMTIyIDAgTCAwIDAgWiIgZmlsbD0iIzdCOUU2NCIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iNDAiIHk9IjEwNSIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNTgzIiBmaWxsPSJub25lIiBzdHJva2U9IiNDOUEyMjciIHN0cm9rZS13aWR0aD0iMS41Ii8+PGNpcmNsZSBjeD0iNTYxIiBjeT0iNzEiIHI9IjEyIiBmaWxsPSJub25lIiBzdHJva2U9IiNDOUEyMjciIHN0cm9rZS13aWR0aD0iMS41Ii8+PGNpcmNsZSBjeD0iNTYxIiBjeT0iNzIyIiByPSIxMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzlBMjI3IiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg=="
      },
      {
        "id": "lux-08",
        "name": "Guilloche Excellence",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFBMUExQSIvPjxlbGxpcHNlIGN4PSI2NCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgwIDY0IDY0KSIvPjxlbGxpcHNlIGN4PSI2NCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgyNS43IDY0IDY0KSIvPjxlbGxpcHNlIGN4PSI2NCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSg1MS40IDY0IDY0KSIvPjxlbGxpcHNlIGN4PSI2NCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSg3Ny4xIDY0IDY0KSIvPjxlbGxpcHNlIGN4PSI2NCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgxMDIuOCA2NCA2NCkiLz48ZWxsaXBzZSBjeD0iNjQiIGN5PSI2NCIgcng9IjQwIiByeT0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuOSIgdHJhbnNmb3JtPSJyb3RhdGUoMTI4LjUgNjQgNjQpIi8+PGVsbGlwc2UgY3g9IjY0IiBjeT0iNjQiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDE1NC4yIDY0IDY0KSIvPjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjYiIGZpbGw9IiNENEFGMzciLz48ZWxsaXBzZSBjeD0iMTA1OCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgwIDEwNTggNjQpIi8+PGVsbGlwc2UgY3g9IjEwNTgiIGN5PSI2NCIgcng9IjQwIiByeT0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuOSIgdHJhbnNmb3JtPSJyb3RhdGUoMjUuNyAxMDU4IDY0KSIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNjQiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDUxLjQgMTA1OCA2NCkiLz48ZWxsaXBzZSBjeD0iMTA1OCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSg3Ny4xIDEwNTggNjQpIi8+PGVsbGlwc2UgY3g9IjEwNTgiIGN5PSI2NCIgcng9IjQwIiByeT0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuOSIgdHJhbnNmb3JtPSJyb3RhdGUoMTAyLjggMTA1OCA2NCkiLz48ZWxsaXBzZSBjeD0iMTA1OCIgY3k9IjY0IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgxMjguNSAxMDU4IDY0KSIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNjQiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDE1NC4yIDEwNTggNjQpIi8+PGNpcmNsZSBjeD0iMTA1OCIgY3k9IjY0IiByPSI2IiBmaWxsPSIjRDRBRjM3Ii8+PGVsbGlwc2UgY3g9IjY0IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgwIDY0IDcyOSkiLz48ZWxsaXBzZSBjeD0iNjQiIGN5PSI3MjkiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDI1LjcgNjQgNzI5KSIvPjxlbGxpcHNlIGN4PSI2NCIgY3k9IjcyOSIgcng9IjQwIiByeT0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuOSIgdHJhbnNmb3JtPSJyb3RhdGUoNTEuNCA2NCA3MjkpIi8+PGVsbGlwc2UgY3g9IjY0IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSg3Ny4xIDY0IDcyOSkiLz48ZWxsaXBzZSBjeD0iNjQiIGN5PSI3MjkiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDEwMi44IDY0IDcyOSkiLz48ZWxsaXBzZSBjeD0iNjQiIGN5PSI3MjkiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDEyOC41IDY0IDcyOSkiLz48ZWxsaXBzZSBjeD0iNjQiIGN5PSI3MjkiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDE1NC4yIDY0IDcyOSkiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjcyOSIgcj0iNiIgZmlsbD0iI0Q0QUYzNyIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgwIDEwNTggNzI5KSIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgyNS43IDEwNTggNzI5KSIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSg1MS40IDEwNTggNzI5KSIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSg3Ny4xIDEwNTggNzI5KSIvPjxlbGxpcHNlIGN4PSIxMDU4IiBjeT0iNzI5IiByeD0iNDAiIHJ5PSIxNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC45IiB0cmFuc2Zvcm09InJvdGF0ZSgxMDIuOCAxMDU4IDcyOSkiLz48ZWxsaXBzZSBjeD0iMTA1OCIgY3k9IjcyOSIgcng9IjQwIiByeT0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q0QUYzNyIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuOSIgdHJhbnNmb3JtPSJyb3RhdGUoMTI4LjUgMTA1OCA3MjkpIi8+PGVsbGlwc2UgY3g9IjEwNTgiIGN5PSI3MjkiIHJ4PSI0MCIgcnk9IjE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjkiIHRyYW5zZm9ybT0icm90YXRlKDE1NC4yIDEwNTggNzI5KSIvPjxjaXJjbGUgY3g9IjEwNTgiIGN5PSI3MjkiIHI9IjYiIGZpbGw9IiNENEFGMzciLz48cmVjdCB4PSIzNCIgeT0iMzQiIHdpZHRoPSIxMDU0IiBoZWlnaHQ9IjcyNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjEiLz48cmVjdCB4PSI0NiIgeT0iNDYiIHdpZHRoPSIxMDMwIiBoZWlnaHQ9IjcwMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRDRBRjM3IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg=="
      },
      {
        "id": "lux-09",
        "name": "Foil Stamp Vector Illusion",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMjIiIGhlaWdodD0iNjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiNEQUE1MjAiIHN0cm9rZS13aWR0aD0iMTAiLz48cmVjdCB4PSI2NiIgeT0iNjYiIHdpZHRoPSI5OTAiIGhlaWdodD0iNjYxIiBmaWxsPSJub25lIiBzdHJva2U9IiNCODg2MEIiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9Ijc2IiB5PSI3NiIgd2lkdGg9Ijk3MCIgaGVpZ2h0PSI2NDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0YwRDc3QiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxMyIgZmlsbD0iI0RBQTUyMCIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjYiIGZpbGw9IiNmZmZmZmYiLz48Y2lyY2xlIGN4PSIxMDcyIiBjeT0iNTAiIHI9IjEzIiBmaWxsPSIjREFBNTIwIi8+PGNpcmNsZSBjeD0iMTA3MiIgY3k9IjUwIiByPSI2IiBmaWxsPSIjZmZmZmZmIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI3NDMiIHI9IjEzIiBmaWxsPSIjREFBNTIwIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI3NDMiIHI9IjYiIGZpbGw9IiNmZmZmZmYiLz48Y2lyY2xlIGN4PSIxMDcyIiBjeT0iNzQzIiByPSIxMyIgZmlsbD0iI0RBQTUyMCIvPjxjaXJjbGUgY3g9IjEwNzIiIGN5PSI3NDMiIHI9IjYiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4="
      },
      {
        "id": "lux-10",
        "name": "The Obsidian Monolith",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzA1MDUwNSIvPjxyZWN0IHg9IjE1IiB5PSIxNSIgd2lkdGg9IjEwOTIiIGhlaWdodD0iNzYzIiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjI3IiB5PSIyNyIgd2lkdGg9IjEwNjgiIGhlaWdodD0iNzM5IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHJlY3QgeD0iNDkiIHk9IjIzNy45IiB3aWR0aD0iNiIgaGVpZ2h0PSIzMTcuMiIgZmlsbD0iI0ZGRDcwMCIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMTA2NyIgeT0iMjM3LjkiIHdpZHRoPSI2IiBoZWlnaHQ9IjMxNy4yIiBmaWxsPSIjRkZENzAwIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSI0NzEuMjQiIHk9IjM4IiB3aWR0aD0iMTc5LjUyIiBoZWlnaHQ9IjQiIGZpbGw9IiNGRkQ3MDAiLz48cmVjdCB4PSI0NzEuMjQiIHk9Ijc1MSIgd2lkdGg9IjE3OS41MiIgaGVpZ2h0PSI0IiBmaWxsPSIjRkZENzAwIi8+PC9zdmc+"
      }
    ]
  },
  {
    "name": "Sports & Athletics",
    "orientation": "landscape",
    "items": [
      {
        "id": "sport-01",
        "name": "Kinetic Chevron Vectors",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMCwwIDQwLDAgNCwzOTYuNSA0MCw3OTMgMCw3OTMgMzYsMzk2LjUiIGZpbGw9IiNFMzI2MzYiLz48cG9seWdvbiBwb2ludHM9IjExMjIsMCAxMDgyLDAgMTExOCwzOTYuNSAxMDgyLDc5MyAxMTIyLDc5MyAxMDg2LDM5Ni41IiBmaWxsPSIjMUMxQzFDIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjExMjIiIGhlaWdodD0iMTYiIGZpbGw9IiMxQzFDMUMiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDQ4LjgiIGhlaWdodD0iMTYiIGZpbGw9IiNFMzI2MzYiLz48cmVjdCB4PSIwIiB5PSI3NzciIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjE2IiBmaWxsPSIjMUMxQzFDIi8+PHJlY3QgeD0iNjczLjIiIHk9Ijc3NyIgd2lkdGg9IjQ0OC44IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRTMyNjM2Ii8+PC9zdmc+"
      },
      {
        "id": "sport-02",
        "name": "Velocity Speed Lines",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0Y1RjVGNSIvPjxyZWN0IHg9IjM5MSIgeT0iMTYiIHdpZHRoPSIzNDAiIGhlaWdodD0iNyIgZmlsbD0iI0ZGNDUwMCIgb3BhY2l0eT0iMSIvPjxyZWN0IHg9IjQxNiIgeT0iMzMiIHdpZHRoPSIyOTAiIGhlaWdodD0iNyIgZmlsbD0iI0ZGNDUwMCIgb3BhY2l0eT0iMC44NiIvPjxyZWN0IHg9IjQ0MSIgeT0iNTAiIHdpZHRoPSIyNDAiIGhlaWdodD0iNyIgZmlsbD0iI0ZGNDUwMCIgb3BhY2l0eT0iMC43MiIvPjxyZWN0IHg9IjQ2NiIgeT0iNjciIHdpZHRoPSIxOTAiIGhlaWdodD0iNyIgZmlsbD0iI0ZGNDUwMCIgb3BhY2l0eT0iMC41OCIvPjxyZWN0IHg9IjQ5MSIgeT0iODQiIHdpZHRoPSIxNDAiIGhlaWdodD0iNyIgZmlsbD0iI0ZGNDUwMCIgb3BhY2l0eT0iMC40Mzk5OTk5OTk5OTk5OTk5NSIvPjxyZWN0IHg9IjM5MSIgeT0iNjkzIiB3aWR0aD0iMzQwIiBoZWlnaHQ9IjciIGZpbGw9IiNGRjQ1MDAiIG9wYWNpdHk9IjEiLz48cmVjdCB4PSI0MTYiIHk9IjcxMCIgd2lkdGg9IjI5MCIgaGVpZ2h0PSI3IiBmaWxsPSIjRkY0NTAwIiBvcGFjaXR5PSIwLjg2Ii8+PHJlY3QgeD0iNDQxIiB5PSI3MjciIHdpZHRoPSIyNDAiIGhlaWdodD0iNyIgZmlsbD0iI0ZGNDUwMCIgb3BhY2l0eT0iMC43MiIvPjxyZWN0IHg9IjQ2NiIgeT0iNzQ0IiB3aWR0aD0iMTkwIiBoZWlnaHQ9IjciIGZpbGw9IiNGRjQ1MDAiIG9wYWNpdHk9IjAuNTgiLz48cmVjdCB4PSI0OTEiIHk9Ijc2MSIgd2lkdGg9IjE0MCIgaGVpZ2h0PSI3IiBmaWxsPSIjRkY0NTAwIiBvcGFjaXR5PSIwLjQzOTk5OTk5OTk5OTk5OTk1Ii8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyIiBoZWlnaHQ9Ijc5MyIgZmlsbD0iIzFDMUMxQyIvPjxyZWN0IHg9IjExMTAiIHk9IjAiIHdpZHRoPSIxMiIgaGVpZ2h0PSI3OTMiIGZpbGw9IiMxQzFDMUMiLz48L3N2Zz4="
      },
      {
        "id": "sport-03",
        "name": "Diagonal Power Blocks",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMCwwIDExMCwwIDQwLDc5MyAwLDc5MyIgZmlsbD0iIzFDMUMxQyIvPjxwb2x5Z29uIHBvaW50cz0iMTEyMiwwIDk3MiwwIDEwNDIsNzkzIDExMjIsNzkzIiBmaWxsPSIjRTMyNjM2Ii8+PHBvbHlnb24gcG9pbnRzPSIxMDYyLDAgMTEwMiwwIDExMTIsMzk2LjUgMTEwMiw3OTMgMTA2Miw3OTMiIGZpbGw9IiMxQzFDMUMiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIxNCIgZmlsbD0iIzFDMUMxQyIvPjxyZWN0IHg9IjAiIHk9Ijc3OSIgd2lkdGg9IjExMjIiIGhlaWdodD0iMTQiIGZpbGw9IiMxQzFDMUMiLz48L3N2Zz4="
      },
      {
        "id": "sport-04",
        "name": "Track & Field Curves",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxlbGxpcHNlIGN4PSI1NjEiIGN5PSIzOTYuNSIgcng9IjU0MSIgcnk9IjM4MC41IiBmaWxsPSJub25lIiBzdHJva2U9IiMxQzFDMUMiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjg1Ii8+PGVsbGlwc2UgY3g9IjU2MSIgY3k9IjM5Ni41IiByeD0iNTI3IiByeT0iMzY2LjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0U1MzkzNSIgc3Ryb2tlLXdpZHRoPSIxLjUiIG9wYWNpdHk9IjAuODUiLz48ZWxsaXBzZSBjeD0iNTYxIiBjeT0iMzk2LjUiIHJ4PSI1MTMiIHJ5PSIzNTIuNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMUMxQzFDIiBzdHJva2Utd2lkdGg9IjEuNSIgb3BhY2l0eT0iMC44NSIvPjxlbGxpcHNlIGN4PSI1NjEiIGN5PSIzOTYuNSIgcng9IjQ5OSIgcnk9IjMzOC41IiBmaWxsPSJub25lIiBzdHJva2U9IiNFNTM5MzUiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjg1Ii8+PHJlY3QgeD0iNjYiIHk9IjEwMCIgd2lkdGg9Ijk5MCIgaGVpZ2h0PSI1OTMiIHJ4PSI0MCIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+"
      },
      {
        "id": "sport-05",
        "name": "Sports Tech Hex-Mesh",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxkZWZzPjxwYXR0ZXJuIGlkPSJoZXhtZXNoIiB3aWR0aD0iMzAiIGhlaWdodD0iNTIiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0xNSAwIEwzMCAxMyBMMzAgMzkgTDE1IDUyIEwwIDM5IEwwIDEzIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBGMTcyQSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI4OCIgZmlsbD0idXJsKCNoZXhtZXNoKSIvPjxyZWN0IHg9IjAiIHk9IjcwNSIgd2lkdGg9IjExMjIiIGhlaWdodD0iODgiIGZpbGw9InVybCgjaGV4bWVzaCkiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI4OCIgZmlsbD0iIzBGMTcyQSIgb3BhY2l0eT0iMC4wNiIvPjxyZWN0IHg9IjAiIHk9IjcwNSIgd2lkdGg9IjExMjIiIGhlaWdodD0iODgiIGZpbGw9IiMwRjE3MkEiIG9wYWNpdHk9IjAuMDYiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSIxMDYyIiBoZWlnaHQ9IjczMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEYxNzJBIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4="
      },
      {
        "id": "sport-06",
        "name": "Sweeping Nike-esque Swoosh",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0gMCA2OTggUSA0NDguOCA2NjggMTEyMiA3MDggTCAxMTIyIDc5MyBMIDAgNzkzIFoiIGZpbGw9IiMwMDAwODAiLz48cGF0aCBkPSJNIDAgNzIyIFEgNTA0LjkwMDAwMDAwMDAwMDAzIDY5MiAxMTIyIDczMiBMIDExMjIgNzUwIFEgNTA0LjkwMDAwMDAwMDAwMDAzIDcxMCAwIDc0MCBaIiBmaWxsPSIjRkY0NTAwIiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzAwMDA4MCIvPjxyZWN0IHg9IjAiIHk9IjEyIiB3aWR0aD0iMzM2LjYiIGhlaWdodD0iNiIgZmlsbD0iI0ZGNDUwMCIvPjwvc3ZnPg=="
      },
      {
        "id": "sport-07",
        "name": "Geometric Star Integration",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMjIiIGhlaWdodD0iNjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiNFNTM5MzUiIHN0cm9rZS13aWR0aD0iMTIiLz48cmVjdCB4PSI3MiIgeT0iNzIiIHdpZHRoPSI5NzgiIGhlaWdodD0iNjQ5IiBmaWxsPSJub25lIiBzdHJva2U9IiMxQzFDMUMiIHN0cm9rZS13aWR0aD0iMSIvPjxwb2x5Z29uIHBvaW50cz0iNTAsMjYgNTUuOTIsNDEuODUgNzIuODMsNDIuNTggNTkuNTksNTMuMTEgNjQuMTEsNjkuNDIgNTAsNjAuMDggMzUuODksNjkuNDIgNDAuNDEsNTMuMTEgMjcuMTcsNDIuNTggNDQuMDgsNDEuODUiIGZpbGw9IiNFNTM5MzUiLz48cG9seWdvbiBwb2ludHM9IjEwNzIsMjYgMTA3Ny45Miw0MS44NSAxMDk0LjgzLDQyLjU4IDEwODEuNTksNTMuMTEgMTA4Ni4xMSw2OS40MiAxMDcyLDYwLjA4IDEwNTcuODksNjkuNDIgMTA2Mi40MSw1My4xMSAxMDQ5LjE3LDQyLjU4IDEwNjYuMDgsNDEuODUiIGZpbGw9IiNFNTM5MzUiLz48cG9seWdvbiBwb2ludHM9IjUwLDcxOSA1NS45Miw3MzQuODUgNzIuODMsNzM1LjU4IDU5LjU5LDc0Ni4xMSA2NC4xMSw3NjIuNDIgNTAsNzUzLjA4IDM1Ljg5LDc2Mi40MiA0MC40MSw3NDYuMTEgMjcuMTcsNzM1LjU4IDQ0LjA4LDczNC44NSIgZmlsbD0iI0U1MzkzNSIvPjxwb2x5Z29uIHBvaW50cz0iMTA3Miw3MTkgMTA3Ny45Miw3MzQuODUgMTA5NC44Myw3MzUuNTggMTA4MS41OSw3NDYuMTEgMTA4Ni4xMSw3NjIuNDIgMTA3Miw3NTMuMDggMTA1Ny44OSw3NjIuNDIgMTA2Mi40MSw3NDYuMTEgMTA0OS4xNyw3MzUuNTggMTA2Ni4wOCw3MzQuODUiIGZpbGw9IiNFNTM5MzUiLz48L3N2Zz4="
      },
      {
        "id": "sport-08",
        "name": "Extreme Sports Triangles",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwb2x5Z29uIHBvaW50cz0iMCwwIDE1MCwwIDc1LDg0IiBmaWxsPSIjMTExMTExIi8+PHBvbHlnb24gcG9pbnRzPSIxMTIyLDAgOTcyLDAgMTA0Nyw4NCIgZmlsbD0iIzM5RkYxNCIvPjxwb2x5Z29uIHBvaW50cz0iMCw3OTMgMTUwLDc5MyA3NSw3MDkiIGZpbGw9IiMzOUZGMTQiLz48cG9seWdvbiBwb2ludHM9IjExMjIsNzkzIDk3Miw3OTMgMTA0Nyw3MDkiIGZpbGw9IiMxMTExMTEiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIxMiIgZmlsbD0iIzExMTExMSIvPjxyZWN0IHg9IjAiIHk9Ijc4MSIgd2lkdGg9IjExMjIiIGhlaWdodD0iMTIiIGZpbGw9IiMxMTExMTEiLz48L3N2Zz4="
      },
      {
        "id": "sport-09",
        "name": "Synthwave Cyber Athletics",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFhMGIyZSIvPjxwYXRoIGQ9Ik0gNDk5IDg1IGEgNjIgNjIgMCAwIDEgMTI0IDAgeiIgZmlsbD0iI0ZGMkU5MyIvPjxyZWN0IHg9IjAiIHk9Ijg1IiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIzIiBmaWxsPSIjMDBGRkZGIi8+PGxpbmUgeDE9IjI1NSIgeTE9IjY5OCIgeDI9Ii04NzkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjI4OSIgeTE9IjY5OCIgeDI9Ii03MTkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjMyMyIgeTE9IjY5OCIgeDI9Ii01NTkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjM1NyIgeTE9IjY5OCIgeDI9Ii0zOTkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjM5MSIgeTE9IjY5OCIgeDI9Ii0yMzkiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjQyNSIgeTE9IjY5OCIgeDI9Ii03OSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNTUiLz48bGluZSB4MT0iNDU5IiB5MT0iNjk4IiB4Mj0iODEiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjQ5MyIgeTE9IjY5OCIgeDI9IjI0MSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNTUiLz48bGluZSB4MT0iNTI3IiB5MT0iNjk4IiB4Mj0iNDAxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI1NjEiIHkxPSI2OTgiIHgyPSI1NjEiIHkyPSI3OTMiIHN0cm9rZT0iIzAwRkZGRiIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ii8+PGxpbmUgeDE9IjU5NSIgeTE9IjY5OCIgeDI9IjcyMSIgeTI9Ijc5MyIgc3Ryb2tlPSIjMDBGRkZGIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNTUiLz48bGluZSB4MT0iNjI5IiB5MT0iNjk4IiB4Mj0iODgxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI2NjMiIHkxPSI2OTgiIHgyPSIxMDQxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI2OTciIHkxPSI2OTgiIHgyPSIxMjAxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI3MzEiIHkxPSI2OTgiIHgyPSIxMzYxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI3NjUiIHkxPSI2OTgiIHgyPSIxNTIxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI3OTkiIHkxPSI2OTgiIHgyPSIxNjgxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI4MzMiIHkxPSI2OTgiIHgyPSIxODQxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSI4NjciIHkxPSI2OTgiIHgyPSIyMDAxIiB5Mj0iNzkzIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSIvPjxsaW5lIHgxPSIwIiB5MT0iNjk4IiB4Mj0iMTEyMiIgeTI9IjY5OCIgc3Ryb2tlPSIjRkYyRTkzIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzE2IiB4Mj0iMTEyMiIgeTI9IjcxNiIgc3Ryb2tlPSIjRkYyRTkzIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzM0IiB4Mj0iMTEyMiIgeTI9IjczNCIgc3Ryb2tlPSIjRkYyRTkzIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzUyIiB4Mj0iMTEyMiIgeTI9Ijc1MiIgc3Ryb2tlPSIjRkYyRTkzIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzcwIiB4Mj0iMTEyMiIgeTI9Ijc3MCIgc3Ryb2tlPSIjRkYyRTkzIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuNCIvPjxsaW5lIHgxPSIwIiB5MT0iNzg4IiB4Mj0iMTEyMiIgeTI9Ijc4OCIgc3Ryb2tlPSIjRkYyRTkzIiBzdHJva2Utd2lkdGg9IjAuNzUiIG9wYWNpdHk9IjAuNCIvPjxyZWN0IHg9IjI2IiB5PSIyNiIgd2lkdGg9IjEwNzAiIGhlaWdodD0iNzQxIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEZGRkYiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjgiLz48cmVjdCB4PSI1MiIgeT0iODgiIHdpZHRoPSIxMDE4IiBoZWlnaHQ9IjYxMyIgcng9IjEyIiBmaWxsPSIjMWEwYjJlIiBvcGFjaXR5PSIwLjkyIi8+PC9zdmc+"
      },
      {
        "id": "sport-10",
        "name": "Varsity Letterman Stripes",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjI2IiBmaWxsPSIjMDAyMzY2Ii8+PHJlY3QgeD0iMCIgeT0iMjYiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRkZENzAwIi8+PHJlY3QgeD0iMCIgeT0iMzYiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjIyIiBmaWxsPSIjMDAyMzY2Ii8+PHJlY3QgeD0iMCIgeT0iNzM1IiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSIyNiIgZmlsbD0iIzAwMjM2NiIvPjxyZWN0IHg9IjAiIHk9IjcyNSIgd2lkdGg9IjExMjIiIGhlaWdodD0iMTAiIGZpbGw9IiNGRkQ3MDAiLz48cmVjdCB4PSIwIiB5PSI3MTMiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjIyIiBmaWxsPSIjMDAyMzY2Ii8+PHJlY3QgeD0iMzAiIHk9IjEwMyIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNTg3IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDIzNjYiIHN0cm9rZS13aWR0aD0iMyIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9IjYyIiByPSIxOCIgZmlsbD0iIzAwMjM2NiIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9IjYyIiByPSIxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZENzAwIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg=="
      }
    ]
  },
  {
    "name": "Medical & Healthcare",
    "orientation": "landscape",
    "items": [
      {
        "id": "med-01",
        "name": "Clinical Swiss Minimalism",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZBRkFGQSIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiNFMEUwRTAiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjI1LjUiIHk9IjQ1LjYiIHdpZHRoPSI5IiBoZWlnaHQ9IjI4LjgiIGZpbGw9IiMwQTdCODMiLz48cmVjdCB4PSIxNS42IiB5PSI1NS41IiB3aWR0aD0iMjguOCIgaGVpZ2h0PSI5IiBmaWxsPSIjMEE3QjgzIi8+PHJlY3QgeD0iMTA4Ny41IiB5PSI3MTguNiIgd2lkdGg9IjkiIGhlaWdodD0iMjguOCIgZmlsbD0iIzBBN0I4MyIvPjxyZWN0IHg9IjEwNzcuNiIgeT0iNzI4LjUiIHdpZHRoPSIyOC44IiBoZWlnaHQ9IjkiIGZpbGw9IiMwQTdCODMiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIxNTAiIGhlaWdodD0iNCIgZmlsbD0iIzBBN0I4MyIvPjxyZWN0IHg9IjkzMiIgeT0iNzQ5IiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQiIGZpbGw9IiMwQTdCODMiLz48L3N2Zz4="
      },
      {
        "id": "med-02",
        "name": "Biophilic Healing Curves",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0gMCAwIFEgMjgwLjUgMTMzIDU2MSAwIFoiIGZpbGw9IiNCMkRGREIiLz48cGF0aCBkPSJNIDExMjIgMCBRIDg0MS41IDE1MiA1NjEgMCBaIiBmaWxsPSIjODBDQkM0IiBvcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNIDAgNzkzIFEgMzE0LjE2IDY1MC41IDYxNy4xIDc5MyBaIiBmaWxsPSIjQjJERkRCIi8+PHBhdGggZD0iTSAxMTIyIDc5MyBRIDgwNy44Mzk5OTk5OTk5OTk5IDYzMS41IDUwNC45MDAwMDAwMDAwMDAwMyA3OTMgWiIgZmlsbD0iIzgwQ0JDNCIgb3BhY2l0eT0iMC44Ii8+PHJlY3QgeD0iNDQiIHk9IjQwIiB3aWR0aD0iMTAzNCIgaGVpZ2h0PSI3MTMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzREQjZBQyIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjYiLz48L3N2Zz4="
      },
      {
        "id": "med-03",
        "name": "Vector EKG Rhythm Line",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjY5OCIgd2lkdGg9IjExMjIiIGhlaWdodD0iOTUiIGZpbGw9IiNGNUY1RjUiLz48cGF0aCBkPSJNIDQwIDc0NS41IGggMTIwIGwgMjIgLTM0IGwgMjYgNjAgbCAyNCAtMjYgaCA5MCBsIDIyIC0zNCBsIDI2IDYwIGwgMjQgLTI2IGggMTIwIGwgMjIgLTM0IGwgMjYgNjAgbCAyNCAtMjYgaCAxMjAgbCAyMiAtMzQgbCAyNiA2MCBsIDI0IC0yNiBoIDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRTUzOTM1IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRTUzOTM1Ii8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjM5Mi43IiBoZWlnaHQ9IjEwIiBmaWxsPSIjMUMxQzFDIi8+PC9zdmc+"
      },
      {
        "id": "med-04",
        "name": "Sterile Geometric Capsule",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiByeD0iMTUwIiByeT0iMTUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDk2ODgiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjU2IiB5PSI1NiIgd2lkdGg9IjEwMTAiIGhlaWdodD0iNjgxIiByeD0iMTM4IiByeT0iMTM4IiBmaWxsPSJub25lIiBzdHJva2U9IiNCMkRGREIiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjQ5MSIgeT0iNzMwLjUiIHdpZHRoPSIxNDAiIGhlaWdodD0iMzAiIHJ4PSIxNSIgcnk9IjE1IiBmaWxsPSIjMDA5Njg4IiBvcGFjaXR5PSIwLjkiLz48cmVjdCB4PSI0OTEiIHk9IjczMC41IiB3aWR0aD0iNzAiIGhlaWdodD0iMzAiIHJ4PSIxNSIgcnk9IjE1IiBmaWxsPSIjQjJERkRCIi8+PC9zdmc+"
      },
      {
        "id": "med-05",
        "name": "Stylized DNA Helix",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0gMzQgNjAgQyA3NCAyMDAsIC02IDM0MCwgMzQgNDgwIEMgNzQgNjIwLCAtNiA3NDAsIDM0IDc0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTk3NkQyIiBzdHJva2Utd2lkdGg9IjMiLz48cGF0aCBkPSJNIDM0IDYwIEMgLTYgMjAwLCA3NCAzNDAsIDM0IDQ4MCBDIC02IDYyMCwgNzQgNzQwLCAzNCA3NDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY0QjVGNiIgc3Ryb2tlLXdpZHRoPSIzIi8+PGxpbmUgeDE9IjE4IiB5MT0iMTEwIiB4Mj0iNTAiIHkyPSIxMTAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iMjAwIiB4Mj0iNTAiIHkyPSIyMDAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iMjkwIiB4Mj0iNTAiIHkyPSIyOTAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iMzgwIiB4Mj0iNTAiIHkyPSIzODAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iNDcwIiB4Mj0iNTAiIHkyPSI0NzAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iNTYwIiB4Mj0iNTAiIHkyPSI1NjAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjE4IiB5MT0iNjUwIiB4Mj0iNTAiIHkyPSI2NTAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAxMDg4IDYwIEMgMTA0OCAyMDAsIDExMjggMzQwLCAxMDg4IDQ4MCBDIDEwNDggNjIwLCAxMTI4IDc0MCwgMTA4OCA3NDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzE5NzZEMiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHBhdGggZD0iTSAxMDg4IDYwIEMgMTEyOCAyMDAsIDEwNDggMzQwLCAxMDg4IDQ4MCBDIDExMjggNjIwLCAxMDQ4IDc0MCwgMTA4OCA3NDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY0QjVGNiIgc3Ryb2tlLXdpZHRoPSIzIi8+PGxpbmUgeDE9IjEwNzIiIHkxPSIxMTAiIHgyPSIxMTA0IiB5Mj0iMTEwIiBzdHJva2U9IiM5MENBRjkiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxMDcyIiB5MT0iMjAwIiB4Mj0iMTEwNCIgeTI9IjIwMCIgc3Ryb2tlPSIjOTBDQUY5IiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTA3MiIgeTE9IjI5MCIgeDI9IjExMDQiIHkyPSIyOTAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjEwNzIiIHkxPSIzODAiIHgyPSIxMTA0IiB5Mj0iMzgwIiBzdHJva2U9IiM5MENBRjkiIHN0cm9rZS13aWR0aD0iMiIvPjxsaW5lIHgxPSIxMDcyIiB5MT0iNDcwIiB4Mj0iMTEwNCIgeTI9IjQ3MCIgc3Ryb2tlPSIjOTBDQUY5IiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iMTA3MiIgeTE9IjU2MCIgeDI9IjExMDQiIHkyPSI1NjAiIHN0cm9rZT0iIzkwQ0FGOSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGxpbmUgeDE9IjEwNzIiIHkxPSI2NTAiIHgyPSIxMTA0IiB5Mj0iNjUwIiBzdHJva2U9IiM5MENBRjkiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjYwIiB5PSI0MCIgd2lkdGg9IjEwMDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiMxOTc2RDIiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+"
      },
      {
        "id": "med-06",
        "name": "Pharmaceutical Color Blocks",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjYwIiB5PSI0MCIgd2lkdGg9Ijc4IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iI0IzRTVGQyIvPjxyZWN0IHg9IjYwIiB5PSI0MCIgd2lkdGg9IjM5IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC42NSIvPjxyZWN0IHg9IjE2MCIgeT0iNDAiIHdpZHRoPSI3OCIgaGVpZ2h0PSIzNCIgcng9IjE3IiByeT0iMTciIGZpbGw9IiM4MUQ0RkEiLz48cmVjdCB4PSIxNjAiIHk9IjQwIiB3aWR0aD0iMzkiIGhlaWdodD0iMzQiIHJ4PSIxNyIgcnk9IjE3IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjY1Ii8+PHJlY3QgeD0iMjYwIiB5PSI0MCIgd2lkdGg9Ijc4IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iIzRGQzNGNyIvPjxyZWN0IHg9IjI2MCIgeT0iNDAiIHdpZHRoPSIzOSIgaGVpZ2h0PSIzNCIgcng9IjE3IiByeT0iMTciIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNjUiLz48cmVjdCB4PSIzNjAiIHk9IjQwIiB3aWR0aD0iNzgiIGhlaWdodD0iMzQiIHJ4PSIxNyIgcnk9IjE3IiBmaWxsPSIjMjlCNkY2Ii8+PHJlY3QgeD0iMzYwIiB5PSI0MCIgd2lkdGg9IjM5IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC42NSIvPjxyZWN0IHg9IjQ2MCIgeT0iNDAiIHdpZHRoPSI3OCIgaGVpZ2h0PSIzNCIgcng9IjE3IiByeT0iMTciIGZpbGw9IiMwMzlCRTUiLz48cmVjdCB4PSI0NjAiIHk9IjQwIiB3aWR0aD0iMzkiIGhlaWdodD0iMzQiIHJ4PSIxNyIgcnk9IjE3IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjY1Ii8+PHJlY3QgeD0iNjAiIHk9IjcxOSIgd2lkdGg9Ijc4IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iIzAzOUJFNSIvPjxyZWN0IHg9IjYwIiB5PSI3MTkiIHdpZHRoPSIzOSIgaGVpZ2h0PSIzNCIgcng9IjE3IiByeT0iMTciIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNjUiLz48cmVjdCB4PSIxNjAiIHk9IjcxOSIgd2lkdGg9Ijc4IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHg9IjE2MCIgeT0iNzE5IiB3aWR0aD0iMzkiIGhlaWdodD0iMzQiIHJ4PSIxNyIgcnk9IjE3IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjY1Ii8+PHJlY3QgeD0iMjYwIiB5PSI3MTkiIHdpZHRoPSI3OCIgaGVpZ2h0PSIzNCIgcng9IjE3IiByeT0iMTciIGZpbGw9IiM0RkMzRjciLz48cmVjdCB4PSIyNjAiIHk9IjcxOSIgd2lkdGg9IjM5IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC42NSIvPjxyZWN0IHg9IjM2MCIgeT0iNzE5IiB3aWR0aD0iNzgiIGhlaWdodD0iMzQiIHJ4PSIxNyIgcnk9IjE3IiBmaWxsPSIjODFENEZBIi8+PHJlY3QgeD0iMzYwIiB5PSI3MTkiIHdpZHRoPSIzOSIgaGVpZ2h0PSIzNCIgcng9IjE3IiByeT0iMTciIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNjUiLz48cmVjdCB4PSI0NjAiIHk9IjcxOSIgd2lkdGg9Ijc4IiBoZWlnaHQ9IjM0IiByeD0iMTciIHJ5PSIxNyIgZmlsbD0iI0IzRTVGQyIvPjxyZWN0IHg9IjQ2MCIgeT0iNzE5IiB3aWR0aD0iMzkiIGhlaWdodD0iMzQiIHJ4PSIxNyIgcnk9IjE3IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjY1Ii8+PHJlY3QgeD0iNDIiIHk9IjkyIiB3aWR0aD0iMTAzOCIgaGVpZ2h0PSI2MDkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAyODhEMSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4="
      },
      {
        "id": "med-07",
        "name": "Minimalist Caduceus Emblem",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZBRkFGQSIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMjIiIGhlaWdodD0iNjkzIiBmaWxsPSJub25lIiBzdHJva2U9IiMzNzQ3NEYiIHN0cm9rZS13aWR0aD0iMyIvPjxyZWN0IHg9IjYyIiB5PSI2MiIgd2lkdGg9Ijk5OCIgaGVpZ2h0PSI2NjkiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0IwQkVDNSIgc3Ryb2tlLXdpZHRoPSIwLjc1Ii8+PGNpcmNsZSBjeD0iNTYxIiBjeT0iNzM5IiByPSIyNiIgZmlsbD0iI0ZBRkFGQSIgc3Ryb2tlPSIjMzc0NzRGIiBzdHJva2Utd2lkdGg9IjIiLz48bGluZSB4MT0iNTYxIiB5MT0iNzIzIiB4Mj0iNTYxIiB5Mj0iNzU1IiBzdHJva2U9IiMzNzQ3NEYiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGQ9Ik0gNTUwIDcyOSBxIDIyIDggMCAxNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzc0NzRGIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDU3MiA3MjkgcSAtMjIgOCAwIDE2IiBmaWxsPSJub25lIiBzdHJva2U9IiMzNzQ3NEYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg=="
      },
      {
        "id": "med-08",
        "name": "Mental Health Soft Vectors",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEzMCIgZmlsbD0iI0U4RUFGNiIgb3BhY2l0eT0iMC45Ii8+PGNpcmNsZSBjeD0iMTEwMiIgY3k9IjQwIiByPSIxNTAiIGZpbGw9IiNFMUY1RkUiIG9wYWNpdHk9IjAuOSIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iNzczIiByPSIxNDAiIGZpbGw9IiNGM0U1RjUiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIxMDkyIiBjeT0iNzYzIiByPSIxMjAiIGZpbGw9IiNFOEY1RTkiIG9wYWNpdHk9IjAuODUiLz48cmVjdCB4PSI3MCIgeT0iNzgiIHdpZHRoPSI5ODIiIGhlaWdodD0iNjM3IiBmaWxsPSJub25lIiBzdHJva2U9IiNCMzlEREIiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+PC9zdmc+"
      },
      {
        "id": "med-09",
        "name": "Emergency Response Contrast",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMTIyIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRDMyRjJGIi8+PHJlY3QgeD0iMCIgeT0iNzEzIiB3aWR0aD0iMTEyMiIgaGVpZ2h0PSI4MCIgZmlsbD0iI0QzMkYyRiIvPjxyZWN0IHg9Ijc1IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iNjUiIHk9IjM1IiB3aWR0aD0iMzAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIxMDM3IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTAyNyIgeT0iMzUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9Ijc1IiB5PSI3MzgiIHdpZHRoPSIxMCIgaGVpZ2h0PSIzMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjY1IiB5PSI3NDgiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjEwMzciIHk9IjczOCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTAyNyIgeT0iNzQ4IiB3aWR0aD0iMzAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIwIiB5PSI4MCIgd2lkdGg9IjExMjIiIGhlaWdodD0iNiIgZmlsbD0iI0I3MUMxQyIvPjxyZWN0IHg9IjAiIHk9IjcwNyIgd2lkdGg9IjExMjIiIGhlaWdodD0iNiIgZmlsbD0iI0I3MUMxQyIvPjwvc3ZnPg=="
      },
      {
        "id": "med-10",
        "name": "Modern Medical Architecture",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI1OCIgaGVpZ2h0PSI3OTMiIGZpbGw9IiNGMEY0RjgiLz48cmVjdCB4PSI1OCIgeT0iMCIgd2lkdGg9IjEwIiBoZWlnaHQ9Ijc5MyIgZmlsbD0iIzAwODM4RiIvPjxyZWN0IHg9Ijc4IiB5PSIwIiB3aWR0aD0iMyIgaGVpZ2h0PSI3OTMiIGZpbGw9IiNCMEJFQzUiLz48cmVjdCB4PSI4OCIgeT0iMzAiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjYiIGZpbGw9IiNGMEY0RjgiLz48cmVjdCB4PSI4OCIgeT0iMzAiIHdpZHRoPSI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjMDA4MzhGIi8+PHJlY3QgeD0iODIyIiB5PSI3MzciIHdpZHRoPSIyMTIiIGhlaWdodD0iMjYiIGZpbGw9IiNGMEY0RjgiLz48cmVjdCB4PSIxMDI4IiB5PSI3MzciIHdpZHRoPSI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjMDA4MzhGIi8+PHJlY3QgeD0iODgiIHk9IjEyMCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PHJlY3QgeD0iODgiIHk9IjIxMCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PHJlY3QgeD0iODgiIHk9IjMwMCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PHJlY3QgeD0iODgiIHk9IjM5MCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PHJlY3QgeD0iODgiIHk9IjQ4MCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PHJlY3QgeD0iODgiIHk9IjU3MCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PHJlY3QgeD0iODgiIHk9IjY2MCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiBmaWxsPSIjRUNFRkYxIi8+PC9zdmc+"
      }
    ]
  },
  {
    "name": "Kids & Early Learning",
    "orientation": "landscape",
    "items": [
      {
        "id": "kid-01",
        "name": "Playful Scalloped Edge",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzA2RDZBMCIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiByeD0iMzAiIHJ5PSIzMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjEwNjIiIGhlaWdodD0iNzMzIiByeD0iMzAiIHJ5PSIzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZEMTY2IiBzdHJva2Utd2lkdGg9IjgiLz48cmVjdCB4PSI1MiIgeT0iNTIiIHdpZHRoPSIxMDE4IiBoZWlnaHQ9IjY4OSIgcng9IjIyIiByeT0iMjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0VGNDc2RiIgc3Ryb2tlLXdpZHRoPSIzIi8+PGNpcmNsZSBjeD0iNDYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iI0ZGRDE2NiIvPjxjaXJjbGUgY3g9IjQ2IiBjeT0iNzc3IiByPSI3IiBmaWxsPSIjMTE4QUIyIi8+PGNpcmNsZSBjeD0iMTA2IiBjeT0iMTYiIHI9IjciIGZpbGw9IiNFRjQ3NkYiLz48Y2lyY2xlIGN4PSIxMDYiIGN5PSI3NzciIHI9IjciIGZpbGw9IiNGRjlGMUMiLz48Y2lyY2xlIGN4PSIxNjYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iIzExOEFCMiIvPjxjaXJjbGUgY3g9IjE2NiIgY3k9Ijc3NyIgcj0iNyIgZmlsbD0iI0ZGRDE2NiIvPjxjaXJjbGUgY3g9IjIyNiIgY3k9IjE2IiByPSI3IiBmaWxsPSIjRkY5RjFDIi8+PGNpcmNsZSBjeD0iMjI2IiBjeT0iNzc3IiByPSI3IiBmaWxsPSIjRUY0NzZGIi8+PGNpcmNsZSBjeD0iMjg2IiBjeT0iMTYiIHI9IjciIGZpbGw9IiNGRkQxNjYiLz48Y2lyY2xlIGN4PSIyODYiIGN5PSI3NzciIHI9IjciIGZpbGw9IiMxMThBQjIiLz48Y2lyY2xlIGN4PSIzNDYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iI0VGNDc2RiIvPjxjaXJjbGUgY3g9IjM0NiIgY3k9Ijc3NyIgcj0iNyIgZmlsbD0iI0ZGOUYxQyIvPjxjaXJjbGUgY3g9IjQwNiIgY3k9IjE2IiByPSI3IiBmaWxsPSIjMTE4QUIyIi8+PGNpcmNsZSBjeD0iNDA2IiBjeT0iNzc3IiByPSI3IiBmaWxsPSIjRkZEMTY2Ii8+PGNpcmNsZSBjeD0iNDY2IiBjeT0iMTYiIHI9IjciIGZpbGw9IiNGRjlGMUMiLz48Y2lyY2xlIGN4PSI0NjYiIGN5PSI3NzciIHI9IjciIGZpbGw9IiNFRjQ3NkYiLz48Y2lyY2xlIGN4PSI1MjYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iI0ZGRDE2NiIvPjxjaXJjbGUgY3g9IjUyNiIgY3k9Ijc3NyIgcj0iNyIgZmlsbD0iIzExOEFCMiIvPjxjaXJjbGUgY3g9IjU4NiIgY3k9IjE2IiByPSI3IiBmaWxsPSIjRUY0NzZGIi8+PGNpcmNsZSBjeD0iNTg2IiBjeT0iNzc3IiByPSI3IiBmaWxsPSIjRkY5RjFDIi8+PGNpcmNsZSBjeD0iNjQ2IiBjeT0iMTYiIHI9IjciIGZpbGw9IiMxMThBQjIiLz48Y2lyY2xlIGN4PSI2NDYiIGN5PSI3NzciIHI9IjciIGZpbGw9IiNGRkQxNjYiLz48Y2lyY2xlIGN4PSI3MDYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iI0ZGOUYxQyIvPjxjaXJjbGUgY3g9IjcwNiIgY3k9Ijc3NyIgcj0iNyIgZmlsbD0iI0VGNDc2RiIvPjxjaXJjbGUgY3g9Ijc2NiIgY3k9IjE2IiByPSI3IiBmaWxsPSIjRkZEMTY2Ii8+PGNpcmNsZSBjeD0iNzY2IiBjeT0iNzc3IiByPSI3IiBmaWxsPSIjMTE4QUIyIi8+PGNpcmNsZSBjeD0iODI2IiBjeT0iMTYiIHI9IjciIGZpbGw9IiNFRjQ3NkYiLz48Y2lyY2xlIGN4PSI4MjYiIGN5PSI3NzciIHI9IjciIGZpbGw9IiNGRjlGMUMiLz48Y2lyY2xlIGN4PSI4ODYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iIzExOEFCMiIvPjxjaXJjbGUgY3g9Ijg4NiIgY3k9Ijc3NyIgcj0iNyIgZmlsbD0iI0ZGRDE2NiIvPjxjaXJjbGUgY3g9Ijk0NiIgY3k9IjE2IiByPSI3IiBmaWxsPSIjRkY5RjFDIi8+PGNpcmNsZSBjeD0iOTQ2IiBjeT0iNzc3IiByPSI3IiBmaWxsPSIjRUY0NzZGIi8+PGNpcmNsZSBjeD0iMTAwNiIgY3k9IjE2IiByPSI3IiBmaWxsPSIjRkZEMTY2Ii8+PGNpcmNsZSBjeD0iMTAwNiIgY3k9Ijc3NyIgcj0iNyIgZmlsbD0iIzExOEFCMiIvPjxjaXJjbGUgY3g9IjEwNjYiIGN5PSIxNiIgcj0iNyIgZmlsbD0iI0VGNDc2RiIvPjxjaXJjbGUgY3g9IjEwNjYiIGN5PSI3NzciIHI9IjciIGZpbGw9IiNGRjlGMUMiLz48L3N2Zz4="
      },
      {
        "id": "kid-02",
        "name": "Naive Art Sky Vector",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzg3Q0VFQiIvPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjUwIiByPSIyMiIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjE3NCIgY3k9IjU2IiByPSIxNyIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjEyNiIgY3k9IjU4IiByPSIxNSIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjkyMiIgY3k9IjQ0IiByPSIxOC43IiBmaWxsPSIjZmZmZmZmIi8+PGNpcmNsZSBjeD0iOTQyLjQiIGN5PSI0OS4xIiByPSIxNC40NSIgZmlsbD0iI2ZmZmZmZiIvPjxjaXJjbGUgY3g9IjkwMS42IiBjeT0iNTAuOCIgcj0iMTIuNzUiIGZpbGw9IiNmZmZmZmYiLz48cG9seWdvbiBwb2ludHM9IjU2MSwxNCA1NzQsNDIgNTQ4LDQyIiBmaWxsPSIjRkZEMTY2Ii8+PHBhdGggZD0iTSAwIDY5OCBRIDE0MCA2NzIgMjgwIDY5OCBUIDU2MCA2OTggVCA4NDAgNjk4IFQgMTEyMiA2OTggTCAxMTIyIDc5MyBMIDAgNzkzIFoiIGZpbGw9IiM4QkMzNEEiLz48L3N2Zz4="
      },
      {
        "id": "kid-03",
        "name": "Crayon Zig-Zag Vector",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0gMCAyNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRUY0NzZGIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNIDAgNDYgbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZGRDE2NiIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTSAwIDY0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMThBQjIiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxwYXRoIGQ9Ik0gMCA3NjkgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQgbCA0MCAtMjQgbCA0MCAyNCBsIDQwIC0yNCBsIDQwIDI0IGwgNDAgLTI0IGwgNDAgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzExOEFCMiIgc3Ryb2tlLXdpZHRoPSIxMCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0iTSAwIDc0NyBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCBsIDQwIC0xOCBsIDQwIDE4IGwgNDAgLTE4IGwgNDAgMTggbCA0MCAtMTggbCA0MCAxOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZEMTY2IiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNIDAgNzI5IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IGwgNDAgLTE0IGwgNDAgMTQgbCA0MCAtMTQgbCA0MCAxNCBsIDQwIC0xNCBsIDQwIDE0IiBmaWxsPSJub25lIiBzdHJva2U9IiNFRjQ3NkYiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg=="
      },
      {
        "id": "kid-04",
        "name": "Flat Confetti Explosion",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjYwOC40NSIgeT0iNzgyLjc2IiB3aWR0aD0iMTEuMzgiIGhlaWdodD0iMTEuMzgiIGZpbGw9IiMwNkQ2QTAiIHRyYW5zZm9ybT0icm90YXRlKDc4IDYxNC4xNCA3ODguNDUpIi8+PHJlY3QgeD0iMTAyNyIgeT0iNTkuMTMiIHdpZHRoPSIxMy45OCIgaGVpZ2h0PSIxMy45OCIgZmlsbD0iI0ZGRDE2NiIgdHJhbnNmb3JtPSJyb3RhdGUoMTcgMTAzMy45OSA2Ni4xMikiLz48cmVjdCB4PSIxMTEzLjg4IiB5PSI0Ni44MSIgd2lkdGg9IjkuMDciIGhlaWdodD0iOS4wNyIgZmlsbD0iI0VGNDc2RiIgdHJhbnNmb3JtPSJyb3RhdGUoNiAxMTE4LjQxIDUxLjM1KSIvPjxyZWN0IHg9Ijc1NS44NyIgeT0iNzMyLjc0IiB3aWR0aD0iMTIuNDgiIGhlaWdodD0iMTIuNDgiIGZpbGw9IiMxMThBQjIiIHRyYW5zZm9ybT0icm90YXRlKDUgNzYyLjExIDczOC45OCkiLz48cmVjdCB4PSIxNjQuMiIgeT0iMjEuNTciIHdpZHRoPSIxMS43MyIgaGVpZ2h0PSIxMS43MyIgZmlsbD0iIzExOEFCMiIgdHJhbnNmb3JtPSJyb3RhdGUoNzcgMTcwLjA2IDI3LjQ0KSIvPjxyZWN0IHg9IjgzMy4wOSIgeT0iMjguNyIgd2lkdGg9IjguNzEiIGhlaWdodD0iOC43MSIgZmlsbD0iI0VGNDc2RiIgdHJhbnNmb3JtPSJyb3RhdGUoNTkgODM3LjQ1IDMzLjA2KSIvPjxyZWN0IHg9IjI2Ni4zMiIgeT0iNjguNCIgd2lkdGg9IjEwLjczIiBoZWlnaHQ9IjEwLjczIiBmaWxsPSIjMDZENkEwIiB0cmFuc2Zvcm09InJvdGF0ZSg0MCAyNzEuNjggNzMuNzYpIi8+PHJlY3QgeD0iNjkyLjkxIiB5PSI3MzkuMjQiIHdpZHRoPSI3Ljk5IiBoZWlnaHQ9IjcuOTkiIGZpbGw9IiMwNkQ2QTAiIHRyYW5zZm9ybT0icm90YXRlKDM1IDY5Ni45MSA3NDMuMjQpIi8+PHJlY3QgeD0iNjkyLjY1IiB5PSIwLjI5IiB3aWR0aD0iOC4yNyIgaGVpZ2h0PSI4LjI3IiBmaWxsPSIjMTE4QUIyIiB0cmFuc2Zvcm09InJvdGF0ZSg2OCA2OTYuNzggNC40MikiLz48cmVjdCB4PSI0MDguNDUiIHk9IjAuODMiIHdpZHRoPSI5LjM3IiBoZWlnaHQ9IjkuMzciIGZpbGw9IiNFRjQ3NkYiIHRyYW5zZm9ybT0icm90YXRlKDg5IDQxMy4xNCA1LjUyKSIvPjxyZWN0IHg9IjY2NS4yNCIgeT0iNzEyLjY5IiB3aWR0aD0iMTEuNzciIGhlaWdodD0iMTEuNzciIGZpbGw9IiNGRjlGMUMiIHRyYW5zZm9ybT0icm90YXRlKDIzIDY3MS4xMiA3MTguNTgpIi8+PHJlY3QgeD0iNTY4LjM5IiB5PSI3NDguNTkiIHdpZHRoPSIxMi4yMyIgaGVpZ2h0PSIxMi4yMyIgZmlsbD0iIzA2RDZBMCIgdHJhbnNmb3JtPSJyb3RhdGUoODIgNTc0LjUgNzU0LjcpIi8+PHJlY3QgeD0iMzgyLjI0IiB5PSIzOS4xMiIgd2lkdGg9IjcuMDkiIGhlaWdodD0iNy4wOSIgZmlsbD0iIzExOEFCMiIgdHJhbnNmb3JtPSJyb3RhdGUoNzMgMzg1Ljc4IDQyLjY2KSIvPjxyZWN0IHg9IjEwMjkuMTciIHk9IjcyMy4wOCIgd2lkdGg9IjcuOTYiIGhlaWdodD0iNy45NiIgZmlsbD0iIzExOEFCMiIgdHJhbnNmb3JtPSJyb3RhdGUoMTAgMTAzMy4xNSA3MjcuMDYpIi8+PHJlY3QgeD0iNjIzLjc3IiB5PSI3MzkuMDQiIHdpZHRoPSI5LjYiIGhlaWdodD0iOS42IiBmaWxsPSIjRkY5RjFDIiB0cmFuc2Zvcm09InJvdGF0ZSg2IDYyOC41NyA3NDMuODMpIi8+PHJlY3QgeD0iNTcuNjIiIHk9IjcxMC4xNCIgd2lkdGg9IjkuODEiIGhlaWdodD0iOS44MSIgZmlsbD0iIzA2RDZBMCIgdHJhbnNmb3JtPSJyb3RhdGUoNzQgNjIuNTMgNzE1LjA0KSIvPjxyZWN0IHg9IjE0LjMiIHk9IjMyMi41NiIgd2lkdGg9IjEyLjUyIiBoZWlnaHQ9IjEyLjUyIiBmaWxsPSIjMDZENkEwIiB0cmFuc2Zvcm09InJvdGF0ZSgxNiAyMC41NiAzMjguODIpIi8+PHJlY3QgeD0iMTIyLjY2IiB5PSI3ODUuMTgiIHdpZHRoPSI3LjEyIiBoZWlnaHQ9IjcuMTIiIGZpbGw9IiNGRkQxNjYiIHRyYW5zZm9ybT0icm90YXRlKDggMTI2LjIyIDc4OC43NCkiLz48cmVjdCB4PSI3NjEuNDMiIHk9IjI1LjEiIHdpZHRoPSI2LjQ5IiBoZWlnaHQ9IjYuNDkiIGZpbGw9IiNFRjQ3NkYiIHRyYW5zZm9ybT0icm90YXRlKDEwIDc2NC42OCAyOC4zNCkiLz48cmVjdCB4PSI1NTMuMDQiIHk9IjQ4LjgyIiB3aWR0aD0iMTMuODkiIGhlaWdodD0iMTMuODkiIGZpbGw9IiNGRkQxNjYiIHRyYW5zZm9ybT0icm90YXRlKDEzIDU1OS45OCA1NS43NikiLz48cmVjdCB4PSIxMDk5Ljg0IiB5PSI1NjMuMDIiIHdpZHRoPSIxMC43OCIgaGVpZ2h0PSIxMC43OCIgZmlsbD0iI0VGNDc2RiIgdHJhbnNmb3JtPSJyb3RhdGUoMjUgMTEwNS4yMyA1NjguNDEpIi8+PHJlY3QgeD0iNTU4LjYyIiB5PSI2OSIgd2lkdGg9IjExLjgxIiBoZWlnaHQ9IjExLjgxIiBmaWxsPSIjMTE4QUIyIiB0cmFuc2Zvcm09InJvdGF0ZSg1IDU2NC41MiA3NC45KSIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiBmaWxsPSJub25lIiBzdHJva2U9IiNFMEUwRTAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg=="
      },
      {
        "id": "kid-05",
        "name": "Geometric Jungle Safari",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0YxRjhFOSIvPjxwYXRoIGQ9Ik0gMCAwIEMgMTIwIDEwLCAxMjAgMTAwLCAwIDEzMCBaIiBmaWxsPSIjNENBRjUwIi8+PHBhdGggZD0iTSAxMTIyIDAgQyAxMDAyIDEwLCAxMDAyIDEwMCwgMTEyMiAxMzAgWiIgZmlsbD0iIzY2QkI2QSIvPjxwYXRoIGQ9Ik0gMCA3OTMgQyAxMjAgNzgzLCAxMjAgNjkzLCAwIDY2MyBaIiBmaWxsPSIjNjZCQjZBIi8+PHBhdGggZD0iTSAxMTIyIDc5MyBDIDEwMDIgNzgzLCAxMDAyIDY5MywgMTEyMiA2NjMgWiIgZmlsbD0iIzRDQUY1MCIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9IjQ2IiByPSIyMCIgZmlsbD0iI0ZGQjMwMCIvPjxyZWN0IHg9IjY4IiB5PSI3NCIgd2lkdGg9Ijk4NiIgaGVpZ2h0PSI2NDUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzhENkU2MyIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+"
      },
      {
        "id": "kid-06",
        "name": "Flat Vector Cosmos",
        "textScheme": "light",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFBMjM3RSIvPjxjaXJjbGUgY3g9IjgwIiBjeT0iNTIiIHI9IjIyIiBmaWxsPSIjRkY5ODAwIi8+PGVsbGlwc2UgY3g9IjgwIiBjeT0iNTIiIHJ4PSIzNy40IiByeT0iOS45IiBmaWxsPSJub25lIiBzdHJva2U9IiNCMEJFQzUiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEwMzIiIGN5PSI3NDEiIHI9IjE4IiBmaWxsPSIjNDJBNUY1Ii8+PGVsbGlwc2UgY3g9IjEwMzIiIGN5PSI3NDEiIHJ4PSIzMC42IiByeT0iOC4xIiBmaWxsPSJub25lIiBzdHJva2U9IiNCMEJFQzUiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjAiIGN5PSIyMCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMCIgY3k9Ijc3MyIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMjguMDUiIGN5PSI3MyIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMjguMDUiIGN5PSI3MzYiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjU2LjEiIGN5PSI3MSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNTYuMSIgY3k9Ijc1NCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iODQuMTUiIGN5PSI2OSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iODQuMTUiIGN5PSI3NzIiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjExMi4yIiBjeT0iNjciIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjExMi4yIiBjeT0iNzM1IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIxNDAuMjUiIGN5PSI2NSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMTQwLjI1IiBjeT0iNzUzIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIxNjguMyIgY3k9IjYzIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIxNjguMyIgY3k9Ijc3MSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMTk2LjM1IiBjeT0iNjEiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjE5Ni4zNSIgY3k9IjczNCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMjI0LjQiIGN5PSI1OSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMjI0LjQiIGN5PSI3NTIiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjI1Mi40NSIgY3k9IjU3IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIyNTIuNDUiIGN5PSI3NzAiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjI4MC41IiBjeT0iNTUiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjI4MC41IiBjeT0iNzMzIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIzMDguNTUiIGN5PSI1MyIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMzA4LjU1IiBjeT0iNzUxIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIzMzYuNiIgY3k9IjUxIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIzMzYuNiIgY3k9Ijc2OSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMzY0LjY1IiBjeT0iNDkiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjM2NC42NSIgY3k9IjczMiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMzkyLjciIGN5PSI0NyIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMzkyLjciIGN5PSI3NTAiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjQyMC43NSIgY3k9IjQ1IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI0MjAuNzUiIGN5PSI3NjgiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjQ0OC44IiBjeT0iNDMiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjQ0OC44IiBjeT0iNzMxIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI0NzYuODUiIGN5PSI0MSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNDc2Ljg1IiBjeT0iNzQ5IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI1MDQuOSIgY3k9IjM5IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI1MDQuOSIgY3k9Ijc2NyIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNTMyLjk1IiBjeT0iMzciIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjUzMi45NSIgY3k9IjczMCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNTYxIiBjeT0iMzUiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjU2MSIgY3k9Ijc0OCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNTg5LjA1IiBjeT0iMzMiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjU4OS4wNSIgY3k9Ijc2NiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNjE3LjEiIGN5PSIzMSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNjE3LjEiIGN5PSI3MjkiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjY0NS4xNSIgY3k9IjI5IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI2NDUuMTUiIGN5PSI3NDciIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjY3My4yIiBjeT0iMjciIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjY3My4yIiBjeT0iNzY1IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI3MDEuMjUiIGN5PSIyNSIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNzAxLjI1IiBjeT0iNzI4IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI3MjkuMyIgY3k9IjIzIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI3MjkuMyIgY3k9Ijc0NiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNzU3LjM1IiBjeT0iMjEiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9Ijc1Ny4zNSIgY3k9Ijc2NCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNzg1LjQiIGN5PSI3NCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iNzg1LjQiIGN5PSI3MjciIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjgxMy40NSIgY3k9IjcyIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI4MTMuNDUiIGN5PSI3NDUiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9Ijg0MS41IiBjeT0iNzAiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9Ijg0MS41IiBjeT0iNzYzIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI4NjkuNTUiIGN5PSI2OCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iODY5LjU1IiBjeT0iNzI2IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI4OTcuNiIgY3k9IjY2IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI4OTcuNiIgY3k9Ijc0NCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iOTI1LjY1IiBjeT0iNjQiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjkyNS42NSIgY3k9Ijc2MiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iOTUzLjciIGN5PSI2MiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iOTUzLjciIGN5PSI3MjUiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9Ijk4MS43NSIgY3k9IjYwIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSI5ODEuNzUiIGN5PSI3NDMiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjEwMDkuOCIgY3k9IjU4IiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIxMDA5LjgiIGN5PSI3NjEiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjEwMzcuODUiIGN5PSI1NiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMTAzNy44NSIgY3k9IjcyNCIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMTA2NS45IiBjeT0iNTQiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC44NSIvPjxjaXJjbGUgY3g9IjEwNjUuOSIgY3k9Ijc0MiIgcj0iMi41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1Ii8+PGNpcmNsZSBjeD0iMTA5My45NSIgY3k9IjUyIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48Y2lyY2xlIGN4PSIxMDkzLjk1IiBjeT0iNzYwIiByPSIyLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuODUiLz48cmVjdCB4PSI0MCIgeT0iNzgiIHdpZHRoPSIxMDQyIiBoZWlnaHQ9IjYzNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZEMTY2IiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuNyIvPjwvc3ZnPg=="
      },
      {
        "id": "kid-07",
        "name": "Toy Building Blocks",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjAiIHk9IjEyIiB3aWR0aD0iMTI0IiBoZWlnaHQ9IjcyIiBmaWxsPSIjRjQ0MzM2Ii8+PGNpcmNsZSBjeD0iNjIiIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjEzMCIgeT0iMTIiIHdpZHRoPSIxNTQiIGhlaWdodD0iNzIiIGZpbGw9IiNGRkQxNjYiLz48Y2lyY2xlIGN4PSIyMDciIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjI5MCIgeT0iMTIiIHdpZHRoPSIxMjQiIGhlaWdodD0iNzIiIGZpbGw9IiMwNkQ2QTAiLz48Y2lyY2xlIGN4PSIzNTIiIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjQyMCIgeT0iMTIiIHdpZHRoPSIxNTQiIGhlaWdodD0iNzIiIGZpbGw9IiMyMTk2RjMiLz48Y2lyY2xlIGN4PSI0OTciIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjU4MCIgeT0iMTIiIHdpZHRoPSIxMjQiIGhlaWdodD0iNzIiIGZpbGw9IiM5QzI3QjAiLz48Y2lyY2xlIGN4PSI2NDIiIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjcxMCIgeT0iMTIiIHdpZHRoPSIxNTQiIGhlaWdodD0iNzIiIGZpbGw9IiNGNDQzMzYiLz48Y2lyY2xlIGN4PSI3ODciIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9Ijg3MCIgeT0iMTIiIHdpZHRoPSIxMjQiIGhlaWdodD0iNzIiIGZpbGw9IiNGRkQxNjYiLz48Y2lyY2xlIGN4PSI5MzIiIGN5PSIyNiIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjAiIHk9IjcwOSIgd2lkdGg9IjEyNCIgaGVpZ2h0PSI3MiIgZmlsbD0iI0Y0NDMzNiIvPjxjaXJjbGUgY3g9IjYyIiBjeT0iNzIzIiByPSIxMSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iMTMwIiB5PSI3MDkiIHdpZHRoPSIxNTQiIGhlaWdodD0iNzIiIGZpbGw9IiNGRkQxNjYiLz48Y2lyY2xlIGN4PSIyMDciIGN5PSI3MjMiIHI9IjExIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjUiLz48cmVjdCB4PSIyOTAiIHk9IjcwOSIgd2lkdGg9IjEyNCIgaGVpZ2h0PSI3MiIgZmlsbD0iIzA2RDZBMCIvPjxjaXJjbGUgY3g9IjM1MiIgY3k9IjcyMyIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9IjQyMCIgeT0iNzA5IiB3aWR0aD0iMTU0IiBoZWlnaHQ9IjcyIiBmaWxsPSIjMjE5NkYzIi8+PGNpcmNsZSBjeD0iNDk3IiBjeT0iNzIzIiByPSIxMSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iNTgwIiB5PSI3MDkiIHdpZHRoPSIxMjQiIGhlaWdodD0iNzIiIGZpbGw9IiM5QzI3QjAiLz48Y2lyY2xlIGN4PSI2NDIiIGN5PSI3MjMiIHI9IjExIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjUiLz48cmVjdCB4PSI3MTAiIHk9IjcwOSIgd2lkdGg9IjE1NCIgaGVpZ2h0PSI3MiIgZmlsbD0iI0Y0NDMzNiIvPjxjaXJjbGUgY3g9Ijc4NyIgY3k9IjcyMyIgcj0iMTEiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuNSIvPjxyZWN0IHg9Ijg3MCIgeT0iNzA5IiB3aWR0aD0iMTI0IiBoZWlnaHQ9IjcyIiBmaWxsPSIjRkZEMTY2Ii8+PGNpcmNsZSBjeD0iOTMyIiBjeT0iNzIzIiByPSIxMSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iNDAiIHk9IjEwMCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNTkzIiBmaWxsPSJub25lIiBzdHJva2U9IiNCREJEQkQiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWRhc2hhcnJheT0iMTAgOCIvPjwvc3ZnPg=="
      },
      {
        "id": "kid-08",
        "name": "Vector Bunting Flags",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZBRkFGQSIvPjxwYXRoIGQ9Ik0gMCAyNCBRIDU2MSA3NCAxMTIyIDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0MjQyNDIiIHN0cm9rZS13aWR0aD0iMyIvPjxwb2x5Z29uIHBvaW50cz0iLTIyLDI0IDIyLDI0IDAsNjgiIGZpbGw9IiNFRjQ3NkYiLz48cG9seWdvbiBwb2ludHM9IjcxLjUsMzYuOTQgMTE1LjUsMzYuOTQgOTMuNSw4MC45NCIgZmlsbD0iI0ZGRDE2NiIvPjxwb2x5Z29uIHBvaW50cz0iMTY1LDQ5IDIwOSw0OSAxODcsOTMiIGZpbGw9IiMwNkQ2QTAiLz48cG9seWdvbiBwb2ludHM9IjI1OC41LDU5LjM2IDMwMi41LDU5LjM2IDI4MC41LDEwMy4zNiIgZmlsbD0iIzExOEFCMiIvPjxwb2x5Z29uIHBvaW50cz0iMzUyLDY3LjMgMzk2LDY3LjMgMzc0LDExMS4zIiBmaWxsPSIjRkY5RjFDIi8+PHBvbHlnb24gcG9pbnRzPSI0NDUuNSw3Mi4zIDQ4OS41LDcyLjMgNDY3LjUsMTE2LjMiIGZpbGw9IiNFRjQ3NkYiLz48cG9seWdvbiBwb2ludHM9IjUzOSw3NCA1ODMsNzQgNTYxLDExOCIgZmlsbD0iI0ZGRDE2NiIvPjxwb2x5Z29uIHBvaW50cz0iNjMyLjUsNzIuMyA2NzYuNSw3Mi4zIDY1NC41LDExNi4zIiBmaWxsPSIjMDZENkEwIi8+PHBvbHlnb24gcG9pbnRzPSI3MjYsNjcuMyA3NzAsNjcuMyA3NDgsMTExLjMiIGZpbGw9IiMxMThBQjIiLz48cG9seWdvbiBwb2ludHM9IjgxOS41LDU5LjM2IDg2My41LDU5LjM2IDg0MS41LDEwMy4zNiIgZmlsbD0iI0ZGOUYxQyIvPjxwb2x5Z29uIHBvaW50cz0iOTEzLDQ5IDk1Nyw0OSA5MzUsOTMiIGZpbGw9IiNFRjQ3NkYiLz48cG9seWdvbiBwb2ludHM9IjEwMDYuNSwzNi45NCAxMDUwLjUsMzYuOTQgMTAyOC41LDgwLjk0IiBmaWxsPSIjRkZEMTY2Ii8+PHBvbHlnb24gcG9pbnRzPSIxMTAwLDI0IDExNDQsMjQgMTEyMiw2OCIgZmlsbD0iIzA2RDZBMCIvPjxwYXRoIGQ9Ik0gMCA3NTMgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgcSAyMCAtMjIgNDAgMCBxIDIwIDIyIDQwIDAgTCAxMTIyIDc5MyBMIDAgNzkzIFoiIGZpbGw9IiMwNkQ2QTAiIG9wYWNpdHk9IjAuODUiLz48L3N2Zz4="
      },
      {
        "id": "kid-09",
        "name": "Stylized Flat Ocean",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0UwRjdGQSIvPjxwYXRoIGQ9Ik0gMCA2NjggcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgcSAzMCAtMjAgNjAgMCBxIDMwIDIwIDYwIDAgTCAxMTIyIDc5MyBMIDAgNzkzIFoiIGZpbGw9IiM0REQwRTEiIG9wYWNpdHk9IjAuNzUiLz48cGF0aCBkPSJNIDAgNjk4IHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIEwgMTEyMiA3OTMgTCAwIDc5MyBaIiBmaWxsPSIjMjZDNkRBIiBvcGFjaXR5PSIwLjkiLz48cGF0aCBkPSJNIDAgNzQ3IHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIHEgMzAgLTIwIDYwIDAgcSAzMCAyMCA2MCAwIEwgMTEyMiA3OTMgTCAwIDc5MyBaIiBmaWxsPSIjMDBBQ0MxIiBvcGFjaXR5PSIxIi8+PGNpcmNsZSBjeD0iOTAiIGN5PSI0OCIgcj0iMzAiIGZpbGw9IiNGRkQxNjYiLz48cGF0aCBkPSJNIDQwMy45MTk5OTk5OTk5OTk5NiA2MiBxIDQwIC0zMCA4MCAwIHEgMjAgMTQgNDAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNEZDM0Y3IiBzdHJva2Utd2lkdGg9IjMiIG9wYWNpdHk9IjAuOCIvPjxyZWN0IHg9IjQwIiB5PSI5NiIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNTkzIiBmaWxsPSJub25lIiBzdHJva2U9IiM0REQwRTEiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg=="
      },
      {
        "id": "kid-10",
        "name": "Vector Animal Tracks",
        "url": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMTIyIDc5MyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0ZGRjhFMSIvPjxyZWN0IHg9IjQwIiB5PSI0MCIgd2lkdGg9IjEwNDIiIGhlaWdodD0iNzEzIiByeD0iMjAiIHJ5PSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOEQ2RTYzIiBzdHJva2Utd2lkdGg9IjgiLz48cmVjdCB4PSI2MCIgeT0iNjAiIHdpZHRoPSIxMDAyIiBoZWlnaHQ9IjY3MyIgcng9IjE0IiByeT0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0Q3Q0NDOCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSIxMiA4Ii8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iMjIiIHI9IjExIiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMTA5IiBjeT0iMTAiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSIxMjAiIGN5PSI2IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMTMxIiBjeT0iMTAiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSI5NjIiIGN5PSIyMiIgcj0iMTEiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSI5NTEiIGN5PSIxMCIgcj0iNiIgZmlsbD0iIzhENkU2MyIgb3BhY2l0eT0iMC43NSIvPjxjaXJjbGUgY3g9Ijk2MiIgY3k9IjYiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSI5NzMiIGN5PSIxMCIgcj0iNiIgZmlsbD0iIzhENkU2MyIgb3BhY2l0eT0iMC43NSIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9Ijc3MSIgcj0iMTEiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSIxODkiIGN5PSI3NTkiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSI3NTUiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSIyMTEiIGN5PSI3NTkiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSI4ODIiIGN5PSI3NzEiIHI9IjExIiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iODcxIiBjeT0iNzU5IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iODgyIiBjeT0iNzU1IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iODkzIiBjeT0iNzU5IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMjIiIGN5PSIzMTcuMiIgcj0iMTEiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSIxMSIgY3k9IjMwNS4yIiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMjIiIGN5PSIzMDEuMiIgcj0iNiIgZmlsbD0iIzhENkU2MyIgb3BhY2l0eT0iMC43NSIvPjxjaXJjbGUgY3g9IjMzIiBjeT0iMzA1LjIiIHI9IjYiIGZpbGw9IiM4RDZFNjMiIG9wYWNpdHk9IjAuNzUiLz48Y2lyY2xlIGN4PSIxMTAwIiBjeT0iNDc1LjgiIHI9IjExIiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMTA4OSIgY3k9IjQ2My44IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMTEwMCIgY3k9IjQ1OS44IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PGNpcmNsZSBjeD0iMTExMSIgY3k9IjQ2My44IiByPSI2IiBmaWxsPSIjOEQ2RTYzIiBvcGFjaXR5PSIwLjc1Ii8+PC9zdmc+"
      }
    ]
  }
];





export default function TemplateEditor({
  initialId,
  initialName = "",
  initialDescription = "",
  initialDesignData,
  isEdit = false,
}: TemplateEditorProps) {
  const router = useRouter();
  const [activeSigTab, setActiveSigTab] = useState<'name' | 'line' | 'title'>('name');
  const [activePropTab, setActivePropTab] = useState<string>('content');

  const defaultDesign: CertificateDesignConfig = {
    canvasElements: []
  };

  let parsedInitial: CertificateDesignConfig = defaultDesign;
  if (initialDesignData) {
    try {
      parsedInitial = { ...defaultDesign, ...JSON.parse(initialDesignData) };
    } catch (e) {
      console.warn("Could not parse initial design data:", e);
    }
  }

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');
  const [dummyQrCode, setDummyQrCode] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const dataUrl = await QRCode.toDataURL("https://shim-platform.com/verify/PREVIEW", {
          width: 400, margin: 1, color: { dark: "#0f172a", light: "#ffffff" }
        });
        setDummyQrCode(dataUrl);
      } catch (err) {
        console.error(err);
      }
    };
    generateQR();
  }, []);

  const [design, setDesign] = useState<CertificateDesignConfig>(parsedInitial);
  const [activeTab, setActiveTab] = useState<"components" | "builder" | "json" | "background" | "presets">("components");
  const [previousTab, setPreviousTab] = useState<"components" | "builder" | "json" | "background" | "presets">("components");
  const [mobileEditorMode, setMobileEditorMode] = useState<"canvas" | "tools">("canvas");


  const [jsonText, setJsonText] = useState(JSON.stringify(parsedInitial, null, 2));
  const [saving, setSaving] = useState(false);

  const [activeGuides, setActiveGuides] = useState<{ vertical: number | null; horizontal: number | null }>({ vertical: null, horizontal: null });
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const signaturePadRef = useRef<any>(null);


  // Dynamic Typography Engine: extract used Google Fonts
  const usedFonts = React.useMemo(() => {
    const fonts = new Set<string>();
    if (design?.canvasElements) {
      design.canvasElements.forEach(el => {
        if (el.fontFamily && !el.fontFamily.startsWith('var(') && el.fontFamily !== 'Arial' && el.fontFamily !== 'sans-serif') {
          fonts.add(el.fontFamily);
        }
      });
    }
    return Array.from(fonts);
  }, [design?.canvasElements]);

  const googleFontsUrl = usedFonts.length > 0
    ? `https://fonts.googleapis.com/css2?${usedFonts.map(f => {
        const weights = FONT_SUPPORTED_WEIGHTS[f] || ["400"];
        return `family=${f.replace(/ /g, '+')}:wght@${weights.join(';')}`;
      }).join('&')}&display=swap`
    : null;

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeBgCategory, setActiveBgCategory] = useState<number>(0);

  // History state for Undo/Redo
  const [history, setHistory] = useState<CertificateDesignConfig[]>([parsedInitial]);
  const [historyIndex, setHistoryIndex] = useState(0);



  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  const handleLayerDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Recolor text elements to stay legible on the chosen background.
   * Backgrounds flagged `textScheme: "light"` are dark fields, so their text
   * must be light (and vice versa).
   *
   * Only NEUTRAL (near-grayscale) dark/light colours are swapped. Saturated
   * brand colours — the PUP maroon #800000, gold #d4af37, navy, etc. — are
   * left untouched, because they are deliberately chosen accents and are
   * legible on either field. Without the saturation test, dark brand colours
   * would be wrongly classified as "near black" and destroyed.
   */
  const applyBackgroundTextScheme = (elements: CanvasElement[] | undefined, scheme: "light" | "dark") => {
    const TEXT_TYPES: CanvasElementType[] = ["dynamicText", "staticText", "badge"];
    const parse = (hex: string | undefined) => {
      if (!hex || typeof hex !== "string") return null;
      const m = hex.trim().replace("#", "");
      const full = m.length === 3 ? m.split("").map(c => c + c).join("") : m;
      if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return null;
      return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
      };
    };
    /**
     * True when the colour should be treated as neutral (swappable) rather than
     * a deliberate brand accent.
     *
     * Policy: only swap near-grayscale tones. A saturated accent like PUP
     * maroon #800000 or luxury indigo is the user's explicit choice — even when
     * it is dark — and silently rewriting it would lose their branding with no
     * way to recover. Neutrals carry no brand meaning, so swapping them is
     * always safe.
     *
     * Saturation is measured as HSV saturation (chroma / value) so that
     * near-black neutrals with a slight hue cast — the app default #0f172a —
     * are still recognised as neutral, while true accents are not.
     */
    const isNeutral = (hex: string | undefined, target: "black" | "white") => {
      const c = parse(hex);
      if (!c) return false;
      const { r, g, b } = c;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const chroma = max - min;
      const sat = max === 0 ? 0 : chroma / max; // HSV saturation
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      // Hue in degrees (HSV). Neutral UI text in this app is either achromatic
      // or a blue-toned dark — #0f172a (222°), #1e293b (217°), #475569 (215°).
      let hue = 0;
      if (chroma !== 0) {
        if (max === r) hue = 60 * (((g - b) / chroma) % 6);
        else if (max === g) hue = 60 * ((b - r) / chroma + 2);
        else hue = 60 * ((r - g) / chroma + 4);
        if (hue < 0) hue += 360;
      }
      // A saturated, mid-dark green / red / amber tone is a deliberate brand
      // accent — academic green #355E3B (129°), maroon #800000 (0°), ochre
      // #cc7722 (30°). Carve these out so they are never rewritten; the
      // remaining hues (blue neutrals, achromatic greys) stay swappable.
      const brandHue =
        (hue >= 70 && hue <= 185) || (hue <= 55) || (hue >= 330);
      const saturatedAccent = chroma > 30 && sat > 0.30;
      if (brandHue && saturatedAccent) return false;

      // Otherwise: neutral if near-grayscale, or a low-saturation mid tone.
      const essentiallyGray = chroma <= 56 && lum < 0.62;
      const mutedMid = sat <= 0.28 && chroma <= 60;

      if (!essentiallyGray && !mutedMid) return false;
      return target === "black" ? lum < 0.62 : lum > 0.62;
    };
    const newColor = scheme === "light" ? "#f8fafc" : "#0f172a";
    return (elements || []).map(el => {
      if (!TEXT_TYPES.includes(el.type)) return el;
      const flipsFromBlack = scheme === "light" && isNeutral(el.color, "black");
      const flipsFromWhite = scheme === "dark" && isNeutral(el.color, "white");
      if (!flipsFromBlack && !flipsFromWhite) return el;
      const next: CanvasElement = { ...el, color: newColor };
      // signature blocks carry a separate title colour + rule colour
      if (isNeutral(el.titleColor, flipsFromBlack ? "black" : "white")) next.titleColor = newColor;
      if (isNeutral(el.lineColor, flipsFromBlack ? "black" : "white")) {
        next.lineColor = scheme === "light" ? "rgba(248,250,252,0.85)" : "rgba(15,23,42,0.6)";
      }
      return next;
    });
  };

  const handleLayerDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetId) return;

    const elements = [...(design.canvasElements || [])];
    const draggedIdx = elements.findIndex(el => el.id === draggedLayerId);
    const targetIdx = elements.findIndex(el => el.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const [draggedEl] = elements.splice(draggedIdx, 1);
    elements.splice(targetIdx, 0, draggedEl);

    applyDesignUpdate({ ...design, canvasElements: elements });
    setDraggedLayerId(null);
  };

  const moveLayerUp = () => {
    if (!selectedElementId) return;
    const idx = (design.canvasElements || []).findIndex(e => e.id === selectedElementId);
    if (idx < 0 || idx === (design.canvasElements || []).length - 1) return;
    const newElements = [...(design.canvasElements || [])];
    const temp = newElements[idx];
    newElements[idx] = newElements[idx + 1];
    newElements[idx + 1] = temp;
    applyDesignUpdate({ ...design, canvasElements: newElements });
  };

  const moveLayerDown = () => {
    if (!selectedElementId) return;
    const idx = (design.canvasElements || []).findIndex(e => e.id === selectedElementId);
    if (idx <= 0) return;
    const newElements = [...(design.canvasElements || [])];
    const temp = newElements[idx];
    newElements[idx] = newElements[idx - 1];
    newElements[idx - 1] = temp;
    applyDesignUpdate({ ...design, canvasElements: newElements });
  };

  const moveLayerToFront = () => {
    if (!selectedElementId) return;
    const idx = (design.canvasElements || []).findIndex(e => e.id === selectedElementId);
    if (idx < 0 || idx === (design.canvasElements || []).length - 1) return;
    const newElements = [...(design.canvasElements || [])];
    const el = newElements.splice(idx, 1)[0];
    newElements.push(el);
    applyDesignUpdate({ ...design, canvasElements: newElements });
  };

  const moveLayerToBack = () => {
    if (!selectedElementId) return;
    const idx = (design.canvasElements || []).findIndex(e => e.id === selectedElementId);
    if (idx <= 0) return;
    const newElements = [...(design.canvasElements || [])];
    const el = newElements.splice(idx, 1)[0];
    newElements.unshift(el);
    applyDesignUpdate({ ...design, canvasElements: newElements });
  };

  const applyDesignUpdate = (updated: CertificateDesignConfig, pushToHistory: boolean = true) => {
    setDesign(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    if (pushToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updated);
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleOrientationChange = (newOrientation: "landscape" | "portrait") => {
    const currentOrientation = design.orientation || "landscape";
    if (currentOrientation === newOrientation) return;

    const oldIsPortrait = currentOrientation === 'portrait';
    const newIsPortrait = newOrientation === 'portrait';
    const oldW = oldIsPortrait ? 2480 : 3508;
    const oldH = oldIsPortrait ? 3508 : 2480;
    const newW = newIsPortrait ? 2480 : 3508;
    const newH = newIsPortrait ? 3508 : 2480;

    const scaleX = newW / oldW;
    const scaleY = newH / oldH;
    const scaleF = Math.min(scaleX, scaleY);

    const newElements = (design.canvasElements || []).map(el => ({
      ...el,
      x: el.x * scaleX,
      y: el.y * scaleY,
      ...(el.width !== undefined ? { width: el.width * scaleX } : {}),
      ...(el.height !== undefined ? { height: el.height * scaleF } : {}),
      ...(el.fontSize ? { fontSize: el.fontSize * scaleX } : {})
    }));

    applyDesignUpdate({ ...design, orientation: newOrientation, canvasElements: newElements });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setDesign(prev);
      setJsonText(JSON.stringify(prev, null, 2));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setDesign(next);
      setJsonText(JSON.stringify(next, null, 2));
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Canvas State
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

    const prevSelectedIdRef = useRef<string | null>(null);
  
  // Auto-switch to builder (Settings) tab when a NEW element is selected
  useEffect(() => {
    if (selectedElementId && selectedElementId !== prevSelectedIdRef.current) {
      if (activeTab !== "builder") {
        setPreviousTab(activeTab);
        setActiveTab("builder");
      }
    } else if (!selectedElementId && prevSelectedIdRef.current) {
      if (activeTab === "builder") {
        setActiveTab(previousTab);
      }
    }
    prevSelectedIdRef.current = selectedElementId;
  }, [selectedElementId]);

  const updateDesignField = (field: keyof CertificateDesignConfig, value: any) => {
    const updated = { ...design, [field]: value };
    applyDesignUpdate(updated);
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setDesign(parsed); // Only update design, do not re-stringify to avoid cursor jump
      // Optionally, push to history (but typing JSON generates a lot of history)
    } catch (err) { }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Template name is required.");
      setActiveTab("builder");
      setTimeout(() => alert("Please provide a Template Name before saving."), 10);
      return;
    }
    setError('');
    setSaving(true);
    setSavedSuccess(false);
    try {
      const url = isEdit ? `/api/templates/${initialId}` : "/api/templates";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          designData: JSON.stringify(design),
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/templates");
          router.refresh();
        }, 800);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save template.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving template.");
    } finally {
      setSaving(false);
    }
  };

  // --- CANVAS ACTIONS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const updated = { ...design, backgroundImageUrl: base64 };
      if (!updated.canvasElements) updated.canvasElements = [];
      applyDesignUpdate(updated);
    };
    reader.readAsDataURL(file);
  };

  const addElement = (type: CanvasElementType, defaultText: string = "New Text") => {
    const newEl: CanvasElement = {
      id: uuidv4(),
      type,
      x: type.includes("Text") || type === 'signature' ? 1500 : 830,
      y: 1000,
      width: (type === 'qrCode' || type === 'image' || type === 'badge') ? 368 : type === 'shape' ? 3000 : undefined,
      height: (type === 'qrCode' || type === 'image' || type === 'badge') ? 368 : type === 'shape' ? 6 : undefined,
      text: type.includes("Text") || type === 'signature' ? defaultText : undefined,
      fontSize: 120,
      fontFamily: "var(--font-sans, sans-serif)",
      color: "#000000",
      align: "center",
      fontWeight: "normal",
      fontStyle: "normal"
    };
    const updated = { ...design, canvasElements: [...(design.canvasElements || []), newEl] };
    applyDesignUpdate(updated);
    setSelectedElementId(newEl.id);
  };

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId || !design.canvasElements) return;
    const updatedElements = design.canvasElements.map(el =>
      el.id === selectedElementId ? { ...el, ...updates } : el
    );
    const updated = { ...design, canvasElements: updatedElements };
    applyDesignUpdate(updated);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>, pushToHistory: boolean = true) => {
    if (!design.canvasElements) return;
    const updatedElements = design.canvasElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    const updated = { ...design, canvasElements: updatedElements };
    applyDesignUpdate(updated, pushToHistory);
  };

  const deleteSelectedElement = () => {
    if (!selectedElementId || !design.canvasElements) return;
    const updatedElements = design.canvasElements.filter(el => el.id !== selectedElementId);
    const updated = { ...design, canvasElements: updatedElements };
    applyDesignUpdate(updated);
    setSelectedElementId(null);
  };

  const selectedElement = design.canvasElements?.find(el => el.id === selectedElementId);

  useEffect(() => {
    if (selectedElement) {
      if (activePropTab === 'content' && (selectedElement.type === 'qrCode' || selectedElement.type === 'shape')) {
        setActivePropTab('style');
      } else if ((activePropTab === 'signature' || activePropTab === 'divider') && selectedElement.type !== 'signature') {
        setActivePropTab('style');
      } else if (activePropTab === 'style' && selectedElement.type === 'signature') {
        setActivePropTab('signature');
      } else if (activePropTab === 'style' && (selectedElement.type === 'image' || selectedElement.type === 'badge')) {
        setActivePropTab('content');
      }
    }
  }, [selectedElement?.type, activePropTab]);

  // Load a preset
  const loadPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const freshElements = (preset.design.canvasElements || []).map(el => ({
      ...el,
      id: uuidv4()
    }));

    const updated = {
      ...design,
      canvasElements: freshElements,
      backgroundImageUrl: preset.design.backgroundImageUrl
    };
    applyDesignUpdate(updated);
    setSelectedElementId(null);
  };

  // Responsive Canvas Scale State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  // Pan & Zoom Logic
  const [isPanMode, setIsPanMode] = useState(false);
  const [showPanTooltip, setShowPanTooltip] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isPanMode) setShowPanTooltip(true);
  }, [isPanMode]);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    if (userZoom <= 1) {
      setPanOffset({ x: 0, y: 0 });
      setIsPanMode(false);
    }
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const isPortrait = design.orientation === 'portrait';
      const canvasW = isPortrait ? 2480 : 3508;
      const canvasH = isPortrait ? 3508 : 2480;

      const visualW = canvasW * scale * userZoom;
      const visualH = canvasH * scale * userZoom;

      setHasOverflow(visualW > clientWidth || visualH > clientHeight);
    }
  }, [scale, userZoom, design.orientation]);

  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isPanMode && hasOverflow) {
      isDraggingCanvas.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas.current && isPanMode && hasOverflow) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPanOffset({
        x: dragStart.current.panX + dx,
        y: dragStart.current.panY + dy
      });
    }
  };

  const handleCanvasMouseUp = () => {
    isDraggingCanvas.current = false;
  };

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        const padding = width < 640 ? 16 : 64;
        const availableW = Math.max(16, width - padding);
        const availableH = Math.max(16, height - padding);
        const isPortrait = design.orientation === 'portrait';
        const canvasW = isPortrait ? 2480 : 3508;
        const canvasH = isPortrait ? 3508 : 2480;
        const scaleW = availableW / canvasW;
        const scaleH = availableH / canvasH;
        setScale(Math.min(scaleW, scaleH));
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [design.orientation]);

  return (
    <div className="flex-1 flex flex-col w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">

      {googleFontsUrl && <link href={googleFontsUrl} rel="stylesheet" />}
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <Link href="/dashboard/templates" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors mb-4">
            <ArrowLeft size={16} /> Templates
          </Link>
          <div className="flex items-start gap-3 w-full max-w-2xl">
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 shrink-0 mt-1.5">
              <LayoutTemplate size={24} />
            </div>
            <div className="flex flex-col w-full flex-1 gap-1">
              <textarea
                className={`text-2xl font-bold text-zinc-800 bg-transparent border-b-2 border-transparent hover:border-zinc-200 focus:border-zinc-900 focus:outline-none transition-colors px-1 py-0.5 w-full resize-none overflow-hidden leading-tight ${error ? 'border-red-500 placeholder-red-300 text-red-600' : ''}`}
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (error) setError('');
                  if (!design.certificateTitle || design.certificateTitle === "Certificate of Completion")
                    updateDesignField("certificateTitle", e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Template name..."
                required
              />
              <textarea
                className="text-zinc-500 text-sm font-medium bg-transparent border-b-2 border-transparent hover:border-zinc-200 focus:border-zinc-900 focus:outline-none transition-colors px-1 py-0.5 w-full resize-none overflow-hidden leading-relaxed"
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows={1}
                placeholder="Description (optional)..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between xl:justify-end gap-2 sm:gap-3 w-full xl:w-auto shrink-0">

          <div className="flex items-center rounded-xl overflow-hidden border border-zinc-200 shrink-0 h-[38px]">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="bg-white hover:bg-zinc-50 text-zinc-700 w-9 sm:w-10 h-full border-r border-zinc-200 flex items-center justify-center disabled:opacity-50 transition-colors"
              title="Undo"
            >
              <Undo size={15} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="bg-white hover:bg-zinc-50 text-zinc-700 w-9 sm:w-10 h-full flex items-center justify-center disabled:opacity-50 transition-colors"
              title="Redo"
            >
              <Redo size={15} />
            </button>
          </div>

          <button
            title="Reset to Default"
            onClick={() => {
              if (!showResetConfirm) {
                setShowResetConfirm(true);
              } else {
                applyDesignUpdate(defaultDesign);
                setShowResetConfirm(false);
              }
            }}
            onMouseLeave={() => setShowResetConfirm(false)}
            className={`flex items-center justify-center h-[38px] text-sm font-medium rounded-xl transition-all duration-200 overflow-hidden border shrink-0 ${
              showResetConfirm 
                ? "w-[90px] bg-[#dc2626] border-red-700 text-white hover:bg-red-700" 
                : "w-[38px] bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <AnimatePresence mode="wait">
              {showResetConfirm ? (
                <motion.span key="confirm" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="text-xs tracking-wide uppercase font-semibold">
                  Confirm
                </motion.span>
              ) : (
                <motion.div key="reset" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="flex items-center">
                  <RotateCcw size={16} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button onClick={handleSave} className="btn-primary font-medium flex-1 sm:flex-initial sm:min-w-[120px] justify-center text-xs sm:text-sm py-2 px-3 sm:px-4" disabled={saving}>
            {saving ? <><Loader2 size={15} className="animate-spin mr-1.5" /> Saving...</> : savedSuccess ? <><CheckCircle2 size={15} className="mr-1.5" /> Saved</> : <><Save size={15} className="mr-1.5" /> {isEdit ? "Save" : "Create"}</>}
          </button>
        </div>
      </div>

      {/* Mobile-only Segmented Mode Switcher (Canvas Preview vs Design Tools) */}
      <div className="lg:hidden flex p-1 bg-zinc-100 rounded-xl mb-4 border border-zinc-200/80 shrink-0">
        <button
          type="button"
          onClick={() => setMobileEditorMode("canvas")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileEditorMode === "canvas"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <LayoutTemplate size={14} />
          <span>Canvas Preview</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileEditorMode("tools")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileEditorMode === "tools"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Sliders size={14} />
          <span>Design Tools</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden w-full max-w-none px-0 lg:px-0">

        {/* Canva-Style Far Left Toolbar (Tab Switcher) */}
        <div className="hidden lg:flex flex-col gap-2 w-20 shrink-0 bg-zinc-900 rounded-xl overflow-hidden shadow-sm py-4 items-center">

          <button onClick={() => setActiveTab("components")} className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl transition-colors ${activeTab === 'components' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
            <LayoutTemplate size={20} />
            <span className="text-[10px] font-medium">Elements</span>
          </button>

          <button onClick={() => setActiveTab("background")} className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl transition-colors ${activeTab === 'background' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
            <ImageIcon size={20} />
            <span className="text-[10px] font-medium">BG</span>
          </button>

          <button onClick={() => setActiveTab("builder")} className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl transition-colors ${activeTab === 'builder' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
            <Layers size={20} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>

          <button onClick={() => setActiveTab("presets")} className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl transition-colors ${activeTab === 'presets' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
            <LayoutTemplate size={20} />
            <span className="text-[10px] font-medium">Templates</span>
          </button>

          <button onClick={() => setActiveTab("json")} className={`flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl transition-colors ${activeTab === 'json' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
            <Code2 size={20} />
            <span className="text-[10px] font-medium">JSON</span>
          </button>

        </div>

        {/* Left: Administrative Controls */}
        <div className={`w-full lg:w-[340px] lg:shrink-0 flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm ${
          mobileEditorMode === "tools" ? "flex flex-1 min-h-0" : "hidden lg:flex"
        }`}>

          {/* Mobile Horizontal Tool Strip (Phone only: provides access to all tabs) */}
          <div className="lg:hidden flex items-center gap-1 p-2 bg-zinc-900 text-white overflow-x-auto no-scrollbar shrink-0 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("components")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "components" ? "bg-zinc-800 text-white font-semibold shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutTemplate size={13} /> Elements
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("background")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "background" ? "bg-zinc-800 text-white font-semibold shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              <ImageIcon size={13} /> Background
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "builder" ? "bg-zinc-800 text-white font-semibold shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers size={13} /> Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "presets" ? "bg-zinc-800 text-white font-semibold shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutTemplate size={13} /> Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                activeTab === "json" ? "bg-zinc-800 text-white font-semibold shadow-xs" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 size={13} /> JSON
            </button>
          </div>


          <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
              {/* TAB: Components */}
              {activeTab === "components" ? (
                <motion.div
                  key="components"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 p-6 flex-1 w-full overflow-y-auto"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-800 px-1">Add Design Elements</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => addElement("staticText", "New Heading")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white">
                        <Type size={24} />
                        <span className="text-xs font-medium">Text</span>
                      </button>
                      <button onClick={() => addElement("dynamicText", "recipientName")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white">
                        <Database size={24} />
                        <span className="text-xs font-medium">Data Field</span>
                      </button>
                      <button onClick={() => addElement("signature", "Signatory Name|Title Here")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white">
                        <Stamp size={24} />
                        <span className="text-xs font-medium">Signature</span>
                      </button>
                      <button onClick={() => addElement("badge")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white">
                        <ShieldCheck size={24} />
                        <span className="text-xs font-medium">Badge</span>
                      </button>
                      <button onClick={() => addElement("image")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white">
                        <ImageIcon size={24} />
                        <span className="text-xs font-medium">Image</span>
                      </button>
                      <button onClick={() => addElement("shape")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white">
                        <Minus size={24} />
                        <span className="text-xs font-medium">Divider</span>
                      </button>
                      <button onClick={() => addElement("qrCode")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors bg-white col-span-2">
                        <QrCode size={24} />
                        <span className="text-xs font-medium">QR Code</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "background" ? (
                <motion.div
                  key="background"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 w-full flex flex-col min-h-0"
                >
                  <div className="p-6 pb-4 border-b border-zinc-200 shrink-0 space-y-5 bg-white z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] relative">
                    <h3 className="text-sm font-semibold text-zinc-800 px-1">Canvas Background</h3>

                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon size={24} className="mb-2 text-zinc-400" />
                          <p className="text-xs text-zinc-500"><span className="font-semibold text-zinc-600">Click to upload</span> or drag</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => applyDesignUpdate({ ...design, backgroundImageUrl: reader.result as string });
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="block text-xs font-medium text-zinc-600">Or paste image URL</label>
                        {design.backgroundImageUrl && (
                          <button onClick={() => updateDesignField("backgroundImageUrl", null)} className="text-[10px] font-medium text-red-500 hover:text-red-700 transition-colors">
                            Remove Background
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="https://example.com/bg.jpg"
                        className="input-field py-2 text-sm w-full"
                        value={design.backgroundImageUrl && design.backgroundImageUrl.startsWith('http') ? design.backgroundImageUrl : ''}
                        onChange={(e) => applyDesignUpdate({ ...design, backgroundImageUrl: e.target.value })}
                      />
                    </div>

                    <div className="pt-2">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {PRESET_CATEGORIES.map((category, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveBgCategory(idx)}
                            className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors border ${
                              activeBgCategory === idx 
                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                                : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {category.orientation === 'portrait' ? <span className="w-1.5 h-2.5 border border-current rounded-[1px] opacity-70"></span> : <span className="w-2.5 h-1.5 border border-current rounded-[1px] opacity-70"></span>}
                              {category.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 pt-4 pb-20 bg-zinc-50/30">
                    <div className="grid grid-cols-3 gap-2">
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={activeBgCategory}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="col-span-3 grid grid-cols-3 gap-2"
                        >
                          {PRESET_CATEGORIES[activeBgCategory]?.items.map((bg) => (
                              <button
                                key={bg.id}
                                onClick={() => {
                                  const cat = PRESET_CATEGORIES[activeBgCategory];
                                  if (design.orientation !== cat.orientation) {
                                    handleOrientationChange(cat.orientation);
                                  }
                                  // dark backgrounds declare textScheme "light" → flip text to light for legibility
                                  const scheme: "light" | "dark" = (bg as { textScheme?: "light" }).textScheme === "light" ? "light" : "dark";
                                  const recolored = applyBackgroundTextScheme(design.canvasElements, scheme);
                                  setTimeout(() => applyDesignUpdate({
                                    ...design,
                                    orientation: cat.orientation,
                                    backgroundImageUrl: bg.url,
                                    canvasElements: recolored,
                                  }), 50);
                                }}
                                className={`relative ${PRESET_CATEGORIES[activeBgCategory].orientation === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'} rounded-lg overflow-hidden border-2 transition-all ${design.backgroundImageUrl === bg.url ? 'border-zinc-900 shadow-md scale-[1.02]' : 'border-transparent hover:border-zinc-300 hover:scale-[1.02]'}`}
                                title={bg.name}
                              >
                                <img src={bg.url} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 pt-4">
                                  <p className="text-[9px] font-medium text-white truncate text-center drop-shadow-sm">{bg.name}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                </motion.div>
              ) : activeTab === "presets" ? (
                <motion.div
                  key="presets"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 p-6 flex-1 w-full overflow-y-auto"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-800 px-1">Starting Templates</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => loadPreset(preset.id)}
                          className="w-full p-3 rounded-lg border bg-white hover:bg-zinc-50 transition-colors text-xs font-semibold text-left relative overflow-hidden flex items-center shadow-sm hover:shadow"
                          style={{ borderColor: preset.color, color: preset.color }}
                        >
                          <div className="absolute top-0 right-0 w-8 h-8 opacity-10" style={{ backgroundColor: preset.color, borderBottomLeftRadius: '100%' }}></div>
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "builder" ? (
                <motion.div
                  key="builder"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full w-full flex-1 min-h-0"
                >





                  
                  {/* Element Properties */}
                  {selectedElement ? (
                    <div className="flex flex-col h-full relative">
                        {/* Fixed Header & Tabs Container */}
                        <div className="bg-white z-20 pt-6 px-6 pb-0 border-b border-zinc-200 shrink-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center border border-zinc-200">
                              {selectedElement.type === "staticText" ? <Type size={18} /> : selectedElement.type === "dynamicText" ? <Database size={18} /> : selectedElement.type === "signature" ? <Stamp size={18} /> : selectedElement.type === "badge" ? <ShieldCheck size={18} /> : selectedElement.type === "shape" ? <Minus size={18} /> : selectedElement.type === "qrCode" ? <QrCode size={18} /> : <ImageIcon size={18} />}
                            </div>
                            <div>
                              <h4 className="text-base font-semibold text-zinc-900 capitalize leading-tight">{ELEMENT_FRIENDLY_NAMES[selectedElement.type] || selectedElement.type}</h4>
                              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">Element Settings</p>
                            </div>
                          </div>
                          <button onClick={deleteSelectedElement} className="text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors p-2 rounded-lg border border-transparent hover:border-red-100" title="Delete Element">
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* Global Tabs Navigation */}
                        <div className="flex gap-4 relative overflow-x-auto no-scrollbar">
                          {selectedElement.type !== 'qrCode' && selectedElement.type !== 'shape' && (
                            <button onClick={() => setActivePropTab('content')} className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${activePropTab === 'content' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            Content
                            {activePropTab === 'content' && <motion.div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-zinc-900 z-10" />}
                          </button>
                          )}
                          
                          {selectedElement.type === 'signature' ? (
                            <>
                              <button onClick={() => setActivePropTab('signature')} className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${activePropTab === 'signature' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                                Fonts
                                {activePropTab === 'signature' && <motion.div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-zinc-900 z-10" />}
                              </button>
                              <button onClick={() => setActivePropTab('divider')} className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${activePropTab === 'divider' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                                Divider Line
                                {activePropTab === 'divider' && <motion.div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-zinc-900 z-10" />}
                              </button>
                              
                            </>
                          ) : selectedElement.type !== 'image' && selectedElement.type !== 'badge' ? (
                            <button onClick={() => setActivePropTab('style')} className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${activePropTab === 'style' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                              Style
                              {activePropTab === 'style' && <motion.div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-zinc-900 z-10" />}
                            </button>
                          ) : null}
                          
                          <button onClick={() => setActivePropTab('layout')} className={`pb-3 text-xs font-semibold whitespace-nowrap transition-colors relative ${activePropTab === 'layout' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>
                            Layout
                            {activePropTab === 'layout' && <motion.div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-zinc-900 z-10" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6 p-6 pb-20">
                        
                        {/* ----------------- CONTENT TAB ----------------- */}
                        {activePropTab === 'content' && (
                          <div className="space-y-4">
                            {selectedElement.type.includes("Text") && (
                              <>
                                {selectedElement.type === "dynamicText" ? (
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Dynamic Field Mapping</label>
                                    <Select
                                      value={selectedElement.text || ""}
                                      onChange={(val) => updateSelectedElement({ text: val })}
                                      options={[
                                        { value: "recipientName", label: "Recipient Name" },
                                        { value: "role", label: "Role / Title / Degree" },
                                        { value: "eventName", label: "Event Description" },
                                        { value: "issueDate", label: "Issue Date" },
                                        { value: "certificateId", label: "Certificate ID / Serial No." },
                                      ]}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Text Content</label>
                                    <textarea
                                      className="input-field py-2 text-sm"
                                      value={selectedElement.text}
                                      onChange={(e) => updateSelectedElement({ text: e.target.value })}
                                      rows={3}
                                    />
                                  </div>
                                )}
                              </>
                            )}

                            {selectedElement.type === "signature" && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Signatory Name</label>
                                  <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="input-field py-2 text-sm w-full"
                                    value={selectedElement.signatoryName ?? (selectedElement.text?.split('|')[0] || "")}
                                    onChange={(e) => updateSelectedElement({ signatoryName: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Signatory Title</label>
                                  <input
                                    type="text"
                                    placeholder="CEO & Founder"
                                    className="input-field py-2 text-sm w-full"
                                    value={selectedElement.signatoryTitle ?? (selectedElement.text?.split('|')[1] || "")}
                                    onChange={(e) => updateSelectedElement({ signatoryTitle: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Graphic Override</label>
                                  <label className="btn-secondary w-full justify-center cursor-pointer text-xs py-2 border-dashed">
                                    <ImageIcon size={14} className="mr-1.5 text-zinc-500" /> Upload Image instead
                                    <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (event) => updateSelectedElement({ src: event.target?.result as string });
                                      reader.readAsDataURL(file);
                                    }} className="hidden" />
                                  </label>
                                  {selectedElement.src && (
                                    <button onClick={() => updateSelectedElement({ src: undefined })} className="text-[10px] font-medium text-red-500 w-full text-center hover:text-red-700 transition-colors mt-2">Remove Graphic</button>
                                  )}
                                </div>
                              </div>
                            )}

                            {(selectedElement.type === "image" || selectedElement.type === "badge") && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">{selectedElement.type === "badge" ? "Custom Seal Graphic" : "Image Asset"}</label>
                                <label className="btn-secondary w-full justify-center cursor-pointer text-sm py-3 border-dashed bg-zinc-50 hover:bg-zinc-100">
                                  <ImageIcon size={16} className="mr-2 text-zinc-500" /> Upload File
                                  <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (event) => updateSelectedElement({ src: event.target?.result as string });
                                    reader.readAsDataURL(file);
                                  }} className="hidden" />
                                </label>
                                {selectedElement.src && (
                                  <button onClick={() => updateSelectedElement({ src: undefined })} className="text-[10px] font-medium text-red-500 w-full text-center hover:text-red-700 transition-colors mt-2">Remove File</button>
                                )}
                              </div>
                            )}

                            {selectedElement.type === "shape" && (
                              <div className="text-xs text-zinc-500 italic">No content properties for shapes. Use the Style tab to change colors.</div>
                            )}
                          </div>
                        )}

                        {/* ----------------- SIGNATURE TAB ----------------- */}
                        {activePropTab === 'signature' && selectedElement.type === 'signature' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Font Family</label>
                                <Select
                                  value={selectedElement.fontFamily || "var(--font-script, cursive)"}
                                  onChange={(val) => updateSelectedElement({ fontFamily: val })}
                                  options={[
                                    { value: "var(--font-script, cursive)", label: "Cursive (Default)" },
                                    { value: "Great Vibes", label: "Great Vibes" },
                                    { value: "Dancing Script", label: "Dancing Script" },
                                    { value: "Pacifico", label: "Pacifico" },
                                    { value: "Caveat", label: "Caveat" },
                                    { value: "Inter", label: "Inter (Sans)" },
                                    { value: "Playfair Display", label: "Playfair (Serif)" }
                                  ]}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Size (pt)</label>
                                <FontSizeSelector value={selectedElement.fontSize || 16} onChange={(val) => updateSelectedElement({ fontSize: val })} />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Ink Color</label>
                                <ColorSelector value={selectedElement.color || "#000000"} onChange={(val) => updateSelectedElement({ color: val })} />
                              </div>
                            
                              <div className="col-span-2 pt-4 border-t border-zinc-200 mt-2">
                                <h6 className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 mb-4">Title Font</h6>
                              </div>

                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Title Font Family</label>
                                <Select
                                  value={selectedElement.titleFontFamily || "var(--font-sans, sans-serif)"}
                                  onChange={(val) => updateSelectedElement({ titleFontFamily: val })}
                                  options={[
                                    { value: "var(--font-sans, sans-serif)", label: "System Sans (Default)" },
                                    { value: "Arial", label: "Arial" },
                                    { value: "Inter", label: "Inter" },
                                    { value: "Playfair Display", label: "Playfair Display" }
                                  ]}
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
                                  <span>Scale Multiplier</span>
                                  <span className="text-zinc-900">{selectedElement.titleFontSize || 0.4}x</span>
                                </label>
                                <input 
                                  type="range" 
                                  min="0.2" max="1" step="0.05"
                                  value={selectedElement.titleFontSize || 0.4} 
                                  onChange={(e) => updateSelectedElement({ titleFontSize: parseFloat(e.target.value) })}
                                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer" 
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
                                  <span>Letter Spacing</span>
                                  <span className="text-zinc-900">{selectedElement.titleLetterSpacing ?? 4}px</span>
                                </label>
                                <input 
                                  type="range" 
                                  min="0" max="20" step="1"
                                  value={selectedElement.titleLetterSpacing ?? 4} 
                                  onChange={(e) => updateSelectedElement({ titleLetterSpacing: parseInt(e.target.value) })}
                                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer" 
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Title Color</label>
                                <ColorSelector value={selectedElement.titleColor || selectedElement.color || "#000000"} onChange={(val) => updateSelectedElement({ titleColor: val })} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ----------------- DIVIDER TAB ----------------- */}
                        {activePropTab === 'divider' && selectedElement.type === 'signature' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-end border-b border-zinc-200 pb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-zinc-500 uppercase">Hide</span>
                                <button 
                                  onClick={() => updateSelectedElement({ hideLine: !selectedElement.hideLine })}
                                  className={`w-7 h-4 rounded-full transition-colors relative ${selectedElement.hideLine ? 'bg-zinc-900' : 'bg-zinc-200'}`}
                                >
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${selectedElement.hideLine ? 'left-[14px]' : 'left-[2px]'}`} />
                                </button>
                              </div>
                            </div>
                            {!selectedElement.hideLine && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <label className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">
                                    <span>Thickness</span>
                                    <span className="text-zinc-900">{selectedElement.lineThickness || 4}px</span>
                                  </label>
                                  <input 
                                    type="range" 
                                    min="1" max="10" 
                                    value={selectedElement.lineThickness || 4} 
                                    onChange={(e) => updateSelectedElement({ lineThickness: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer" 
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Padding</label>
                                  <input
                                    type="number"
                                    value={selectedElement.linePadding ?? 10}
                                    onChange={(e) => updateSelectedElement({ linePadding: parseInt(e.target.value) || 0 })}
                                    className="input-field py-1 text-sm w-full"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Line Color</label>
                                  <ColorSelector value={selectedElement.lineColor || selectedElement.color || "#000000"} onChange={(val) => updateSelectedElement({ lineColor: val })} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        

                        {/* ----------------- STYLE TAB ----------------- */}
                        {activePropTab === 'style' && (
                          <div className="space-y-6">
                            {/* Typography Group (For Text & Signature) */}
                            {(selectedElement.type.includes("Text") || selectedElement.type === 'signature') && (
                              <div className="space-y-4">
                                <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Typography</h5>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Font Family</label>
                                    <Select
                                      value={selectedElement.fontFamily || (selectedElement.type === 'signature' ? "var(--font-script, cursive)" : "var(--font-sans, sans-serif)")}
                                      onChange={(val) => updateSelectedElement({ fontFamily: val })}
                                      options={
                                        selectedElement.type === 'signature' 
                                        ? [
                                            { value: "var(--font-script, cursive)", label: "Cursive (Default)" },
                                            { value: "Great Vibes", label: "Great Vibes" },
                                            { value: "Dancing Script", label: "Dancing Script" },
                                            { value: "Pacifico", label: "Pacifico" },
                                            { value: "Caveat", label: "Caveat" },
                                            { value: "Inter", label: "Inter (Sans)" },
                                            { value: "Playfair Display", label: "Playfair (Serif)" }
                                          ]
                                        : [
                                            { value: "system-group", label: "System Basics", isGroupLabel: true },
                                            { value: "Arial", label: "Arial (System)" },
                                            { value: "var(--font-sans, sans-serif)", label: "System Default" },
                                            ...GOOGLE_FONTS.flatMap(group => [
                                              { value: `group-${group.group}`, label: group.group, isGroupLabel: true },
                                              ...group.fonts.map(font => ({ value: font, label: font }))
                                            ])
                                          ]
                                      }
                                    />
                                  </div>

                                  {!selectedElement.type.includes("signature") && (
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Font Weight</label>
                                      <Select
                                        value={selectedElement.fontWeight || "normal"}
                                        onChange={(val) => updateSelectedElement({ fontWeight: val })}
                                        options={(FONT_SUPPORTED_WEIGHTS[
                                          selectedElement.fontFamily === 'var(--font-sans, sans-serif)' ? 'Arial' :
                                          selectedElement.fontFamily === 'var(--font-script, cursive)' ? 'Great Vibes' :
                                          selectedElement.fontFamily === 'Arial' ? 'Arial' :
                                          selectedElement.fontFamily || 'Inter'
                                        ] || ["400", "700"]).map(w => {
                                          let val = w;
                                          if (w === "400") val = "normal";
                                          if (w === "700") val = "bold";
                                          const labels: any = {
                                            "100": "Thin", "200": "Extra Light", "300": "Light", "400": "Regular",
                                            "500": "Medium", "600": "Semi Bold", "700": "Bold", "800": "Extra Bold", "900": "Black"
                                          };
                                          return { value: val, label: `${labels[w]} (${w})` };
                                        })}
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">{selectedElement.type === 'signature' ? 'Master Size' : 'Size (pt)'}</label>
                                    <FontSizeSelector value={selectedElement.fontSize || 16} onChange={(val) => updateSelectedElement({ fontSize: val })} />
                                  </div>
                                </div>

                                
                                                        {/* Text Tools (Alignment & Style) */}
                                {!selectedElement.type.includes("signature") && (
                                  <div className="flex gap-2">
                                    <div className="flex border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden shadow-sm h-8">
                                      <button title="Align Left" className={`px-2.5 transition-colors ${selectedElement.align === 'left' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`} onClick={() => updateSelectedElement({ align: 'left' })}><AlignLeft size={14} /></button>
                                      <div className="w-px bg-zinc-200"></div>
                                      <button title="Align Center" className={`px-2.5 transition-colors ${selectedElement.align === 'center' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`} onClick={() => updateSelectedElement({ align: 'center' })}><AlignCenter size={14} /></button>
                                      <div className="w-px bg-zinc-200"></div>
                                      <button title="Align Right" className={`px-2.5 transition-colors ${selectedElement.align === 'right' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`} onClick={() => updateSelectedElement({ align: 'right' })}><AlignRight size={14} /></button>
                                    </div>
                                    <div className="flex border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden shadow-sm h-8">
                                      <button title="Italic" className={`px-2.5 transition-colors ${selectedElement.fontStyle === 'italic' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`} onClick={() => updateSelectedElement({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={14} /></button>
                                    </div>
                                    <div className="flex-1">
                                      <Select
                                        value={selectedElement.textTransform || "none"}
                                        onChange={(val) => updateSelectedElement({ textTransform: val as any })}
                                        options={[
                                          { value: "none", label: "Aa" },
                                          { value: "uppercase", label: "AA" },
                                          { value: "lowercase", label: "aa" },
                                          { value: "capitalize", label: "Aa Bb" },
                                        ]}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}



{/* Color Group */}
                            <div className="space-y-4">
                              <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Colors</h5>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Primary Fill</label>
                                <ColorSelector value={selectedElement.color || "#000000"} onChange={(val) => updateSelectedElement({ color: val })} />
                              </div>
                            </div>

                            {/* Spacing & Details */}
                            {selectedElement.type.includes("Text") && (
                              <div className="space-y-4">
                                <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Spacing</h5>
                                
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Letter spacing</label>
                                  <div className="flex items-center gap-3">
                                    <input type="range" min="-10" max="50" step="1" className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm" value={selectedElement.letterSpacing || 0} onChange={(e) => updateSelectedElement({ letterSpacing: Number(e.target.value) })} />
                                    <input type="number" className="input-field h-8 w-14 text-center text-xs font-mono" value={selectedElement.letterSpacing || 0} onChange={(e) => updateSelectedElement({ letterSpacing: Number(e.target.value) })} />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Line spacing</label>
                                  <div className="flex items-center gap-3">
                                    <input type="range" min="0.5" max="3" step="0.1" className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm" value={selectedElement.lineSpacing || 1.2} onChange={(e) => updateSelectedElement({ lineSpacing: Number(e.target.value) })} />
                                    <input type="number" min="0.5" max="3" step="0.1" className="input-field h-8 w-14 text-center text-xs font-mono" value={selectedElement.lineSpacing || 1.2} onChange={(e) => updateSelectedElement({ lineSpacing: Number(e.target.value) })} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedElement.type === "signature" && (
                              <>
                                <div className="space-y-4">
                                  <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Divider Line</h5>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Thickness (px)</label>
                                      <input type="number" min="0" max="20" className="input-field h-8 w-full text-xs font-mono" value={selectedElement.lineThickness ?? 4} onChange={(e) => updateSelectedElement({ lineThickness: Number(e.target.value) })} />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Gap / Padding</label>
                                      <div className="flex items-center gap-3">
                                        <input type="range" min="0" max="50" className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-300 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm" value={selectedElement.linePadding ?? 10} onChange={(e) => updateSelectedElement({ linePadding: Number(e.target.value) })} />
                                        <input type="number" min="0" max="50" className="input-field h-8 w-14 text-center text-xs font-mono" value={selectedElement.linePadding ?? 10} onChange={(e) => updateSelectedElement({ linePadding: Number(e.target.value) })} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Title Typography</h5>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Title Font</label>
                                    <Select
                                      value={selectedElement.titleFontFamily || "var(--font-sans, sans-serif)"}
                                      onChange={(val) => updateSelectedElement({ titleFontFamily: val })}
                                      options={[
                                        { value: "var(--font-sans, sans-serif)", label: "Sans (Default)" },
                                        { value: "var(--font-serif, serif)", label: "Serif (Default)" },
                                        { value: "Inter", label: "Inter" },
                                        { value: "Roboto", label: "Roboto" },
                                        { value: "Playfair Display", label: "Playfair Display" },
                                      ]}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Scale multiplier</label>
                                      <input type="number" step="0.1" className="input-field h-8 w-full text-xs font-mono" value={selectedElement.titleFontSize ?? 0.4} onChange={(e) => updateSelectedElement({ titleFontSize: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Tracking (px)</label>
                                      <input type="number" step="1" className="input-field h-8 w-full text-xs font-mono" value={selectedElement.titleLetterSpacing ?? 4} onChange={(e) => updateSelectedElement({ titleLetterSpacing: Number(e.target.value) })} />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                          </div>
                        )}

                        {/* ----------------- LAYOUT TAB ----------------- */}
                        {activePropTab === 'layout' && (
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Positioning</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">X Axis</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">X</span>
                                    <input type="number" className="input-field h-9 pl-7 pr-2 w-full text-sm font-mono" value={selectedElement.x ?? ""} onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })} />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Y Axis</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">Y</span>
                                    <input type="number" className="input-field h-9 pl-7 pr-2 w-full text-sm font-mono" value={selectedElement.y ?? ""} onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h5 className="text-[11px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-1">Dimensions</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Width</label>
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">W</span>
                                      <input 
                                        type="number" 
                                        className="input-field h-9 pl-7 pr-2 w-full text-sm font-mono" 
                                        placeholder="Auto" 
                                        value={selectedElement.width || ""} 
                                        onChange={(e) => updateSelectedElement({ width: e.target.value === '' ? undefined : Number(e.target.value) })} 
                                      />
                                    </div>
                                    <button 
                                      onClick={() => updateSelectedElement({ width: undefined })}
                                      className={`px-4 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${!selectedElement.width ? 'bg-zinc-200 text-zinc-950 border-zinc-300' : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'}`}
                                    >
                                      Auto
                                    </button>
                                  </div>
                                </div>
                                
                                {!(selectedElement.type.includes("Text") || selectedElement.type === "signature") && (
                                  <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-1.5">Height</label>
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">H</span>
                                      <input 
                                        type="number" 
                                        className="input-field h-9 pl-7 pr-2 w-full text-sm font-mono" 
                                        placeholder="Auto" 
                                        value={selectedElement.height || ""} 
                                        onChange={(e) => updateSelectedElement({ height: e.target.value === '' ? undefined : Number(e.target.value) })} 
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                    </div>
                  ) : (
                    <div className="text-center p-12 border border-dashed border-zinc-300 rounded-xl bg-zinc-50 text-zinc-400 flex flex-col items-center justify-center h-[300px]">
                      <MousePointer2 size={32} className="mb-4 opacity-50" />
                      <p className="text-sm font-medium text-zinc-600">No element selected</p>
                      <p className="text-xs mt-1 text-zinc-400 max-w-[200px]">Click an element on the canvas to configure its properties here.</p>
                    </div>
                  )}


                </motion.div>
              ) : (
                <motion.div
                  key="json"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col"
                >
                  <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                      <Code2 size={16} className="text-zinc-500" /> JSON Schema
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(jsonText);
                          alert("JSON copied to clipboard!");
                        }}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Copy JSON
                      </button>
                      <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer m-0">
                        Import JSON
                        <input type="file" accept="application/json" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const parsed = JSON.parse(event.target?.result as string);
                              applyDesignUpdate(parsed);
                            } catch (err) {
                              alert("Invalid JSON file.");
                            }
                          };
                          reader.readAsText(file);
                        }} />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-1 overflow-hidden bg-white">
                    <div
                      className="w-12 shrink-0 bg-zinc-50 border-r border-zinc-200 text-zinc-400 font-mono text-xs text-right py-4 pr-3 select-none overflow-hidden"
                      id="line-numbers"
                      style={{ lineHeight: '1.5' }}
                    >
                      {jsonText.split('\n').map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      className="flex-1 p-4 bg-white text-zinc-700 font-mono text-xs focus:outline-none resize-none overflow-auto whitespace-pre"
                      style={{ lineHeight: '1.5' }}
                      value={jsonText}
                      onChange={handleJsonChange}
                      onScroll={(e) => {
                        const lineNumbers = document.getElementById('line-numbers');
                        if (lineNumbers) {
                          lineNumbers.scrollTop = e.currentTarget.scrollTop;
                        }
                      }}
                      wrap="off"
                      spellCheck="false"
                    />
                  </div>
                </motion.div>
              )}
          </div>

          {/* Mobile Bottom Return to Canvas */}
          <div className="lg:hidden p-3 bg-zinc-50 border-t border-zinc-200 shrink-0 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">Changes sync live</span>
            <button
              type="button"
              onClick={() => setMobileEditorMode("canvas")}
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={13} />
              <span>View Canvas →</span>
            </button>
          </div>
        </div>

        {/* Right: Live Canvas Builder */}
        <div className={`flex-1 flex-col min-h-0 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-sm relative ${
          mobileEditorMode === "canvas" ? "flex" : "hidden lg:flex"
        }`}>

          {/* Pan Mode Notification */}
          <AnimatePresence>
            {isPanMode && showPanTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -10, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -10, x: 10 }}
                className="absolute top-4 right-4 z-[120] bg-white/70 backdrop-blur-sm border border-zinc-200 text-zinc-500 text-xs pl-3 pr-1 py-1 rounded-md flex items-center gap-3 font-medium pointer-events-auto"
              >
                <div className="flex items-center gap-1.5 pointer-events-none">
                  <Hand size={14} className="opacity-70" />
                  Double-click to disable
                </div>
                <button
                  onClick={() => setShowPanTooltip(false)}
                  className="p-1 hover:bg-zinc-200/50 rounded-md transition-colors"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>



          <div
            ref={containerRef}
            className={`flex-1 min-h-0 relative flex items-center justify-center bg-zinc-200/50 overflow-hidden ${isPanMode && hasOverflow ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget && !isPanMode) setSelectedElementId(null); }}
            onDoubleClick={(e) => {
              if (hasOverflow) {
                setIsPanMode(!isPanMode);
              }
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {isPanMode && hasOverflow && (
              <div className="absolute inset-0 z-[100] pointer-events-auto" />
            )}

            <div
              className="shrink-0 relative bg-white shadow-md border border-zinc-200"
              style={{
                width: design.orientation === 'portrait' ? '2480px' : '3508px',
                height: design.orientation === 'portrait' ? '3508px' : '2480px',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale * userZoom})`,
                transformOrigin: 'center center',
                backgroundImage: design.backgroundImageUrl ? `url(${design.backgroundImageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedElementId(null); }}
            >
              {design.canvasElements && design.canvasElements.map(el => {
                const isSelected = selectedElementId === el.id;
                let displayText = el.text;

                // Match the exact fallbacks used in CertificateView.tsx so the builder is truly WYSIWYG
                if (el.type === "dynamicText") {
                  if (el.text === "recipientName") displayText = "Jane Doe";
                  else if (el.text === "role") displayText = name || "Role / Title";
                  else if (el.text === "eventName") displayText = "Event Description";
                  else if (el.text === "issueDate") displayText = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                  else if (el.text === "certificateId") displayText = "PREVIEW-ID";
                }

                return (
                  <CanvasDraggableElement
                    key={el.id}
                    el={el}
                    isSelected={isSelected}
                    displayText={displayText}
                    setSelectedElementId={setSelectedElementId}
                    updateSelectedElement={updateSelectedElement}
                    updateElement={updateElement}
                    setActiveGuides={setActiveGuides}
                    currentOrientation={design.orientation || 'landscape'}
                    scale={scale * userZoom}
                    isPanMode={isPanMode}
                    dummyQrCode={dummyQrCode}
                  />
                );
              })}

              {/* Dynamic Center Snapping Guidelines */}
              {activeGuides.vertical !== null && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-[60] border-l-2 border-indigo-500 border-dashed"
                  style={{ left: `${activeGuides.vertical}px` }}
                />
              )}
              {activeGuides.horizontal !== null && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-[60] border-t-2 border-indigo-500 border-dashed"
                  style={{ top: `${activeGuides.horizontal}px` }}
                />
              )}
            </div>

            {/* Interactive Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-[110] flex flex-col items-end">

              {/* Layers Popup */}
              <AnimatePresence>
                {showLayersPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-xl w-[260px] overflow-hidden pointer-events-auto"
                  >
                    <div className="p-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                      <h4 className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                        <Layers size={14} className="text-zinc-500" /> Canvas Layers
                      </h4>
                      <button onClick={() => setShowLayersPanel(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
                      {!design.canvasElements || design.canvasElements.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 text-center py-4">No elements yet</p>
                      ) : (
                        [...(design.canvasElements || [])].reverse().map((el, reversedIdx) => {
                          const idx = design.canvasElements!.length - 1 - reversedIdx;
                          const isSelected = selectedElementId === el.id;
                          let label: string = el.type;
                          if (label === 'staticText') label = el.text ? `"${el.text.substring(0, 15)}..."` : 'Text';
                          else if (label === 'dynamicText') label = `Data: ${el.text}`;
                          else if (label === 'badge') label = 'Badge';
                          else if (label === 'image') label = 'Image';
                          else if (label === 'qrCode') label = 'QR Code';
                          else if (label === 'signature') label = 'Signature';

                          return (
                            <div
                              key={el.id}
                              draggable
                              onDragStart={(e) => handleLayerDragStart(e, el.id)}
                              onDragOver={handleLayerDragOver}
                              onDrop={(e) => handleLayerDrop(e, el.id)}
                              onDragEnd={() => setDraggedLayerId(null)}
                              className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-colors ${isSelected ? 'bg-zinc-100 text-zinc-950 shadow-sm border border-zinc-200/50' : 'bg-transparent hover:bg-zinc-100 text-zinc-600 border border-transparent'} ${draggedLayerId === el.id ? 'opacity-40 border-dashed border-zinc-400' : ''}`}
                              onClick={() => setSelectedElementId(el.id)}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-mono ${isSelected ? 'bg-zinc-300/50 text-zinc-900' : 'bg-zinc-200/50 text-zinc-400'}`}>
                                  {idx + 1}
                                </div>
                                <span className={`truncate font-medium ${el.locked ? 'text-zinc-400' : ''}`}>{label}</span>
                              </div>

                              <div className="flex items-center shrink-0 gap-1">
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  updateElement(el.id, { locked: !el.locked }); 
                                  if (!el.locked && selectedElementId === el.id) setSelectedElementId(null);
                                }} className={`p-1 rounded transition-colors ${el.locked ? 'text-amber-500 hover:bg-amber-100' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 opacity-0 group-hover:opacity-100'}`} title={el.locked ? "Unlock layer" : "Lock layer"}>
                                  {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                                </button>
                                {isSelected && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); moveLayerUp(); }} disabled={idx === design.canvasElements!.length - 1} className="p-1 hover:bg-zinc-300/50 rounded text-zinc-900 disabled:opacity-30 transition-colors" title="Bring Forward">
                                      <ArrowUp size={12} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); moveLayerDown(); }} disabled={idx === 0} className="p-1 hover:bg-zinc-300/50 rounded text-zinc-900 disabled:opacity-30 transition-colors" title="Send Backward">
                                      <ArrowDown size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-zinc-200 p-1 pointer-events-auto">
                <button
                  onClick={() => setShowLayersPanel(!showLayersPanel)}
                  className={`p-1 mr-1 rounded transition-colors flex items-center justify-center ${showLayersPanel ? 'bg-zinc-200 text-zinc-950' : 'hover:bg-zinc-100 text-zinc-600'}`}
                  title="Layers Panel"
                >
                  <Layers size={14} />
                </button>
                <div className="w-[1px] h-4 bg-zinc-200 mx-1"></div>
                {hasOverflow && (
                  <button
                    onClick={() => setIsPanMode(!isPanMode)}
                    className={`p-1 mr-1 rounded transition-colors ${isPanMode ? 'bg-zinc-200 text-zinc-950' : 'hover:bg-zinc-100 text-zinc-600'}`}
                    title="Toggle Pan Mode (Double-click canvas to quickly toggle)"
                  >
                    <Hand size={14} />
                  </button>
                )}
                <button onClick={() => setUserZoom(p => Math.max(0.1, p - (0.1 / scale)))} className="p-1 hover:bg-zinc-100 rounded text-zinc-600 transition-colors" title="Zoom Out">
                  <Minus size={14} />
                </button>
                <button onClick={() => setUserZoom(1)} className="px-2 py-1 hover:bg-zinc-100 rounded text-zinc-600 transition-colors text-xs font-medium w-auto sm:w-[140px] text-center" title="Reset Zoom">
                  <span className="hidden sm:inline">{design.orientation === 'portrait' ? '2480 x 3508 ' : '3508 x 2480 '}</span>
                  <span>{Math.round(scale * userZoom * 100)}%</span>
                </button>
                <button onClick={() => setUserZoom(p => Math.min(20, p + (0.1 / scale)))} className="p-1 hover:bg-zinc-100 rounded text-zinc-600 transition-colors" title="Zoom In">
                  <Plus size={14} />
                </button>
              </div>

              {/* Mobile Quick Floating Switcher to Tools */}
              <div className="lg:hidden ml-2">
                <button
                  type="button"
                  onClick={() => setMobileEditorMode("tools")}
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 hover:bg-zinc-800 transition-colors"
                >
                  <Sliders size={13} />
                  <span>Tools</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
        );
}

function CanvasDraggableElement({ el, isSelected, displayText, setSelectedElementId, updateSelectedElement, updateElement, setActiveGuides, currentOrientation, scale, dummyQrCode, isPanMode }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const dragStartData = useRef({ width: 0, fontSize: 0 });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (el.type === 'staticText' || el.type === 'dynamicText' || el.type === 'signature') {
      setIsEditing(true);
    }
  };

  const isProportional = el.type === 'qrCode' || el.type === 'image' || el.type === 'badge';

  return (
    <Rnd
      id={`rnd-${el.id}`}
      size={{ 
        width: (el.type === 'signature' && !el.src) ? 'auto' : (el.width || 'auto'), 
        height: (el.type === 'signature' && !el.src) ? 'auto' : (el.height || 'auto') 
      }}
      position={{ x: Number.isFinite(el.x) ? el.x : 0, y: Number.isFinite(el.y) ? el.y : 0 }}
      onDragStart={() => {
        if (el.locked) return;
        if (!isSelected) setSelectedElementId(el.id);
      }}
      onDrag={(e, data) => {
        const canvasWidth = currentOrientation === 'landscape' ? 3508 : 2480;
        const canvasHeight = currentOrientation === 'landscape' ? 2480 : 3508;
        const elW = data.node.offsetWidth;
        const elH = data.node.offsetHeight;
        const centerX = data.x + elW / 2;
        const centerY = data.y + elH / 2;
        const snap = 25;
        const isNearV = Math.abs(centerX - canvasWidth / 2) < snap;
        const isNearH = Math.abs(centerY - canvasHeight / 2) < snap;
        setActiveGuides({
          vertical: isNearV ? canvasWidth / 2 : null,
          horizontal: isNearH ? canvasHeight / 2 : null
        });
      }}
      onDragStop={(e, data) => {
        // react-rnd is passed `scale={scale}`, so `data.x` and `data.y`
        // are ALREADY in the unscaled canvas coordinate space (3508x2480 or 2480x3508).
        const canvasWidth = currentOrientation === 'landscape' ? 3508 : 2480;
        const canvasHeight = currentOrientation === 'landscape' ? 2480 : 3508;
        const elW = data.node.offsetWidth;
        const elH = data.node.offsetHeight;
        let finalX = data.x;
        let finalY = data.y;
        if (isNaN(finalX) || isNaN(finalY)) {
          setActiveGuides({ vertical: null, horizontal: null });
          return;
        }
        const centerX = finalX + elW / 2;
        const centerY = finalY + elH / 2;
        const snap = 25;
        if (Math.abs(centerX - canvasWidth / 2) < snap) finalX = canvasWidth / 2 - elW / 2;
        if (Math.abs(centerY - canvasHeight / 2) < snap) finalY = canvasHeight / 2 - elH / 2;
        setActiveGuides({ vertical: null, horizontal: null });
        updateElement(el.id, { x: Math.round(finalX), y: Math.round(finalY) });
      }}
      onResizeStart={(e, dir, ref) => {
        if (!isSelected) setSelectedElementId(el.id);
        const defaultFontSize = el.type === 'signature' ? 120 : 16;
        dragStartData.current = { width: ref.offsetWidth, fontSize: el.fontSize || defaultFontSize };
      }}
      onResize={(e, direction, ref, delta, position) => {
        // `ref.style.width` and `position` are already in canvas-space units
        // because react-rnd passes scale to re-resizable.
        const newWidth = parseFloat(ref.style.width) || ref.offsetWidth;
        const newHeight = el.height ? (parseFloat(ref.style.height) || ref.offsetHeight) : undefined;
        if (isNaN(newWidth) || newWidth <= 0) return;

        const safeX = isNaN(position.x) ? el.x : Math.round(position.x);
        const safeY = isNaN(position.y) ? el.y : Math.round(position.y);
        let updates: any = { x: safeX, y: safeY };

        const isCorner = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction);
        if (isCorner && !isProportional && el.type !== 'shape') {
          const startW = dragStartData.current.width || 1;
          const defaultFontSize = el.type === 'signature' ? 120 : 16;
          const startFs = dragStartData.current.fontSize || defaultFontSize;
          const ratio = newWidth / startW;
          updates.fontSize = Math.max(8, Math.round(startFs * ratio));
        }

        updates.width = (el.type === 'signature' && !el.src) ? ref.offsetWidth : Math.round(newWidth);
        if (newHeight !== undefined && !isNaN(newHeight)) {
          updates.height = (el.type === 'signature' && !el.src) ? ref.offsetHeight : Math.round(newHeight);
        }

        updateElement(el.id, updates, false);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newWidth = parseFloat(ref.style.width) || ref.offsetWidth;
        const newHeight = el.height ? (parseFloat(ref.style.height) || ref.offsetHeight) : undefined;
        if (isNaN(newWidth) || newWidth <= 0) return;

        const safeX = isNaN(position.x) ? el.x : Math.round(position.x);
        const safeY = isNaN(position.y) ? el.y : Math.round(position.y);
        let updates: any = { x: safeX, y: safeY };

        const isCorner = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(direction);
        if (isCorner && !isProportional && el.type !== 'shape') {
          const startW = dragStartData.current.width || 1;
          const defaultFontSize = el.type === 'signature' ? 120 : 16;
          const startFs = dragStartData.current.fontSize || defaultFontSize;
          const ratio = newWidth / startW;
          updates.fontSize = Math.max(8, Math.round(startFs * ratio));
        }

        updates.width = (el.type === 'signature' && !el.src) ? ref.offsetWidth : Math.round(newWidth);
        if (newHeight !== undefined && !isNaN(newHeight)) {
          updates.height = (el.type === 'signature' && !el.src) ? ref.offsetHeight : Math.round(newHeight);
        }

        updateElement(el.id, updates, true);
      }}
      scale={scale}
      bounds="parent"
      disableDragging={isEditing || isPanMode || el.locked}
      onClick={(e: any) => {
        e.stopPropagation();
        if (el.locked) return;
        setSelectedElementId(el.id);
      }}
      style={{
        pointerEvents: el.locked ? "none" : "auto",
        cursor: el.locked ? "default" : isEditing ? "text" : "move",
        border: isSelected ? "2px solid #3b82f6" : "1px dashed transparent",
        padding: "2px",
        fontSize: `${el.fontSize || 16}px`,
        fontFamily: el.fontFamily || "var(--font-sans, sans-serif)",
        color: el.color || "#000000",
        textAlign: (el.align as any) || "left",
        fontWeight: el.fontWeight || "normal",
        fontStyle: el.fontStyle || "normal",
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
        textTransform: el.textTransform as any || "none",
        lineHeight: el.lineSpacing || 1.2,
        whiteSpace: "pre-wrap",
        zIndex: isSelected ? 50 : 10,
        backgroundColor: el.type === 'shape' ? (el.color || '#000000') : 'transparent',
        // Text must grow DOWN from el.y to match CertificateView (the final
        // output), which positions text with a plain `top: el.y` div. Using
        // flex centring here made the preview ride up over elements above it.
        display: "flex",
        alignItems: (el.type === 'staticText' || el.type === 'dynamicText') ? "flex-start" : "center"
      }}
      className={`${isSelected ? "bg-blue-50/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]" : "hover:border-zinc-300"}`}
      enableResizing={
        el.locked 
          ? false 
          : isSelected && !isEditing 
            ? (el.type === 'signature' && !el.src 
                ? false 
                : true)
            : false
      }
      lockAspectRatio={isProportional}
      resizeHandleStyles={{
        bottomRight: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", right: "-8px", bottom: "-8px" },
        right: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", right: "-8px", top: "50%", transform: "translateY(-50%)" },
        bottom: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", bottom: "-8px", left: "50%", transform: "translateX(-50%)" },
        bottomLeft: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", left: "-8px", bottom: "-8px" },
        left: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", left: "-8px", top: "50%", transform: "translateY(-50%)" },
        topLeft: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", left: "-8px", top: "-8px" },
        top: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", top: "-8px", left: "50%", transform: "translateX(-50%)" },
        topRight: { width: "16px", height: "16px", background: "white", border: "2px solid #3b82f6", borderRadius: "50%", right: "-8px", top: "-8px" }
      }}
    >
      <div onDoubleClick={handleDoubleClick} className={`w-full h-full flex flex-col pointer-events-auto ${(el.type === 'staticText' || el.type === 'dynamicText') ? 'justify-start' : (el.type === 'signature' ? 'justify-end' : 'justify-center')}`}>
        {isEditing ? (
          <textarea
            autoFocus
            className="w-full bg-transparent border-none outline-none resize-none overflow-hidden pointer-events-auto"
            rows={el.text ? el.text.split('\n').length || 1 : 1}
            style={{
              fontSize: el.type === 'signature' ? `${Math.max(16, (el.fontSize || 120) * 0.4)}px` : 'inherit',
              fontFamily: 'inherit', color: 'inherit', textAlign: 'inherit',
              fontWeight: 'inherit', fontStyle: 'inherit', lineHeight: 'inherit'
            }}
            value={el.text || ''}
            onChange={(e) => updateElement(el.id, { text: e.target.value })}
            onBlur={() => {
              setIsEditing(false);
              if (el.type === 'signature' && !el.src) {
                setTimeout(() => {
                  const node = document.getElementById(`rnd-${el.id}`);
                  if (node) {
                    updateElement(el.id, { width: node.offsetWidth, height: node.offsetHeight });
                  }
                }, 50);
              }
            }}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsEditing(false) }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : el.type === 'qrCode' ? (
          <div className="w-full h-full pointer-events-none">
            <QRCodeSVG 
              value="https://shim-platform.com/verify/PREVIEW" 
              fgColor={el.color || "#000000"} 
              bgColor="#fcfbf7" 
              width="100%" 
              height="100%" 
              level="M"
              marginSize={1}
            />
          </div>
        ) : el.type === 'image' || el.type === 'badge' ? (
          <div className="w-full h-full pointer-events-none flex items-center justify-center">
            {el.src ? (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <img src={el.src} alt="" className="w-full h-full object-contain" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1)) drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }} />
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
            ) : el.type === 'badge' ? (
              <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldOuterBadge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </linearGradient>
                  <linearGradient id="goldInnerBadge" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="40%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#a16207" />
                  </linearGradient>

                  {/* Animated Shine Effect */}
                  <linearGradient id="badgeShine" x1="-100%" y1="-100%" x2="0%" y2="0%">
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
                <path d="M 60.0 10.0 L 65.7 16.4 L 72.9 11.7 L 76.8 19.3 L 85.0 16.7 L 86.8 25.1 L 95.4 24.6 L 94.9 33.2 L 103.3 35.0 L 100.7 43.2 L 108.3 47.1 L 103.6 54.3 L 110.0 60.0 L 103.6 65.7 L 108.3 72.9 L 100.7 76.8 L 103.3 85.0 L 94.9 86.8 L 95.4 95.4 L 86.8 94.9 L 85.0 103.3 L 76.8 100.7 L 72.9 108.3 L 65.7 103.6 L 60.0 110.0 L 54.3 103.6 L 47.1 108.3 L 43.2 100.7 L 35.0 103.3 L 33.2 94.9 L 24.6 95.4 L 25.1 86.8 L 16.7 85.0 L 19.3 76.8 L 11.7 72.9 L 16.4 65.7 L 10.0 60.0 L 16.4 54.3 L 11.7 47.1 L 19.3 43.2 L 16.7 35.0 L 25.1 33.2 L 24.6 24.6 L 33.2 25.1 L 35.0 16.7 L 43.2 19.3 L 47.1 11.7 L 54.3 16.4 Z" fill="url(#goldOuterBadge)" />

                {/* Animated Shine overlaying the rosette base */}
                <path d="M 60.0 10.0 L 65.7 16.4 L 72.9 11.7 L 76.8 19.3 L 85.0 16.7 L 86.8 25.1 L 95.4 24.6 L 94.9 33.2 L 103.3 35.0 L 100.7 43.2 L 108.3 47.1 L 103.6 54.3 L 110.0 60.0 L 103.6 65.7 L 108.3 72.9 L 100.7 76.8 L 103.3 85.0 L 94.9 86.8 L 95.4 95.4 L 86.8 94.9 L 85.0 103.3 L 76.8 100.7 L 72.9 108.3 L 65.7 103.6 L 60.0 110.0 L 54.3 103.6 L 47.1 108.3 L 43.2 100.7 L 35.0 103.3 L 33.2 94.9 L 24.6 95.4 L 25.1 86.8 L 16.7 85.0 L 19.3 76.8 L 11.7 72.9 L 16.4 65.7 L 10.0 60.0 L 16.4 54.3 L 11.7 47.1 L 19.3 43.2 L 16.7 35.0 L 25.1 33.2 L 24.6 24.6 L 33.2 25.1 L 35.0 16.7 L 43.2 19.3 L 47.1 11.7 L 54.3 16.4 Z" fill="url(#badgeShine)" />

                {/* Inner Bevel / Ring */}
                <circle cx="60" cy="60" r="41" fill="url(#goldInnerBadge)" />
                <circle cx="60" cy="60" r="36" fill="none" stroke="#fef3c7" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.8" />
                <circle cx="60" cy="60" r="32" fill="none" stroke="#fef3c7" strokeWidth="0.75" opacity="0.5" />

                {/* SHIM Text */}
                <text x="60" y="58" fontFamily="Inter, system-ui, sans-serif" fontSize="20" fontWeight="900" letterSpacing="-0.5px" fill="rgba(255,255,255,0.9)" textAnchor="middle" style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.15))" }}>shim</text>

                {/* CERTIFIED Text */}
                <text x="60" y="68" fontFamily="var(--font-sans, Arial, sans-serif)" fontSize="6.5" fontWeight="900" fill="rgba(254,243,199,0.9)" textAnchor="middle" style={{ letterSpacing: "2px", filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.15))" }}>CERTIFIED</text>
              </svg>
            ) : el.type === 'qrCode' || el.type === 'qrcode' as any ? (
              <QRCodeSVG
                value={el.text || el.src || "https://shim.org/verify/sample"}
                size={1000}
                style={{ width: "100%", height: "100%" }}
                bgColor="transparent"
                fgColor={el.color || "#000000"}
              />
            ) : (
              <div className="w-full h-full bg-zinc-50 flex items-center justify-center border-2 border-dashed border-zinc-300 text-zinc-400 rounded-xl">
                <ImageIcon size={120} />
              </div>
            )}
          </div>
        ) : el.type === 'signature' ? (
          <div className="w-full h-full pointer-events-none flex flex-col items-center justify-end relative">
            {el.src ? (
              <img src={el.src} alt="Signature" style={{ maxWidth: "100%", maxHeight: "70%", objectFit: "contain", marginBottom: `${el.linePadding ?? 10}px` }} />
            ) : (
              <div style={{ whiteSpace: "nowrap", fontFamily: el.fontFamily || "var(--font-script, cursive)", fontSize: `${(el.fontSize || 120) * 1.5}px`, color: el.color || "#000000", paddingTop: "0.3em", paddingBottom: "0.1em", fontStyle: "italic", lineHeight: "normal" }}>
                {el.signatoryName ?? (el.text?.split('|')[0] || "Signature")}
              </div>
            )}
            {!el.hideLine && (
              <div style={{ width: "100%", borderTop: `${el.lineThickness ?? 4}px solid ${el.lineColor || el.color || "#000000"}`, flexShrink: 0, marginBottom: `${el.linePadding ?? 10}px`, marginTop: `${el.linePadding ?? 10}px` }} />
            )}
            <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: `${(el.fontSize || 60) * (el.titleFontSize ?? 0.4)}px`, fontFamily: el.titleFontFamily || "var(--font-sans, sans-serif)", color: el.titleColor || el.color || "#000000", fontWeight: "bold", textTransform: "uppercase", letterSpacing: `${el.titleLetterSpacing ?? 4}px` }}>
              {el.signatoryTitle ?? (el.text?.split('|')[1] || "Title")}
            </div>
          </div>
        ) : el.type === 'shape' ? null : (
          <span className="pointer-events-none block w-full">{displayText}</span>
        )}
      </div>
    </Rnd>
  );
}

