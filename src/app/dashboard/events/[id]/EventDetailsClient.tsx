"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Select } from "@/components/ui/Select";
import { ArrowLeft, Download, CheckCircle2, CircleDashed, Users, Calendar, Search, X, Settings2, Save, Loader2, LayoutTemplate, Trash2, ShieldAlert, QrCode } from "lucide-react";

interface AttendeeItem {
  id: string;
  name: string;
  email: string;
  role: string;
  checkedInAt: string;
  hasCertificate: boolean;
  certificateId?: string;
  certificateStatus?: string;
}

interface EventItem {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  defaultRole: string;
  defaultTemplateId: string | null;
}

interface TemplateItem {
  id: string;
  name: string;
}

export default function EventDetailsClient({ 
  event: initialEvent, 
  attendances,
  templates
}: { 
  event: EventItem, 
  attendances: AttendeeItem[],
  templates: TemplateItem[] 
}) {
  const router = useRouter();
  const [activeMobileTab, setActiveMobileTab] = useState<"roster" | "settings">("roster");
  const [searchTerm, setSearchTerm] = useState("");
  const [event, setEvent] = useState(initialEvent);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const filtered = attendances.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        router.push("/dashboard/events");
        router.refresh();
      } else {
        alert("Failed to delete event");
        setIsDeleting(false);
      }
    } catch (e) {
      alert("Error deleting event");
      setIsDeleting(false);
    }
  };

  const toggleRevoke = async (att: AttendeeItem) => {
    if (!att.certificateId) return;
    setRevokingId(att.certificateId);
    
    try {
      const res = await fetch(`/api/certificates/${att.certificateId}/revoke`, {
        method: "PUT"
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred");
    } finally {
      setRevokingId(null);
    }
  };

  const handleExportCsv = () => {
    if (attendances.length === 0) return;
    const headers = ["name", "email", "role"];
    const rows = filtered.map(a => [
      `"${a.name}"`,
      `"${a.email}"`,
      `"${a.role}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendees_${event.name.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: event.name,
          date: event.date,
          description: event.description,
          defaultRole: event.defaultRole,
          defaultTemplateId: event.defaultTemplateId
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert("Failed to save settings");
      }
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mob-scroll-pane flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 min-h-0 overflow-hidden">
      
      {/* Header (Template Studio Style) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-6 shrink-0">
        <div>
          <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors mb-4">
            <ArrowLeft size={16} /> Back to Events
          </Link>
          <h1 className="text-3xl font-bold text-zinc-700 flex items-center gap-3 mb-1">
            <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 shrink-0">
              <Users size={24} />
            </div>
            Event Studio
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Manage attendees and configure settings for {event.name}.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link 
            href={`/kiosk/${event.id}`}
            target="_blank"
            className="h-10 px-4 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <LayoutTemplate size={16} /> <span className="hidden sm:inline">Open Kiosk</span>
          </Link>
          <Link 
            href={`/scanner/${event.id}`}
            className="h-10 px-4 bg-zinc-700 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <QrCode size={16} /> <span className="hidden sm:inline">Check In</span>
          </Link>
          <button 
            onClick={handleExportCsv}
            disabled={attendances.length === 0}
            className="btn-secondary font-medium"
          >
            <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile App Segmented Control (Hidden on desktop/tablet lg) */}
      <div className="lg:hidden flex p-1 bg-zinc-100 rounded-xl mb-6 border border-zinc-200/80 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab("roster")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMobileTab === "roster"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Users size={14} />
          <span>Attendees ({attendances.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab("settings")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMobileTab === "settings"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Settings2 size={14} />
          <span>Settings</span>
        </button>
      </div>

      {/* Split Layout: Attendees (Left) & Settings (Right) */}
      <div className="mob-flow flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left: Attendees Viewer */}
        <div className={`mob-flow lg:col-span-8 flex-col min-h-0 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm relative ${
          activeMobileTab === "roster" ? "flex" : "hidden lg:flex"
        }`}>
          
          {/* Table Header & Search */}
          <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50 shrink-0">
            <div className="flex items-center gap-2 text-zinc-700 font-semibold text-sm">
              <Users size={18} className="text-zinc-500" />
              Attendees ({attendances.length})
            </div>

            <div className="relative w-full sm:w-auto min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-md focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 text-sm h-auto shadow-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mob-flow flex-1 flex flex-col min-h-0 bg-white">
            {attendances.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full text-zinc-400">
                <Users size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No one has checked in yet</p>
                <p className="text-xs mt-1">Attendees checking in via the Kiosk will appear here.</p>
              </div>
            ) : filtered.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center h-full text-zinc-400">
                <p className="text-sm font-medium">No attendees match your search.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards (Phones & small screens) */}
                <div className="mob-flow lg:hidden flex-1 min-h-0 overflow-y-auto bg-white divide-y divide-zinc-100">
                  {filtered.map((att) => (
                    <div key={att.id} className="p-4 flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-zinc-800 truncate">{att.name}</div>
                          <div className="text-xs text-zinc-500 truncate mt-0.5">{att.email}</div>
                        </div>
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                          {att.role}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-50 text-xs">
                        <span className="text-zinc-500">
                          {new Date(att.checkedInAt).toLocaleString("en-US", { 
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit" 
                          })}
                        </span>
                        <div>
                          {att.hasCertificate ? (
                            att.certificateStatus === "revoked" ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                  <ShieldAlert size={10} /> Revoked
                                </span>
                                <button
                                  onClick={() => toggleRevoke(att)}
                                  disabled={revokingId === att.certificateId}
                                  className="text-[11px] uppercase font-bold text-zinc-600 underline disabled:opacity-50"
                                >
                                  {revokingId === att.certificateId ? "Wait..." : "Restore"}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={10} /> Issued
                                </span>
                                <button
                                  onClick={() => toggleRevoke(att)}
                                  disabled={revokingId === att.certificateId}
                                  className="text-[11px] uppercase font-bold text-red-600 underline disabled:opacity-50"
                                >
                                  {revokingId === att.certificateId ? "Wait..." : "Revoke"}
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                              <CircleDashed size={10} /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: original full table behind hidden lg:flex */}
                <div className="hidden lg:flex flex-1 flex-col min-h-0">
                  <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar bg-white border-b border-zinc-100 shrink-0">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr>
                          <th className="w-[35%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">Attendee</th>
                          <th className="w-[20%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">Role</th>
                          <th className="w-[25%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">Checked In</th>
                          <th className="w-[20%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">Status</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                    <table className="w-full table-fixed text-sm">
                      <tbody className="divide-y divide-zinc-100">
                        {filtered.map((att) => (
                          <tr key={att.id} className="hover:bg-zinc-50/80 transition-colors group">
                            <td className="w-[35%] px-5 py-3 overflow-hidden">
                              <div className="font-medium text-zinc-700 truncate">{att.name}</div>
                              <div className="text-zinc-500 truncate mt-0.5 text-xs">{att.email}</div>
                            </td>
                            <td className="w-[20%] px-5 py-3">
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/50">
                                {att.role}
                              </span>
                            </td>
                            <td className="w-[25%] px-5 py-3">
                              <div className="text-zinc-600 text-xs">
                                {new Date(att.checkedInAt).toLocaleString("en-US", { 
                                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit" 
                                })}
                              </div>
                            </td>
                            <td className="w-[20%] px-5 py-3">
                              {att.hasCertificate ? (
                                att.certificateStatus === "revoked" ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                                      <ShieldAlert size={10} /> Revoked
                                    </span>
                                    <button
                                      onClick={() => toggleRevoke(att)}
                                      disabled={revokingId === att.certificateId}
                                      className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-700 underline disabled:opacity-50"
                                    >
                                      {revokingId === att.certificateId ? "Wait..." : "Restore"}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 size={10} /> Issued
                                    </span>
                                    <button
                                      onClick={() => toggleRevoke(att)}
                                      disabled={revokingId === att.certificateId}
                                      className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 underline opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                    >
                                      {revokingId === att.certificateId ? "Wait..." : "Revoke"}
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  <CircleDashed size={10} /> Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Right: Administrative Settings */}
        <div className={`mob-flow lg:col-span-4 flex-col bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm ${
          activeMobileTab === "settings" ? "flex" : "hidden lg:flex"
        }`}>
          <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Settings2 size={18} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-700">Configuration</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                title="Delete Event"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
                    deleteTimeoutRef.current = setTimeout(() => setConfirmDelete(false), 3000);
                  } else {
                    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
                    setConfirmDelete(false);
                    handleDeleteEvent();
                  }
                }}
                className={`flex items-center justify-center h-8 text-xs font-semibold tracking-wide uppercase rounded-xl transition-all duration-200 overflow-hidden ${
                  confirmDelete 
                    ? "w-[80px] bg-[#dc2626] text-white hover:bg-red-700" 
                    : "w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                }`}
                disabled={isDeleting}
              >
                <AnimatePresence mode="wait">
                  {isDeleting ? (
                    <motion.div key="deleting" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                    </motion.div>
                  ) : confirmDelete ? (
                    <motion.span key="confirm" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                      Confirm
                    </motion.span>
                  ) : (
                    <motion.div key="delete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }} className="flex items-center gap-1.5">
                      <Trash2 size={14} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <div className="w-px h-4 bg-zinc-200 mx-1"></div>

              <button 
                title="Save Settings"
                onClick={handleSaveSettings} 
                className="flex items-center justify-center h-8 w-8 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shrink-0" 
                disabled={saving}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Event Name *</label>
              <input 
                type="text" 
                className="input-field py-2" 
                value={event.name} 
                onChange={(e) => setEvent({ ...event, name: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Event Date</label>
              <input 
                type="date" 
                className="input-field py-2" 
                value={event.date ? event.date.split("T")[0] : ""} 
                onChange={(e) => setEvent({ ...event, date: e.target.value ? new Date(e.target.value).toISOString() : null })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <textarea 
                className="input-field py-2" 
                rows={2}
                value={event.description || ""} 
                onChange={(e) => setEvent({ ...event, description: e.target.value })} 
                placeholder="Brief description of the event..."
              />
            </div>

            <div className="h-px bg-zinc-200 my-2"></div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Default Attendee Role</label>
              <p className="text-xs text-zinc-500 mb-2">The default role assigned when attendees scan the QR code.</p>
              <input 
                type="text" 
                className="input-field py-2" 
                value={event.defaultRole} 
                onChange={(e) => setEvent({ ...event, defaultRole: e.target.value })} 
                placeholder="e.g. Participant, Speaker, VIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Automated Kiosk Template</label>
              <p className="text-xs text-zinc-500 mb-2">Select a template to instantly issue certificates upon check-in.</p>
              <div className="relative">
                <Select
                  value={event.defaultTemplateId || ""}
                  onChange={(value) => setEvent({ ...event, defaultTemplateId: value || null })}
                  options={[
                    { value: "", label: "No Automated Issuance" },
                    ...templates.map(t => ({ value: t.id, label: t.name }))
                  ]}
                  placeholder="No Automated Issuance"
                  className="w-full"
                  dropdownClassName="w-full"
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
