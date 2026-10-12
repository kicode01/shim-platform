"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

type AuditLogType = {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  certificate: {
    id: string;
    recipientName: string;
    recipientEmail: string | null;
    event: {
      name: string;
    }
  } | null;
};

export default function AuditClient({ initialLogs }: { initialLogs: AuditLogType[] }) {
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleFilterChange = (f: string) => {
    setFilter(f);
  };

  const filters = ["All", "Issuance", "Verification", "Claims", "Revocations"];

  const filteredLogs = initialLogs.filter(log => {
    // Action filter
    if (filter === "Issuance" && log.action !== "ISSUED") return false;
    if (filter === "Verification" && log.action !== "VERIFIED") return false;
    if (filter === "Claims" && log.action !== "CLAIMED") return false;
    if (filter === "Revocations" && log.action !== "REVOKED") return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const targetMatch = log.certificate?.recipientName.toLowerCase().includes(term) || log.certificate?.event.name.toLowerCase().includes(term);
      const actionMatch = log.action.toLowerCase().includes(term);
      if (!targetMatch && !actionMatch) return false;
    }

    return true;
  });

  const getActionText = (action: string) => {
    switch (action) {
      case "ISSUED": return "Generated certificate";
      case "VERIFIED": return "Verification scan recorded";
      case "CLAIMED": return "Claimed certificate";
      case "REVOKED": return "Revoked certificate";
      default: return action;
    }
  };

  const getActorText = (action: string, ipAddress: string | null) => {
    switch (action) {
      case "ISSUED": return "System";
      case "VERIFIED": return ipAddress ? `Guest (${ipAddress})` : "Guest";
      case "CLAIMED": return ipAddress ? `Attendee (${ipAddress})` : "Attendee";
      case "REVOKED": return "Admin";
      default: return "System";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <>
      <div className="flex-1 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
        
        {/* Table Header & Controls */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {/* Filter */}
            <div className="mob-filter-row flex bg-zinc-100 rounded-lg p-1 w-full sm:w-auto overflow-x-auto scrollbar-hide">
              {filters.map((f) => {
                const isActive = filter === f;
                return (
                  <button 
                    key={f}
                    className={`relative px-4 py-1.5 text-sm font-medium whitespace-nowrap rounded-md transition-colors duration-200 z-10 ${
                      isActive 
                        ? "bg-white text-zinc-800 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"
                    }`}
                    onClick={() => handleFilterChange(f)}
                  >
                    {f}
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
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-200 text-zinc-700 rounded-md focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 text-sm h-auto"
            />
          </div>
        </div>

        {/* Content: desktop table + mobile card list */}
        <div className="flex-1 flex flex-col min-h-0">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center overflow-y-auto overflow-x-hidden">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center mb-6">
                <Search size={24} className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-bold text-zinc-700 mb-2">No logs found</h3>
              <p className="text-zinc-500 font-medium max-w-sm mb-8">
                {searchTerm || filter !== "All" 
                  ? "Try adjusting your search or filters." 
                  : "No activity has been recorded yet."}
              </p>
            </div>
          ) : (
            <>
              {/* ----- Desktop / tablet: full table ----- */}
              <div className="hidden lg:flex flex-1 flex-col min-h-0">
                <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar bg-zinc-50 border-b border-zinc-200 shrink-0">
                  <table className="table-modern w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-[20%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">Time</th>
                        <th className="w-[25%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actor</th>
                        <th className="w-[25%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                        <th className="w-[30%] px-4 py-3 !border-b-0 text-xs font-medium text-zinc-500 uppercase tracking-wider">Target</th>
                      </tr>
                    </thead>
                  </table>
                </div>
                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y divide-zinc-100">
                      {isPending ? (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-4" />
                              <p className="text-zinc-500 font-medium">Loading audit logs...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredLogs.map((log) => (
                        <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors bg-white">
                          <td className="w-[20%] px-4 py-3 overflow-hidden">
                            <div className="text-sm text-zinc-500 truncate" title={formatDate(log.createdAt)}>
                              {formatDate(log.createdAt)}
                            </div>
                          </td>
                          <td className="w-[25%] px-4 py-3 overflow-hidden">
                            <div className="font-medium text-sm text-zinc-700 truncate" title={getActorText(log.action, log.ipAddress)}>
                              {getActorText(log.action, log.ipAddress)}
                            </div>
                          </td>
                          <td className="w-[25%] px-4 py-3 overflow-hidden">
                            <div className="text-sm text-zinc-700 truncate" title={getActionText(log.action)}>
                              {getActionText(log.action)}
                            </div>
                          </td>
                          <td className="w-[30%] px-4 py-3 overflow-hidden">
                            {log.certificate ? (
                              <div className="flex flex-col">
                                <span className="text-zinc-700 font-medium truncate" title={log.certificate.recipientName}>{log.certificate.recipientName}</span>
                                <span className="text-zinc-500 text-xs truncate" title={log.certificate.event.name}>{log.certificate.event.name}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Unknown Target</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ----- Mobile: cards ----- */}
              <div className="lg:hidden flex-1 overflow-y-auto overflow-x-hidden bg-white">
                {isPending ? (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-4" />
                    <p className="text-zinc-500 font-medium">Loading audit logs...</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="border-b border-zinc-100 px-4 py-3">
                      {/* `mob-stack-head` (mobile only): the action label is
                          `shrink-0` and long, so on a phone it starved the
                          timestamp column and wrapped "Oct 4, 07:16 AM" onto
                          three lines. Stacking gives each its own row. */}
                      <div className="mob-stack-head flex items-center justify-between gap-3">
                        <div className="text-sm text-zinc-500">{formatDate(log.createdAt)}</div>
                        <div className="text-[13px] font-medium text-zinc-700 shrink-0">{getActionText(log.action)}</div>
                      </div>
                      <div className="mt-1 text-sm text-zinc-700">{getActorText(log.action, log.ipAddress)}</div>
                      <div className="mt-0.5 text-[13px] text-zinc-500 truncate">
                        {log.certificate ? `${log.certificate.recipientName} · ${log.certificate.event.name}` : "Unknown Target"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
