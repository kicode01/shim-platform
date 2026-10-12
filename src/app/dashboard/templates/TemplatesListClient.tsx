"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Stamp, Edit3, Trash2, FileSpreadsheet, Maximize2, X, Sparkles, Loader2, Search, Eye } from "lucide-react";
import CertificateView, { CertificateDesignConfig } from "@/components/CertificateView";
import { motion, AnimatePresence } from "framer-motion";

interface TemplateItem {
  id: string;
  name: string;
  description?: string | null;
  designData: string;
  createdAt: string;
  _count?: { certificates: number };
}

export default function TemplatesListClient({ initialTemplates }: { initialTemplates: TemplateItem[] }) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inspectingTemplate, setInspectingTemplate] = useState<TemplateItem | null>(null);

  const executeDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        setConfirmDeleteId(null);
      } else {
        const data = await res.json();
        setDeleteError(data.message || "Failed to delete template");
      }
    } catch (e) {
      console.error(e);
      setDeleteError("Error deleting template");
    } finally {
      setDeletingId(null);
    }
  };



  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight">
              Certificate Templates
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {templates.length}
            </span>
          </div>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">
            Design and manage visual layouts for your event credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Mobile & Desktop Instant Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 shadow-xs"
            />
          </div>
          <Link href="/dashboard/templates/new" className="btn-primary shrink-0 py-2 px-3.5 sm:px-4 text-xs sm:text-sm">
            <Plus size={15} />
            <span>New Template</span>
          </Link>
        </div>
      </div>

      {/* Templates Grid / List */}
      {templates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border border-zinc-200 rounded-xl shadow-sm min-h-0">
          <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center mb-6">
            <Stamp size={28} className="text-zinc-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-700 mb-2">No templates created yet</h2>
          <p className="text-zinc-500 font-medium max-w-md mx-auto mb-8 text-sm">
            Create your first event credential design using our visual builder.
          </p>
          <Link href="/dashboard/templates/new" className="btn-primary px-6 py-3">
            <Plus size={16} />
            <span>Create First Template</span>
          </Link>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-white border border-zinc-200 rounded-xl shadow-sm min-h-0">
          <p className="text-sm font-semibold text-zinc-700 mb-1">No matching templates found</p>
          <p className="text-xs text-zinc-500 mb-4">Try searching with a different term.</p>
          <button onClick={() => setSearchQuery("")} className="btn-secondary text-xs px-3 py-1.5">
            Clear Search
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1 pb-16 lg:pb-0">
          
          {/* ================= MOBILE CARDS (lg:hidden) ================= */}
          <div className="lg:hidden flex flex-col gap-4">
            {filteredTemplates.map(t => {
              let parsedDesign: CertificateDesignConfig = {};
              try { parsedDesign = JSON.parse(t.designData); } catch (e) {}

              return (
                <div
                  key={t.id}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-4 pb-2.5 flex items-start justify-between gap-2 border-b border-zinc-100/80">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-zinc-800 leading-tight truncate">
                        {t.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                        {t.description || "Custom certificate template layout."}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200/60">
                      {t._count?.certificates || 0} Issued
                    </span>
                  </div>

                  {/* Certificate Specimen Thumbnail Frame */}
                  <div
                    className="p-3 cursor-pointer group"
                    onClick={() => setInspectingTemplate(t)}
                  >
                    <div className="relative w-full aspect-[1.414/1] bg-zinc-50 border border-zinc-200/80 rounded-xl overflow-hidden shadow-xs">
                      <CertificateView 
                        certificateId={`PREVIEW-${t.id.slice(0, 4).toUpperCase()}`}
                        recipientName="Jane Doe"
                        role={t.name}
                        design={parsedDesign}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                        <span className="text-[11px] font-medium text-white flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                          <Eye size={12} /> Inspect Specimen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Tactile Action Buttons */}
                  {deleteError && confirmDeleteId === t.id && (
                    <div className="px-4 py-2 bg-red-50 text-red-700 text-xs font-medium text-center border-t border-zinc-100">
                      {deleteError}
                    </div>
                  )}
                  <div className="p-3 pt-0 flex items-center gap-2">
                    <Link
                      href={`/dashboard/templates/${t.id}`}
                      className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 size={14} /> Studio
                    </Link>
                    <Link
                      href={`/dashboard/generate?templateId=${t.id}`}
                      className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <FileSpreadsheet size={14} /> Issue
                    </Link>
                    {confirmDeleteId === t.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                        <button onClick={() => executeDelete(t.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
                          {deletingId === t.id ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                        </button>
                        <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="bg-white text-zinc-700 px-2 py-1.5 rounded-lg text-xs font-medium border border-zinc-200">
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(t.id); setDeleteError(null); }}
                        disabled={deletingId === t.id}
                        className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                        title="Delete Template"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ================= DESKTOP GRID (hidden lg:grid) ================= */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map(t => {
              let parsedDesign: CertificateDesignConfig = {};
              try {
                parsedDesign = JSON.parse(t.designData);
              } catch (e) {}

              return (
                <div 
                  key={t.id} 
                  className="flex flex-col border border-zinc-200 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Preview Container */}
                  <div 
                    className="bg-zinc-50 p-6 border-b border-zinc-100 relative group cursor-pointer flex items-center justify-center"
                    onClick={() => setInspectingTemplate(t)}
                  >
                    <div className="w-full aspect-[1.414/1] bg-white border border-zinc-200 shadow-sm relative duration-300 group-hover:scale-[1.02] rounded-sm overflow-hidden">
                      <CertificateView 
                        certificateId={`PREVIEW-${t.id.slice(0, 4).toUpperCase()}`}
                        recipientName="Jane Doe"
                        role={t.name}
                        design={parsedDesign}
                      />
                    </div>
                    <div className="absolute inset-0 bg-zinc-700/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <span className="bg-white text-zinc-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
                        <Maximize2 size={14} /> Expand Preview
                      </span>
                    </div>
                  </div>

                  {/* Info Block */}
                  <div className="p-5 bg-white flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-zinc-700 leading-tight line-clamp-1">
                        {t.name}
                      </h3>
                      <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                        {t._count?.certificates || 0} Issued
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 line-clamp-2">
                      {t.description || "Custom certificate template layout."}
                    </p>
                  </div>

                  {/* Actions */}
                  {deleteError && confirmDeleteId === t.id && (
                    <div className="px-4 py-2 bg-red-50 text-red-700 text-xs font-medium text-center border-t border-zinc-100">
                      {deleteError}
                    </div>
                  )}
                  <div className="flex border-t border-zinc-100 bg-white divide-x divide-zinc-100">
                    <Link 
                      href={`/dashboard/templates/${t.id}`} 
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
                    >
                      <Edit3 size={16} /> Edit
                    </Link>

                    <Link 
                      href={`/dashboard/generate?templateId=${t.id}`} 
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
                    >
                      <FileSpreadsheet size={16} /> Issue
                    </Link>

                    {confirmDeleteId === t.id ? (
                      <div className="flex-1 flex items-center justify-center gap-2 bg-red-50 p-2">
                        <span className="text-xs font-medium text-red-800">Sure?</span>
                        <button onClick={() => executeDelete(t.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center justify-center min-w-[40px] shadow-sm transition-colors">
                          {deletingId === t.id ? <Loader2 size={12} className="animate-spin" /> : "Yes"}
                        </button>
                        <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="bg-white hover:bg-zinc-100 text-zinc-700 px-2 py-1 rounded text-xs font-medium border border-zinc-200 shadow-sm transition-colors">
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(t.id); setDeleteError(null); }}
                        disabled={deletingId === t.id}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-zinc-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Specimen Inspector Modal */}
      <AnimatePresence>
        {inspectingTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 lg:p-10"
            onClick={() => setInspectingTemplate(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start px-6 py-5 border-b border-zinc-100 bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-700 mb-1">
                    {inspectingTemplate.name}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Previewing custom certificate template
                  </p>
                </div>

                <button 
                  onClick={() => setInspectingTemplate(null)}
                  className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* High-Resolution Certificate Render */}
              <div className="p-4 sm:p-6 md:p-10 bg-zinc-50 flex-1 overflow-y-auto flex items-center justify-center">
                <div className="w-full max-w-3xl mx-auto aspect-[1.414/1] bg-white rounded shadow-md overflow-hidden relative ring-1 border border-zinc-200 shrink-0">
                  <CertificateView 
                    certificateId={`PREVIEW-${inspectingTemplate.id.slice(0, 8).toUpperCase()}`}
                    recipientName="Jane Doe"
                    role={inspectingTemplate.name}
                    design={inspectingTemplate.designData}
                  />
                </div>
              </div>

              {/* Mobile & Desktop Action Bar in Modal */}
              <div className="p-4 bg-white border-t border-zinc-100 flex items-center gap-3 shrink-0">
                <Link
                  href={`/dashboard/templates/${inspectingTemplate.id}`}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit3 size={15} /> Edit in Studio
                </Link>
                <Link
                  href={`/dashboard/generate?templateId=${inspectingTemplate.id}`}
                  className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <FileSpreadsheet size={15} /> Issue With This
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
