"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Stamp, Edit3, Trash2, FileSpreadsheet, Maximize2, X, CheckCircle2, ShieldCheck, Sparkles, Loader2, LayoutTemplate } from "lucide-react";
import CertificateView, { CertificateDesignConfig } from "@/components/CertificateView";

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

  const getThemeInfo = (design: CertificateDesignConfig) => {
    switch (design?.theme) {
      case "emerald":
        return { name: "Emerald Pro", badgeColor: "text-emerald-700", bg: "bg-white", border: "border-black" };
      case "gold":
        return { name: "Amber Elite", badgeColor: "text-amber-700", bg: "bg-white", border: "border-black" };
      case "modern":
        return { name: "Modern Dark", badgeColor: "text-black", bg: "bg-white", border: "border-black" };
      default:
        return { name: "Indigo Classic", badgeColor: "text-indigo-700", bg: "bg-white", border: "border-black" };
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-6 min-h-0 overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-black tracking-tighter uppercase leading-none mb-2">
            Certificate Templates
          </h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
            Design and manage visual layouts for your event credentials.
          </p>
        </div>

        <Link href="/dashboard/templates/new" className="btn-primary uppercase tracking-widest font-bold flex items-center">
          <Plus size={16} className="mr-2" />
          <span>New Template</span>
        </Link>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white border-2 border-black min-h-0">
          <div className="w-20 h-20 bg-white border-2 border-black flex items-center justify-center mb-6">
            <Stamp size={32} className="text-black" />
          </div>
          <h2 className="text-3xl font-bold text-black mb-4 tracking-tighter uppercase">No templates created yet</h2>
          <p className="text-gray-500 font-medium max-w-md mx-auto mb-10 uppercase tracking-widest text-sm">
            Create your first event credential design using our visual builder.
          </p>
          <Link href="/dashboard/templates/new" className="btn-primary uppercase tracking-widest font-bold px-8 py-4 flex items-center">
            <Plus size={18} className="mr-2" />
            <span>Create First Template</span>
          </Link>
        </div>
      ) : (
        <div className="flex-1 overflow-y-scroll overflow-x-hidden min-h-0 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {templates.map(t => {
              let parsedDesign: CertificateDesignConfig = {};
              try {
                parsedDesign = JSON.parse(t.designData);
              } catch (e) {}

              const themeInfo = getThemeInfo(parsedDesign);

              return (
                <div 
                  key={t.id} 
                  className="flex flex-col border-2 border-black bg-white overflow-hidden"
                >
                  {/* Header Ribbon */}
                  <div className="flex justify-between items-center p-4 border-b-2 border-black bg-white">
                    <span className={`text-[0.65rem] font-bold uppercase tracking-widest px-2 py-1 ${themeInfo.bg} ${themeInfo.badgeColor} border-2 ${themeInfo.border}`}>
                      {themeInfo.name}
                    </span>
                    <span className="text-xs font-bold text-black uppercase tracking-widest">
                      {t._count?.certificates || 0} Issued
                    </span>
                  </div>

                  {/* Preview Container */}
                  <div 
                    className="bg-gray-100 p-6 border-b-2 border-black relative group cursor-pointer"
                    onClick={() => setInspectingTemplate(t)}
                  >
                    <div className="w-full aspect-[1.414/1] bg-white border-2 border-black relative duration-300 group-hover:scale-[1.02]">
                      <CertificateView 
                        certificateId={`PREVIEW-${t.id.slice(0, 4).toUpperCase()}`}
                        recipientName="Jane Doe"
                        role={t.name}
                        design={parsedDesign}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-transparent hover:border-white flex items-center gap-2">
                        <Maximize2 size={14} /> Expand
                      </span>
                    </div>
                  </div>

                  {/* Info Block */}
                  <div className="p-6 bg-white flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-black mb-2 leading-tight uppercase tracking-wide line-clamp-1">
                      {t.name}
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest line-clamp-2">
                      {t.description || "Custom certificate template layout."}
                    </p>
                  </div>

                  {/* Actions */}
                  {deleteError && confirmDeleteId === t.id && (
                    <div className="p-3 bg-red-600 text-white text-xs font-bold text-center border-t-2 border-black uppercase tracking-widest leading-relaxed">
                      {deleteError}
                    </div>
                  )}
                  <div className="flex border-t-2 border-black bg-white divide-x-2 divide-black">
                    <Link 
                      href={`/dashboard/templates/${t.id}`} 
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-black hover:bg-black hover:text-white uppercase tracking-widest transition-colors"
                    >
                      <Edit3 size={14} /> Edit
                    </Link>

                    <Link 
                      href={`/dashboard/generate?templateId=${t.id}`} 
                      className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-black hover:bg-black hover:text-white uppercase tracking-widest transition-colors"
                    >
                      <FileSpreadsheet size={14} /> Issue
                    </Link>

                    {confirmDeleteId === t.id ? (
                      <div className="flex-1 flex items-center justify-center gap-2 bg-red-100 p-2">
                        <span className="text-[10px] font-bold text-red-900 uppercase tracking-widest">Confirm?</span>
                        <button onClick={() => executeDelete(t.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold border-2 border-red-900 flex items-center justify-center min-w-[40px]">
                          {deletingId === t.id ? <Loader2 size={12} className="animate-spin" /> : "YES"}
                        </button>
                        <button onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }} className="bg-white hover:bg-gray-100 text-black px-3 py-1.5 text-xs font-bold border-2 border-black">
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeleteId(t.id); setDeleteError(null); }}
                        disabled={deletingId === t.id}
                        className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-black hover:bg-red-600 hover:text-white uppercase tracking-widest transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} /> Delete
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
      {inspectingTemplate && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-10 animate-fade-in"
          onClick={() => setInspectingTemplate(null)}
        >
          <div 
            className="w-full max-w-5xl bg-white border-4 border-black overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b-4 border-black bg-white shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-black uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles size={24} className="text-black" />
                  {inspectingTemplate.name}
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                  High-Resolution Specimen Preview
                </p>
              </div>

              <button 
                onClick={() => setInspectingTemplate(null)}
                className="p-3 border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* High-Resolution Certificate Render */}
            <div className="p-8 lg:p-12 bg-gray-100 flex-1 overflow-y-auto invisible-scrollbar flex items-center justify-center">
              <div className="w-full aspect-[1.414/1] bg-white border-4 border-black relative shrink-0">
                <CertificateView 
                  certificateId={`PREVIEW-${inspectingTemplate.id.slice(0, 8).toUpperCase()}`}
                  recipientName="Jane Doe"
                  role={inspectingTemplate.name}
                  eventId="Demonstrated exemplary mastery of algorithmic complexity, systems architecture, and ethical computing practice."
                  design={inspectingTemplate.designData}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
