"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Stamp, Sliders, Code2, ShieldCheck, CheckCircle2, RotateCcw, Image as ImageIcon, Move, LayoutTemplate, Loader2, Sparkles, Type, FileImage, MousePointer2, Plus, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Database, QrCode, Undo, Redo } from "lucide-react";
import CertificateView, { CertificateDesignConfig, CanvasElement, CanvasElementType } from "@/components/CertificateView";
import { v4 as uuidv4 } from "uuid";
import { PRESETS } from "@/lib/presets";
import { AnimatePresence, motion } from "framer-motion";

interface TemplateEditorProps {
  initialId?: string;
  initialName?: string;
  initialDescription?: string;
  initialDesignData?: string;
  isEdit?: boolean;
}

export default function TemplateEditor({
  initialId,
  initialName = "",
  initialDescription = "",
  initialDesignData,
  isEdit = false,
}: TemplateEditorProps) {
  const router = useRouter();

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
  const [design, setDesign] = useState<CertificateDesignConfig>(parsedInitial);
  const [activeTab, setActiveTab] = useState<"visual" | "builder" | "json">("builder");
  const [jsonText, setJsonText] = useState(JSON.stringify(parsedInitial, null, 2));
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // History state for Undo/Redo
  const [history, setHistory] = useState<CertificateDesignConfig[]>([parsedInitial]);
  const [historyIndex, setHistoryIndex] = useState(0);

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
    } catch (err) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Template name is required.");
      return;
    }
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
      x: 830,
      y: 1000,
      width: (type === 'qrCode' || type === 'image' || type === 'badge') ? 368 : type === 'signature' ? 920 : 1840,
      height: (type === 'qrCode' || type === 'image' || type === 'badge') ? 368 : type === 'shape' ? 20 : type === 'signature' ? 260 : undefined,
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

  const deleteSelectedElement = () => {
    if (!selectedElementId || !design.canvasElements) return;
    const updatedElements = design.canvasElements.filter(el => el.id !== selectedElementId);
    const updated = { ...design, canvasElements: updatedElements };
    applyDesignUpdate(updated);
    setSelectedElementId(null);
  };

  const selectedElement = design.canvasElements?.find(el => el.id === selectedElementId);

  // Load a preset
  const loadPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    const updated = { 
      ...design, 
      canvasElements: preset.design.canvasElements, 
      backgroundImageUrl: preset.design.backgroundImageUrl 
    }; 
    applyDesignUpdate(updated);
    if (!name || name === "New Template") setName(preset.name);
  };

  // Responsive Canvas Scale State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        const availableW = width - 64; // 32px padding on each side
        const availableH = height - 64;
        const scaleW = availableW / 3508;
        const scaleH = availableH / 2480;
        setScale(Math.min(scaleW, scaleH));
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 py-6 min-h-0 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 shrink-0">
        <div>
          <Link href="/dashboard/templates" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-4">
            <ArrowLeft size={16} /> Back to Templates
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-black uppercase flex items-center gap-4 mb-2">
            <div className="p-2 border-2 border-black bg-black text-white shrink-0">
              <LayoutTemplate size={24} />
            </div>
            {isEdit ? "Edit Template" : "Template Studio"}
          </h1>
          <p className="text-gray-500 font-medium uppercase tracking-widest text-sm mt-1">
            Build and edit dynamic certificate layouts.
          </p>
        </div>

        <div className="flex items-stretch gap-4 shrink-0">
          
          <div className="flex items-stretch shrink-0">
            <button 
              onClick={handleUndo} 
              disabled={historyIndex <= 0}
              className="btn-secondary !border-r-0 px-3 flex items-center justify-center disabled:opacity-50"
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex >= history.length - 1}
              className="btn-secondary px-3 flex items-center justify-center disabled:opacity-50"
              title="Redo"
            >
              <Redo size={16} />
            </button>
          </div>

          {showResetConfirm ? (
            <div className="flex items-stretch border-2 border-black bg-white shrink-0">
              <span className="text-xs font-bold text-red-700 bg-red-100 px-3 py-2 uppercase tracking-widest border-r-2 border-black flex items-center shrink-0">
                Reset All?
              </span>
              <button
                onClick={() => {
                  applyDesignUpdate(defaultDesign);
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors border-r-2 border-black flex items-center justify-center shrink-0 text-xs font-bold uppercase tracking-widest"
              >
                Yes
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-white text-black hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0 text-xs font-bold uppercase tracking-widest"
              >
                No
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowResetConfirm(true)} 
              className="btn-secondary uppercase tracking-widest font-bold"
            >
              <RotateCcw size={16} /> <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button onClick={handleSave} className="btn-primary uppercase tracking-widest font-bold min-w-[200px] justify-center" disabled={saving || !name.trim()}>
            {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : savedSuccess ? <><CheckCircle2 size={16} className="mr-2" /> Saved</> : <><Save size={16} className="mr-2" /> {isEdit ? "Update Template" : "Create Template"}</>}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 overflow-hidden">
        
        {/* Left: Administrative Controls */}
        <div className="lg:col-span-4 flex flex-col bg-white border-2 border-black overflow-hidden">
          <div className="flex border-b-2 border-black shrink-0">
            <button className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === "builder" ? "text-white bg-black" : "text-black bg-white hover:bg-gray-100"}`} onClick={() => setActiveTab("builder")}>
              <Move size={16} /> Builder
            </button>
            <button className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border-l-2 border-black ${activeTab === "json" ? "text-white bg-black" : "text-black bg-white hover:bg-gray-100"}`} onClick={() => setActiveTab("json")}>
              <Code2 size={16} /> JSON
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto overflow-x-hidden ${activeTab === 'builder' ? 'p-6' : ''}`}>
            <AnimatePresence mode="wait">
              {/* TAB: Builder (Properties) */}
              {activeTab === "builder" ? (
                <motion.div 
                  key="builder"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="space-y-6"
                >
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-black uppercase tracking-widest">Template Name *</label>
                    <input type="text" className="input-field border-2 border-black font-bold uppercase tracking-wide focus:outline-none" value={name} onChange={e => { setName(e.target.value); if (!design.certificateTitle || design.certificateTitle === "Certificate of Completion") updateDesignField("certificateTitle", e.target.value); }} placeholder="E.G. VIP ATTENDEE" required />
                  </div>
                </div>

                <div className="h-0.5 bg-black my-6"></div>
                
                {/* Global Background */}
                <div className="bg-gray-50 border-2 border-black p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-2 mb-2 flex items-center justify-between">
                    Canvas Background
                  </h4>
                  <label className="btn-secondary uppercase tracking-widest font-bold w-full justify-center cursor-pointer text-xs py-2">
                    <ImageIcon size={14} className="mr-2" /> Upload Background
                    <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {design.backgroundImageUrl && (
                    <button onClick={() => updateDesignField("backgroundImageUrl", null)} className="text-xs font-bold text-red-600 w-full text-center hover:underline mt-2">Remove Background</button>
                  )}
                  
                  <div className="pt-2 border-t-2 border-black mt-4">
                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Or load a preset:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map((preset) => (
                        <button 
                          key={preset.id}
                          onClick={() => loadPreset(preset.id)} 
                          className="w-full p-2 border-2 bg-white hover:bg-gray-50 transition-colors text-[10px] font-bold uppercase tracking-widest text-left relative overflow-hidden"
                          style={{ borderColor: preset.color, color: preset.color }}
                        >
                          <div className="absolute top-0 right-0 w-8 h-8 opacity-20" style={{ backgroundColor: preset.color, borderBottomLeftRadius: '100%' }}></div>
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Element Properties */}
                {selectedElement ? (
                  <div className="bg-blue-50 border-2 border-blue-900 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-blue-900 pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-blue-900 flex items-center gap-2">
                        <MousePointer2 size={14} /> Element Properties
                      </h4>
                      <button onClick={deleteSelectedElement} className="text-red-600 hover:text-red-800" title="Delete Element">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {selectedElement.type.includes("Text") && (
                      <>
                        {selectedElement.type === "dynamicText" ? (
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Dynamic Field Mapping</label>
                            <select 
                              className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none"
                              value={selectedElement.text}
                              onChange={(e) => updateSelectedElement({ text: e.target.value })}
                            >
                              <option value="recipientName">Recipient Name</option>
                              <option value="role">Role / Title / Degree</option>
                              <option value="eventName">Event Description</option>
                              <option value="issueDate">Issue Date</option>
                              <option value="certificateId">Certificate ID / Serial No.</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Text Content</label>
                            <textarea 
                              className="w-full p-2 border-2 border-blue-900 text-sm font-medium bg-white focus:outline-none"
                              value={selectedElement.text}
                              onChange={(e) => updateSelectedElement({ text: e.target.value })}
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Font Size (px)</label>
                            <input type="number" className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.fontSize || 16} onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Color</label>
                            <input type="color" className="w-full h-[34px] p-0 border-2 border-blue-900 bg-white" value={selectedElement.color || "#000000"} onChange={(e) => updateSelectedElement({ color: e.target.value })} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Font Family</label>
                            <select className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.fontFamily || "var(--font-inter, sans-serif)"} onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}>
                              <option value="var(--font-inter, sans-serif)">Inter (Modern Sans)</option>
                              <option value="var(--font-outfit, sans-serif)">Outfit (Tech Sans)</option>
                              <option value="var(--font-spacegrotesk, sans-serif)">Space Grotesk (Bold Display)</option>
                              <option value="var(--font-playfair, serif)">Playfair Display (Elegant Serif)</option>
                              <option value="var(--font-cormorant, serif)">Cormorant (Classic Serif)</option>
                              <option value="var(--font-cinzel, serif)">Cinzel (Classic Title)</option>
                              <option value="var(--font-script, cursive)">Great Vibes (Signature)</option>
                              <option value="var(--font-spacemono, monospace)">Space Mono (Tech Mono)</option>
                              <option value="var(--font-mono, monospace)">System Monospace</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Letter Spacing (px)</label>
                            <input type="number" className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.letterSpacing || 0} onChange={(e) => updateSelectedElement({ letterSpacing: Number(e.target.value) })} />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="flex border-2 border-blue-900 bg-white">
                            <button className={`p-2 ${selectedElement.align === 'left' ? 'bg-blue-200' : 'hover:bg-blue-50'}`} onClick={() => updateSelectedElement({ align: 'left' })}><AlignLeft size={14} /></button>
                            <button className={`p-2 border-x-2 border-blue-900 ${selectedElement.align === 'center' ? 'bg-blue-200' : 'hover:bg-blue-50'}`} onClick={() => updateSelectedElement({ align: 'center' })}><AlignCenter size={14} /></button>
                            <button className={`p-2 ${selectedElement.align === 'right' ? 'bg-blue-200' : 'hover:bg-blue-50'}`} onClick={() => updateSelectedElement({ align: 'right' })}><AlignRight size={14} /></button>
                          </div>
                          <div className="flex border-2 border-blue-900 bg-white">
                            <button className={`p-2 border-r-2 border-blue-900 ${selectedElement.fontWeight === 'bold' ? 'bg-blue-200' : 'hover:bg-blue-50'}`} onClick={() => updateSelectedElement({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}><Bold size={14} /></button>
                            <button className={`p-2 ${selectedElement.fontStyle === 'italic' ? 'bg-blue-200' : 'hover:bg-blue-50'}`} onClick={() => updateSelectedElement({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={14} /></button>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedElement.type === "signature" && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Signatory Name</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none"
                              value={selectedElement.text?.split('|')[0] || ""}
                              onChange={(e) => updateSelectedElement({ text: `${e.target.value}|${selectedElement.text?.split('|')[1] || ""}` })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Signatory Title</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none"
                              value={selectedElement.text?.split('|')[1] || ""}
                              onChange={(e) => updateSelectedElement({ text: `${selectedElement.text?.split('|')[0] || ""}|${e.target.value}` })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Scale</label>
                            <input type="number" className="w-full p-2 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.fontSize || 60} onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Ink Color</label>
                            <input type="color" className="w-full h-[34px] p-0 border-2 border-blue-900 bg-white" value={selectedElement.color || "#000000"} onChange={(e) => updateSelectedElement({ color: e.target.value })} />
                          </div>
                        </div>
                        
                        <div>
                          <label className="btn-secondary uppercase tracking-widest font-bold w-full justify-center cursor-pointer text-xs py-2 bg-white">
                            <ImageIcon size={14} className="mr-2" /> Upload Signature Image
                            <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => updateSelectedElement({ src: event.target?.result as string });
                              reader.readAsDataURL(file);
                            }} className="hidden" />
                          </label>
                          {selectedElement.src && (
                            <button onClick={() => updateSelectedElement({ src: undefined })} className="text-[10px] font-bold text-red-600 w-full text-center hover:underline mt-1">Remove Image</button>
                          )}
                        </div>
                      </>
                    )}

                    {(selectedElement.type === "image" || selectedElement.type === "badge") && (
                      <div>
                        <label className="btn-secondary uppercase tracking-widest font-bold w-full justify-center cursor-pointer text-xs py-2 bg-white">
                          <ImageIcon size={14} className="mr-2" /> {selectedElement.type === "badge" ? "Upload Custom Seal" : "Upload Graphic"}
                          <input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => updateSelectedElement({ src: event.target?.result as string });
                            reader.readAsDataURL(file);
                          }} className="hidden" />
                        </label>
                        {selectedElement.src && (
                          <button onClick={() => updateSelectedElement({ src: undefined })} className="text-[10px] font-bold text-red-600 w-full text-center hover:underline mt-1">Remove Graphic</button>
                        )}
                      </div>
                    )}

                    {selectedElement.type === "shape" && (
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Color</label>
                        <input type="color" className="w-full h-[34px] p-0 border-2 border-blue-900 bg-white" value={selectedElement.color || "#000000"} onChange={(e) => updateSelectedElement({ color: e.target.value })} />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-900/30">
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">X Position</label>
                        <input type="number" className="w-full p-1.5 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.x} onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Y Position</label>
                        <input type="number" className="w-full p-1.5 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.y} onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest mb-1 block">Width</label>
                        <input type="number" className="w-full p-1.5 border-2 border-blue-900 text-xs font-bold bg-white focus:outline-none" value={selectedElement.width} onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 text-gray-400">
                    <MousePointer2 size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest">Select an element on the canvas to edit its properties.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="json"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="h-full flex flex-col"
              >
                <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between shrink-0">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Code2 size={16} /> JSON Schema
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(jsonText);
                        alert("JSON copied to clipboard!");
                      }} 
                      className="btn-secondary text-[10px] px-3 py-1.5"
                    >
                      Copy JSON
                    </button>
                    <label className="btn-secondary text-[10px] px-3 py-1.5 cursor-pointer m-0">
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
                    className="w-12 shrink-0 bg-gray-100 text-gray-400 font-mono text-[10px] text-right py-4 pr-2 select-none overflow-hidden border-r-2 border-black"
                    id="line-numbers"
                    style={{ lineHeight: '1.5' }}
                  >
                    {jsonText.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea 
                    className="flex-1 p-4 bg-white text-black font-mono text-[10px] focus:outline-none resize-none overflow-auto whitespace-pre" 
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
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Live Canvas Builder */}
        <div className="lg:col-span-8 flex flex-col min-h-0 bg-white border-2 border-black overflow-hidden relative">
          
          {/* Builder Toolbar */}
          <div className="p-3 border-b-2 border-black flex flex-wrap items-center justify-between gap-2 bg-gray-50 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => addElement("staticText", "New Heading")} className="btn-secondary text-[10px] px-3 py-1.5"><Type size={12} className="mr-1" /> Text</button>
              <button onClick={() => addElement("dynamicText", "recipientName")} className="btn-secondary text-[10px] px-3 py-1.5"><Database size={12} className="mr-1" /> Data Field</button>
              <button onClick={() => addElement("signature", "Signatory Name|Title Here")} className="btn-secondary text-[10px] px-3 py-1.5"><Type size={12} className="mr-1" /> Signature</button>
              <button onClick={() => addElement("badge")} className="btn-secondary text-[10px] px-3 py-1.5"><Stamp size={12} className="mr-1" /> Seal/Badge</button>
              <button onClick={() => addElement("image")} className="btn-secondary text-[10px] px-3 py-1.5"><ImageIcon size={12} className="mr-1" /> Image</button>
              <button onClick={() => addElement("shape")} className="btn-secondary text-[10px] px-3 py-1.5"><Move size={12} className="mr-1" /> Divider Line</button>
              <button onClick={() => addElement("qrCode")} className="btn-secondary text-[10px] px-3 py-1.5"><QrCode size={12} className="mr-1" /> QR</button>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="flex-1 min-h-0 relative flex items-center justify-center bg-gray-200 overflow-hidden" 
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedElementId(null); }}
          >
            
            <div 
              className="w-[3508px] h-[2480px] shrink-0 relative bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] border border-gray-300"
              style={{
                transform: `scale(${scale})`,
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
                if (el.type === "dynamicText") {
                  displayText = `{${el.text}}`; // Visual indicator it's dynamic
                }

                return (
                  <CanvasDraggableElement 
                    key={el.id} 
                    el={el} 
                    isSelected={isSelected} 
                    displayText={displayText} 
                    setSelectedElementId={setSelectedElementId} 
                    updateSelectedElement={updateSelectedElement} 
                    scale={scale}
                  />
                );
              })}
            </div>

            {/* Floating Scale Indicator */}
            <div className="absolute bottom-0 right-0 z-50 pointer-events-none">
              <span className="text-[10px] font-bold text-black border-t-2 border-l-2 border-black px-2 py-1 uppercase tracking-widest bg-white whitespace-nowrap block">
                3508 x 2480 px (Scale: {Math.round(scale * 100)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasDraggableElement({ el, isSelected, displayText, setSelectedElementId, updateSelectedElement, scale }: any) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return; // Don't drag while editing
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return; // Ignore resize handle
    
    e.stopPropagation();
    setSelectedElementId(el.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = el.x;
    const startElY = el.y;
    let isDragging = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      isDragging = true;
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      updateSelectedElement({ x: startElX + dx, y: startElY + dy });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (el.type === 'staticText') {
      setIsEditing(true);
    }
  };

  return (
    <div 
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      style={{ 
        position: "absolute", 
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        cursor: isEditing ? "text" : "move", 
        border: isSelected ? "2px solid #1e3a8a" : "1px dashed transparent", 
        padding: "2px",
        fontSize: `${el.fontSize || 16}px`,
        fontFamily: el.fontFamily || "var(--font-sans, sans-serif)",
        color: el.color || "#000000",
        textAlign: (el.align as any) || "left",
        fontWeight: el.fontWeight || "normal",
        fontStyle: el.fontStyle || "normal",
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
        lineHeight: 1,
        whiteSpace: "pre-wrap",
        zIndex: isSelected ? 50 : 10,
        touchAction: "none",
        backgroundColor: el.type === 'shape' ? (el.color || '#000000') : 'transparent'
      }}
      className={isSelected ? "bg-blue-50/10" : "hover:border-gray-300"}
    >
      {el.type === 'qrCode' ? (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center border-4 border-black flex-col pointer-events-none">
          <QrCode size={120} className="text-gray-400 mb-4" />
          <span className="font-bold text-gray-500 uppercase tracking-widest" style={{ fontSize: '48px' }}>QR Code</span>
        </div>
      ) : el.type === 'image' || el.type === 'badge' ? (
        <div className="w-full h-full pointer-events-none flex items-center justify-center">
          {el.src ? (
            <img src={el.src} alt="" className="w-full h-full object-contain" />
          ) : el.type === 'badge' ? (
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
              <path d="M 30 70 L 30 115 L 50 100 L 70 115 L 70 70 Z" fill="#b45309" />
              <circle cx="50" cy="50" r="45" fill="#d97706" />
              <circle cx="50" cy="50" r="38" fill="#f59e0b" />
              <circle cx="50" cy="50" r="36" fill="none" stroke="#fef3c7" strokeWidth="2" strokeDasharray="4,4" />
              <path d="M 40 50 L 47 57 L 60 40" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
             <div className="w-full h-full bg-gray-200 flex items-center justify-center border-4 border-dashed border-gray-400 text-gray-400">
               <ImageIcon size={120} />
             </div>
          )}
        </div>
      ) : el.type === 'signature' ? (
        <div className="w-full h-full pointer-events-none flex flex-col items-center justify-end">
          {el.src ? (
            <img src={el.src} alt="Signature" style={{ maxWidth: "100%", maxHeight: "70%", objectFit: "contain", marginBottom: "10px" }} />
          ) : (
            <div style={{ fontFamily: el.fontFamily || "var(--font-script, cursive)", fontSize: el.fontSize ? `${el.fontSize * 1.5}px` : "90px", color: el.color || "#000", marginBottom: "0px", fontStyle: "italic", lineHeight: 1 }}>
              {el.text ? el.text.split('|')[0] : "Signatory Name"}
            </div>
          )}
          <div style={{ borderTop: `2px solid ${el.color || '#000'}`, width: "100%", paddingTop: "5px", marginTop: "5px", fontSize: el.fontSize ? `${el.fontSize * 0.3}px` : "20px", color: el.color || "#000", fontFamily: "var(--font-sans, sans-serif)", textAlign: "center", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "bold" }}>
            {el.text ? el.text.split('|')[1] : "Title"}
          </div>
        </div>
      ) : el.type === 'shape' ? null : isEditing ? (
        <textarea
          autoFocus
          className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden"
          style={{ 
             fontSize: 'inherit', fontFamily: 'inherit', color: 'inherit', textAlign: 'inherit',
             fontWeight: 'inherit', fontStyle: 'inherit', lineHeight: 'inherit'
          }}
          value={el.text || ''}
          onChange={(e) => updateSelectedElement({ text: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => { if(e.key === 'Escape') setIsEditing(false) }}
          onPointerDown={(e) => e.stopPropagation()} // Let user click inside textarea without dragging
        />
      ) : (
        <span className="pointer-events-none block w-full">{displayText}</span>
      )}
      
      {/* Width resize handle (Side) */}
      {isSelected && !isEditing && (
        <div 
          className="resize-handle absolute -right-10 top-1/2 -translate-y-1/2 cursor-col-resize w-20 h-20 bg-blue-900 shadow-md border-4 border-white z-50"
          onPointerDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startWidth = el.width;
            const onMouseMove = (moveEvent: PointerEvent) => {
              const newWidth = Math.max(50, startWidth + ((moveEvent.clientX - startX) / scale));
              updateSelectedElement({ width: newWidth });
            };
            const onMouseUp = () => {
              window.removeEventListener('pointermove', onMouseMove);
              window.removeEventListener('pointerup', onMouseUp);
            };
            window.addEventListener('pointermove', onMouseMove);
            window.addEventListener('pointerup', onMouseUp);
          }}
        />
      )}

      {/* Proportional resize handle (Corner) */}
      {isSelected && !isEditing && (
        <div 
          className="resize-handle absolute -right-10 -bottom-10 cursor-se-resize w-20 h-20 bg-blue-900 shadow-md border-4 border-white z-50"
          onPointerDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startWidth = el.width;
            const startFontSize = el.fontSize || 16;
            const onMouseMove = (moveEvent: PointerEvent) => {
              const newWidth = Math.max(50, startWidth + ((moveEvent.clientX - startX) / scale));
              if (el.type === 'qrCode' || el.type === 'image') {
                updateSelectedElement({ width: newWidth, height: newWidth });
              } else {
                const ratio = newWidth / startWidth;
                const newFontSize = Math.max(8, Math.round(startFontSize * ratio));
                updateSelectedElement({ width: newWidth, fontSize: newFontSize });
              }
            };
            const onMouseUp = () => {
              window.removeEventListener('pointermove', onMouseMove);
              window.removeEventListener('pointerup', onMouseUp);
            };
            window.addEventListener('pointermove', onMouseMove);
            window.addEventListener('pointerup', onMouseUp);
          }}
        />
      )}
    </div>
  );
}

