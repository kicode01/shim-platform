"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2,
  Ban,
  Trash2,
  X,
  Loader2,
  BookOpen,
  Send
} from "lucide-react";

interface CertificateItem {
  id: string;
  recipientName: string;
  recipientEmail?: string | null;
  role?: string | null;
  issueDate: string;
  status: string;
  template?: { id: string; name: string };
  issuer?: { name?: string | null; email?: string | null };
}

const HoverMarquee = ({ text, className }: { text: string; className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scrollAmount, setScrollAmount] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const overflow = textRef.current.scrollWidth - containerRef.current.clientWidth;
        setScrollAmount(overflow > 0 ? overflow : 0);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden whitespace-nowrap group/marquee w-full ${className || ''}`}
      style={{ '--scroll-amount': `-${scrollAmount}px` } as React.CSSProperties}
    >
      <span 
        ref={textRef}
        className={`inline-block ${scrollAmount > 0 ? 'group-hover/marquee:[transform:translateX(var(--scroll-amount))] transition-transform duration-[3s] ease-linear' : 'truncate block'}`}
      >
        {text}
      </span>
      {scrollAmount > 0 && (
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent group-hover/marquee:opacity-0 transition-opacity z-10 pointer-events-none" />
      )}
    </div>
  );
};

export default function CredentialsClient({
  initialCertificates,
}: {
  initialCertificates: CertificateItem[];
}) {
  const [certificates, setCertificates] = useState<CertificateItem[]>(initialCertificates);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const fetchCertificates = async (search: string, status: string) => {
    setIsTabLoading(true);
    try {
      const res = await fetch(`/api/certificates?search=${encodeURIComponent(search)}&status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      }
    } catch (e) {
      console.error("Error refreshing ledger:", e);
    } finally {
      setIsTabLoading(false); // Remove artificial delay
    }
  };

  const isFirstMount = useRef(true);

  // Run with debounce when search or status filter changes (skip initial redundant fetch)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchCertificates(searchTerm, statusFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setUpdatingId(id);
    try {
      const newStatus = currentStatus === "valid" ? "revoked" : "valid";
      const res = await fetch(`/api/certificates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setCertificates(prev => prev.filter(c => c.id !== id));
        setConfirmDeleteId(null);
      } else {
        const data = await res.json();
        showToast(data.message || "Failed to delete credential.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error deleting credential record.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResendEmail = async (id: string) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/certificates/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Email resent.", "success");
      } else {
        showToast(data.error || data.message || "Failed to resend email.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error resending email.", "error");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyRef = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
        
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Filter */}
            <div className="mob-filter-row flex bg-zinc-100 rounded-2xl p-1 w-full sm:w-auto">
              {["all", "valid", "revoked"].map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <button 
                    key={filter}
                    className={`relative px-4 py-1.5 text-sm font-medium capitalize rounded-xl transition-colors duration-200 z-10 ${
                      isActive 
                        ? "bg-white text-zinc-800 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                    }`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:w-64 lg:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search recipient..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 text-sm h-auto"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content: desktop table + mobile card list */}
        <div className="flex-1 flex flex-col min-h-0">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center overflow-y-auto overflow-x-hidden">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center mb-6">
                <BookOpen size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold text-zinc-700 mb-2">No credentials found</h3>
              <p className="text-zinc-500 font-medium max-w-sm mb-8">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter settings." 
                  : "You haven't issued any credentials yet. Issue your first certificate to get started."}
              </p>
            </div>
          ) : (
            <>
              {/* ----- Desktop / tablet: the full table (hidden on phones) ----- */}
              <div className="hidden lg:flex flex-1 flex-col min-h-0">
                <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar bg-zinc-50 border-b border-zinc-200 shrink-0">
                  <table className="table-modern w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-[24%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">Recipient</th>
                        <th className="w-[30%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Role / Template</th>
                        <th className="w-[12%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Date</th>
                        <th className="w-[16%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">Status</th>
                        <th className="w-[18%] px-4 py-3 text-right !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y divide-zinc-100">
                  {isTabLoading ? (
                    <tr>
                      <td colSpan={5} className="h-[400px] text-center align-middle">
                        <div className="flex flex-col items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-4" />
                          <p className="text-zinc-500 font-medium">Loading credentials...</p>
                        </div>
                      </td>
                    </tr>
                  ) : certificates.map((cert) => (
                    <tr key={cert.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors bg-white group">
                      <td className="w-[24%] px-4 py-3 overflow-hidden align-middle">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 pr-4">
                            <div className="font-semibold text-sm text-zinc-800 mb-0.5 truncate" title={cert.recipientName}>{cert.recipientName}</div>
                            <div className="text-[13px] text-zinc-500 truncate" title={cert.recipientEmail || "No email"}>{cert.recipientEmail || "No email"}</div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => handleCopyRef(cert.id)} className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 transition-colors flex items-center justify-center" title="Copy cryptographic ref">
                              {copiedId === cert.id ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
                            </button>
                            <Link href={`/validate?id=${cert.id}`} target="_blank" className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 transition-colors flex items-center justify-center" title="Open public view">
                              <ExternalLink size={14} />
                            </Link>
                            {cert.recipientEmail && (
                              <button
                                onClick={() => handleResendEmail(cert.id)}
                                disabled={resendingId === cert.id}
                                className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 transition-colors flex items-center justify-center disabled:opacity-50"
                                title="Resend certificate email"
                              >
                                {resendingId === cert.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="w-[30%] px-4 py-3 align-middle text-center">
                        <HoverMarquee 
                          text={cert.role || "Participant"} 
                          className="font-medium text-[13px] text-zinc-700 mb-0.5 mx-auto max-w-full" 
                        />
                        <HoverMarquee 
                          text={cert.template?.name || "Standard Template"} 
                          className="text-[13px] text-zinc-500 mx-auto max-w-full" 
                        />
                      </td>
                      <td className="w-[12%] px-4 py-3 align-middle text-center">
                        <div suppressHydrationWarning className="text-[13px] font-medium text-zinc-600">
                          {new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" })}
                        </div>
                      </td>
                      <td className="w-[16%] px-4 py-3">
                        <div className="flex items-center justify-center h-full">
                          {cert.status === "valid" ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] leading-none font-bold tracking-wider uppercase text-zinc-600 bg-zinc-100 border border-zinc-200/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                              <span className="-translate-y-[1px]">VALID</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] leading-none font-bold tracking-wider uppercase text-zinc-400 bg-zinc-50 border border-zinc-200/50">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              <span className="-translate-y-[1px]">REVOKED</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="w-[18%] px-4 py-3 text-right">
                        <div className="flex items-center justify-end h-full">
                          <div className="inline-flex items-center gap-1">
                            {confirmDeleteId === cert.id ? (
                              <div className="flex items-center gap-1 bg-red-50 p-1 rounded-md border border-red-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 px-2 shrink-0">
                                  Sure?
                                </span>
                                <button
                                  onClick={() => handleDeleteCertificate(cert.id)}
                                  className="w-7 h-7 bg-red-600 rounded text-white hover:bg-red-700 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                                >
                                  {updatingId === cert.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="w-7 h-7 bg-white rounded text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                                >
                                  <X size={14} strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">

                                <button
                                  onClick={() => handleToggleStatus(cert.id, cert.status)}
                                  disabled={updatingId === cert.id}
                                  className="w-8 h-8 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors flex items-center justify-center shrink-0"
                                  title={cert.status === "valid" ? "Revoke Credential" : "Restore Credential"}
                                >
                                  {updatingId === cert.id ? <Loader2 size={14} className="animate-spin" /> : cert.status === "valid" ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                                </button>

                                <button
                                  onClick={() => setConfirmDeleteId(cert.id)}
                                  disabled={updatingId === cert.id}
                                  className="w-8 h-8 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                                  title="Delete permanently"
                                >
                                  {updatingId === cert.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </div>

              {/* ----- Mobile: stacked cards (hidden on desktop/tablet) ----- */}
              <div className="lg:hidden flex-1 overflow-y-auto overflow-x-hidden bg-white">
                {isTabLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-4" />
                    <p className="text-zinc-500 font-medium">Loading credentials...</p>
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <div key={cert.id} className="border-b border-zinc-100 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-zinc-800 truncate" title={cert.recipientName}>{cert.recipientName}</div>
                          <div className="text-[13px] text-zinc-500 truncate" title={cert.recipientEmail || "No email"}>{cert.recipientEmail || "No email"}</div>
                        </div>
                        {cert.status === "valid" ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] leading-none font-bold tracking-wider uppercase text-zinc-600 bg-zinc-100 border border-zinc-200/50 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="-translate-y-[1px]">VALID</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] leading-none font-bold tracking-wider uppercase text-zinc-400 bg-zinc-50 border border-zinc-200/50 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            <span className="-translate-y-[1px]">REVOKED</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] min-w-0">
                        <span className="font-medium text-zinc-700 truncate">{cert.role || "Participant"}</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-zinc-500 truncate">{cert.template?.name || "Standard Template"}</span>
                      </div>
                      <div suppressHydrationWarning className="mt-0.5 text-[12px] text-zinc-400">
                        {new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" })}
                      </div>

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleCopyRef(cert.id)} className="mob-card-action w-11 h-11 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors flex items-center justify-center shrink-0" title="Copy cryptographic ref">
                          {copiedId === cert.id ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} />}
                        </button>
                        <Link href={`/validate?id=${cert.id}`} target="_blank" className="mob-card-action w-11 h-11 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors flex items-center justify-center shrink-0" title="Open public view">
                          <ExternalLink size={16} />
                        </Link>
                        {cert.recipientEmail && (
                          <button
                            onClick={() => handleResendEmail(cert.id)}
                            disabled={resendingId === cert.id}
                            className="mob-card-action w-11 h-11 rounded-md text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
                            title="Resend certificate email"
                          >
                            {resendingId === cert.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          </button>
                        )}
                        <div className="flex-1 min-w-[8px]" />
                        {confirmDeleteId === cert.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteCertificate(cert.id)}
                              className="mob-card-action h-11 px-3 rounded-md bg-red-600 text-white text-xs font-semibold flex items-center justify-center shrink-0"
                            >
                              {updatingId === cert.id ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="mob-card-action h-11 px-3 rounded-md border border-zinc-200 text-zinc-600 text-xs font-medium flex items-center justify-center shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(cert.id, cert.status)}
                              disabled={updatingId === cert.id}
                              className="mob-card-action h-11 px-3 rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-medium flex items-center justify-center shrink-0"
                              title={cert.status === "valid" ? "Revoke Credential" : "Restore Credential"}
                            >
                              {updatingId === cert.id ? <Loader2 size={16} className="animate-spin" /> : cert.status === "valid" ? "Revoke" : "Restore"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(cert.id)}
                              disabled={updatingId === cert.id}
                              className="mob-card-action w-11 h-11 rounded-md text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                              title="Delete permanently"
                            >
                              {updatingId === cert.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Brutalist Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border border-zinc-200 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            } flex items-center gap-3`}
          >
            {toast.type === 'error' ? <X size={20} strokeWidth={2} className="text-red-500" /> : <Check size={20} strokeWidth={2} className="text-emerald-500" />}
            <span className="font-medium text-sm">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
