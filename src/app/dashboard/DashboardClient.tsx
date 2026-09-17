"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  ShieldCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2,
  Ban,
  Trash2,
  X,
  Loader2,
  Stamp,
  BookOpen,
  Filter,
  MoreVertical,
  Activity
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

interface StatsData {
  totalCertificates: number;
  validCertificates: number;
  revokedCertificates: number;
  totalTemplates: number;
  validationRate: number;
  chartData?: any[];
}

export default function DashboardClient({
  initialCertificates,
  initialStats,
}: {
  initialCertificates: CertificateItem[];
  initialStats: StatsData;
}) {
  const [certificates, setCertificates] = useState<CertificateItem[]>(initialCertificates);
  const [stats, setStats] = useState<StatsData>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const fetchCertificates = async () => {
    try {
      const res = await fetch(`/api/certificates?search=${encodeURIComponent(searchTerm)}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setCertificates(data);
      }
      const statsRes = await fetch("/api/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.error("Error refreshing ledger:", e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCertificates();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportCsv = () => {
    if (certificates.length === 0) return showToast("No certificates to export", "error");
    const headers = ["ID", "Recipient Name", "Email", "Role", "Issue Date", "Status", "Template"];
    const rows = certificates.map(c => [
      c.id,
      `"${c.recipientName}"`,
      `"${c.recipientEmail || ''}"`,
      `"${c.role || ''}"`,
      new Date(c.issueDate).toLocaleDateString(),
      c.status,
      `"${c.template?.name || ''}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `shim_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        fetchCertificates();
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
        fetchCertificates();
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

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/validate/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 py-6 min-h-0 overflow-hidden">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-black tracking-tighter uppercase leading-none mb-2">Overview</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Manage your event credentials and templates</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            className="btn-secondary flex items-center gap-2 bg-white uppercase tracking-widest text-xs font-bold" 
            onClick={handleExportCsv}
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <Link href="/dashboard/templates" className="btn-secondary flex items-center gap-2 bg-white uppercase tracking-widest text-xs font-bold">
            <Stamp size={16} />
            <span className="hidden sm:inline">Templates</span>
          </Link>
          <Link href="/dashboard/generate" className="btn-primary flex items-center gap-2 uppercase tracking-widest text-xs font-bold">
            <Plus size={16} />
            <span>Issue Credential</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
        {[
          { 
            label: "Total Issued", 
            value: stats.totalCertificates, 
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="9" height="9" />
                <rect x="13" y="13" width="9" height="9" />
                <rect x="2" y="13" width="9" height="9" fillOpacity="0.3" />
                <rect x="13" y="2" width="9" height="9" fillOpacity="0.3" />
              </svg>
            )
          },
          { 
            label: "Valid Standing", 
            value: stats.validCertificates, 
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="10,18 4,12 7,9 10,12 18,4 21,7" />
              </svg>
            )
          },
          { 
            label: "Revoked", 
            value: stats.revokedCertificates, 
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="21,5 19,3 12,10 5,3 3,5 10,12 3,19 5,21 12,14 19,21 21,19 14,12" />
              </svg>
            )
          },
          { 
            label: "Validation Rate", 
            value: `${stats.validationRate}%`, 
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="14" width="5" height="8" />
                <rect x="9" y="8" width="5" height="14" />
                <rect x="16" y="2" width="5" height="20" />
              </svg>
            )
          },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border-2 border-black p-5 flex flex-col justify-between min-h-[140px] relative group overflow-hidden">
            {/* Background decorative element on hover */}
            <div className="absolute -right-8 -top-8 text-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-[3]">
              {stat.icon}
            </div>
            
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="text-sm font-bold text-black uppercase tracking-widest leading-tight max-w-[70%]">
                {stat.label}
              </div>
              <div className="text-black">
                {stat.icon}
              </div>
            </div>
            
            <div className="text-5xl font-black text-black tracking-tighter mt-6 relative z-10">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Ledger & Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Col: Ledger Table */}
        <div className="xl:col-span-2 bg-white border-2 border-black overflow-hidden flex flex-col h-full min-h-0">
          
          {/* Table Header & Controls */}
          <div className="p-6 border-b-2 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
            <div>
              <h2 className="text-xl font-bold text-black tracking-tighter uppercase">Credential Ledger</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {/* Filter */}
              <div className="flex bg-white border-2 border-black p-0.5 w-full sm:w-auto">
                {["all", "valid", "revoked"].map((filter) => (
                  <button 
                    key={filter}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                      statusFilter === filter 
                        ? "bg-black text-white" 
                        : "text-gray-500 hover:text-black hover:bg-gray-100"
                    }`}
                    onClick={() => setStatusFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                <input 
                  type="text" 
                  placeholder="Search recipient..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 pr-8 py-2 text-xs font-bold tracking-wide uppercase h-auto bg-white border-2 border-black focus:"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-red-600 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center overflow-y-auto overflow-x-hidden">
                <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center mb-6">
                  <BookOpen size={24} className="text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black uppercase tracking-tighter mb-2">No credentials found</h3>
                <p className="text-gray-500 font-medium max-w-sm mb-8">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter settings." 
                    : "You haven't issued any credentials yet. Issue your first certificate to get started."}
                </p>
                {/* Intentionally left empty - actions are in the header */}
              </div>
            ) : (
              <>
                <div className="overflow-y-scroll overflow-x-hidden invisible-scrollbar bg-gray-50 border-b-2 border-black shrink-0">
                  <table className="table-modern w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-[28%] px-4 py-2 !border-b-0">Recipient</th>
                        <th className="w-[22%] px-4 py-2 !border-b-0">Role / Template</th>
                        <th className="w-[12%] px-4 py-2 !border-b-0">Date</th>
                        <th className="w-[15%] px-4 py-2 !border-b-0">Status</th>
                        <th className="w-[23%] px-4 py-2 text-right !border-b-0">Actions</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="overflow-y-scroll overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y-2 divide-gray-100">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="border-b-2 border-black hover:bg-gray-100 transition-colors bg-white">
                      <td className="w-[28%] px-4 py-3 overflow-hidden">
                        <div className="font-bold text-sm text-black mb-1 truncate" title={cert.recipientName}>{cert.recipientName}</div>
                        <div className="text-xs font-mono text-gray-500 truncate" title={cert.recipientEmail || "No email"}>{cert.recipientEmail || "No email"}</div>
                      </td>
                      <td className="w-[22%] px-4 py-3 overflow-hidden">
                        <div className="font-bold text-sm text-black mb-1 uppercase tracking-wide truncate" title={cert.role || "Participant"}>{cert.role || "Participant"}</div>
                        <div className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-500 truncate" title={cert.template?.name || "Standard Template"}>
                          {cert.template?.name || "Standard Template"}
                        </div>
                      </td>
                      <td className="w-[12%] px-4 py-3">
                        <div className="text-sm font-bold text-gray-600 font-mono">
                          {new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                        </div>
                      </td>
                      <td className="w-[15%] px-4 py-3">
                        <div className="flex items-center h-full">
                          {cert.status === "valid" ? (
                            <span className="badge-valid">
                              <CheckCircle2 size={12} /> VALID
                            </span>
                          ) : (
                            <span className="badge-revoked">
                              <Ban size={12} /> REVOKED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="w-[23%] px-4 py-3 text-right">
                        <div className="flex items-center justify-end h-full">
                          <div className="inline-flex border-2 border-black bg-white shrink-0">
                            {confirmDeleteId === cert.id ? (
                              <div className="flex items-center">
                                <span className="w-14 text-[10px] font-bold text-red-700 bg-red-100 uppercase tracking-widest border-r-2 border-black h-7 flex items-center justify-center shrink-0">
                                  SURE?
                                </span>
                                <button
                                  onClick={() => handleDeleteCertificate(cert.id)}
                                  className="w-7 h-7 bg-red-600 text-white hover:bg-red-700 transition-colors border-r-2 border-black flex items-center justify-center shrink-0"
                                >
                                  {updatingId === cert.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="w-7 h-7 bg-white text-black hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <button
                                  onClick={() => handleCopyLink(cert.id)}
                                  className="w-7 h-7 border-r-2 border-black text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center shrink-0"
                                  title="Copy public link"
                                >
                                  {copiedId === cert.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                                
                                <Link 
                                  href={`/validate/${cert.id}`} 
                                  target="_blank"
                                  className="w-7 h-7 border-r-2 border-black text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center shrink-0"
                                  title="Open public view"
                                >
                                  <ExternalLink size={14} />
                                </Link>

                                <button
                                  onClick={() => handleToggleStatus(cert.id, cert.status)}
                                  disabled={updatingId === cert.id}
                                  className="w-7 h-7 border-r-2 border-black text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center shrink-0"
                                  title={cert.status === "valid" ? "Revoke Credential" : "Restore Credential"}
                                >
                                  {updatingId === cert.id ? <Loader2 size={14} className="animate-spin" /> : cert.status === "valid" ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                                </button>

                                <button
                                  onClick={() => setConfirmDeleteId(cert.id)}
                                  disabled={updatingId === cert.id}
                                  className="w-7 h-7 text-black hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center shrink-0"
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
              </>
            )}
          </div>
        </div>

        {/* Right Col: Analytics Chart */}
        <div className="bg-white border-2 border-black flex flex-col h-full min-h-0">
          <div className="p-6 border-b-2 border-black shrink-0">
            <h3 className="text-xl font-bold text-black tracking-tighter uppercase flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                <polyline points="2 20 8 10 14 14 22 4" />
              </svg>
              Issuance Analytics
            </h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Monthly generation volume</p>
          </div>
          
          <div className="p-6 flex-1 min-h-0 w-full">
            {stats.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <pattern id="brutalistPattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#000000" strokeWidth="4" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={false} tick={{ fontSize: 11, fill: "#000", fontWeight: "bold", fontFamily: "monospace" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#000", fontWeight: "bold", fontFamily: "monospace" }} />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: "12px", 
                      borderRadius: "0px", 
                      border: "2px solid #000",
                      fontWeight: "bold",
                      textTransform: "uppercase"
                    }} 
                  />
                  <Area type="step" dataKey="issued" stroke="#000000" strokeWidth={4} fillOpacity={1} fill="url(#brutalistPattern)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter" className="mb-4 opacity-50 text-black">
                  <polyline points="2 20 8 10 14 14 22 4" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Not enough data</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t-2 border-black mt-auto text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-black mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="10" width="16" height="12" />
                <path d="M7 10V6a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
              </svg>
              System Secure
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
              Ledger synced cryptographically
            </div>
          </div>
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
            className={`fixed bottom-6 right-6 z-50 p-4 border-[3px] border-black ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-400 text-black'
            } flex items-center gap-3`}
          >
            {toast.type === 'error' ? <X size={20} strokeWidth={3} /> : <Check size={20} strokeWidth={3} />}
            <span className="font-bold uppercase tracking-widest text-sm">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
