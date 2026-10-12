"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Keyboard, QrCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CheckInClientProps {
  event: any;
}

export default function CheckInClient({ event }: CheckInClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [manualId, setManualId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error", message: string } | null>(null);

  const handleCheckIn = async (membershipId: string) => {
    if (loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/attendance/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, membershipId })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResult({ type: "success", message: `${data.member.name} successfully checked in!` });
        setManualId("");
        router.refresh(); // Refresh recent attendances
      } else {
        setResult({ type: "error", message: data.error || "Failed to check in." });
      }
    } catch (e) {
      setResult({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setLoading(false);
      // Clear result after 3 seconds
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div className="flex-1 px-4 py-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center gap-3.5 mb-6 md:mb-8">
        <Link 
          href={`/dashboard/events/${event.id}`}
          className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 active:scale-[0.98] transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-800 tracking-tight leading-tight">Event Check-in</h1>
          <p className="text-xs md:text-sm text-zinc-500 truncate max-w-[240px] sm:max-w-none">{event.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left Column: Scanner / Manual Entry */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden mb-8">
            <div className="flex border-b border-zinc-100">
              <button
                onClick={() => setMode("scan")}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === "scan" ? "text-zinc-800 border-b-2 border-zinc-800 bg-zinc-50/50" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"}`}
              >
                <QrCode size={16} /> Scan QR
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === "manual" ? "text-zinc-800 border-b-2 border-zinc-800 bg-zinc-50/50" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"}`}
              >
                <Keyboard size={16} /> Manual Entry
              </button>
            </div>

            <div className="p-6 md:p-8">
              {mode === "scan" ? (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-md mx-auto bg-zinc-950 rounded-2xl overflow-hidden relative border-4 border-zinc-100 shadow-inner">
                    <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                       <QrCode size={100} className="text-white" />
                    </div>
                    <Scanner 
                      onScan={(detectedCodes) => {
                        if (detectedCodes && detectedCodes.length > 0) {
                          const id = detectedCodes[0].rawValue;
                          if (!loading && !result) {
                            handleCheckIn(id);
                          }
                        }
                      }} 
                      formats={["qr_code"]}
                    />
                    {loading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-10 transition-all">
                         <Loader2 size={32} className="text-white animate-spin mb-3" />
                         <span className="text-white font-medium text-sm">Verifying...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 mt-5 text-center font-medium">
                    Point your camera at a member's QR code.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-zinc-800 mb-2">Member ID</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="e.g. MEMBER-123"
                      className="flex-1 h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent transition-all"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && manualId && handleCheckIn(manualId)}
                    />
                    <button
                      onClick={() => handleCheckIn(manualId)}
                      disabled={!manualId || loading}
                      className="h-12 px-8 bg-zinc-800 text-white text-sm font-semibold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {loading && <Loader2 size={16} className="animate-spin" />}
                      Check In
                    </button>
                  </div>
                </div>
              )}

              {/* Result Message */}
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    key={result.message}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`mt-6 p-4 rounded-xl flex items-center gap-3 shadow-sm ${
                      result.type === "success" 
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-800" 
                        : "bg-red-50 border border-red-100 text-red-800"
                    }`}
                  >
                    {result.type === "success" ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" /> : <XCircle size={20} className="text-red-600 shrink-0" />}
                    <p className="text-sm font-semibold">{result.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Check-ins */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex flex-col h-full bg-zinc-50/50 rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Check-ins
              </h3>
              <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">{event.attendances.length} Total</span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {event.attendances.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                    <QrCode size={20} className="text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-800">Waiting for scans</p>
                  <p className="text-xs text-zinc-400 mt-1">Checked-in members will appear here</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {event.attendances.map((att: any, idx: number) => (
                    <motion.div 
                      key={att.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-3 bg-white border border-zinc-200 rounded-xl flex items-center justify-between hover:border-zinc-300 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
                          {att.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="text-sm font-semibold text-zinc-800 truncate">{att.name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{att.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-[10px] font-bold text-zinc-400 mb-0.5">
                          {new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 size={8} /> IN
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
