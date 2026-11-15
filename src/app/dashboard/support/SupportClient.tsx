"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  X,
  Loader2,
  LifeBuoy,
  CheckCircle2,
  RotateCcw,
  Calendar,
  UserCheck,
  UserX,
  Share2,
  MessageSquareText,
  ExternalLink,
} from "lucide-react";
import {
  SUPPORT_ISSUE_TYPES,
  SUPPORT_STATUSES,
  SupportStatus,
} from "@/lib/support";
import type { SupportTicketItem } from "@/lib/support-server";

export type { SupportTicketItem };

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Pending: "text-amber-700 bg-amber-50 border-amber-200/80",
  Resolved: "text-emerald-700 bg-emerald-50 border-emerald-200/80",
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  Pending: "bg-amber-500",
  Resolved: "bg-emerald-500",
};

const TYPE_BADGE_CLASSES: Record<string, string> = {
  "Event Concern": "text-sky-700 bg-sky-50 border-sky-200/80",
  "Account/Profile Typo": "text-indigo-700 bg-indigo-50 border-indigo-200/80",
};

export default function SupportClient({
  initialTickets,
  isAdmin,
}: {
  initialTickets: SupportTicketItem[];
  isAdmin: boolean;
}) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNoteTicket, setEditingNoteTicket] =
    useState<SupportTicketItem | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const showToast = (
    message: string,
    type: "error" | "success" = "success"
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const counts = useMemo(() => {
    let pending = 0;
    let resolved = 0;
    for (const t of tickets) {
      if (t.status === "Resolved") resolved += 1;
      else pending += 1;
    }
    return { all: tickets.length, pending, resolved };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && ticket.issueType !== typeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (ticket.reporterName || "").toLowerCase().includes(q) ||
        (ticket.user?.name || "").toLowerCase().includes(q) ||
        ticket.reporterEmail.toLowerCase().includes(q) ||
        ticket.issueType.toLowerCase().includes(q) ||
        (ticket.eventName || "").toLowerCase().includes(q) ||
        (ticket.organizer?.name || "").toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q)
      );
    });
  }, [tickets, searchTerm, statusFilter, typeFilter]);

  const applyTicketUpdate = (updated: SupportTicketItem) => {
    setTickets((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleStatusUpdate = async (
    ticketId: string,
    nextStatus: SupportStatus
  ) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data?.message || "Failed to update ticket status", "error");
        return;
      }

      if (data.ticket) applyTicketUpdate(data.ticket);
      showToast(`Ticket marked as ${nextStatus}`, "success");
    } catch {
      showToast("Error updating ticket status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleShareToggle = async (ticket: SupportTicketItem) => {
    const nextShared = !ticket.sharedWithOrganizer;
    setUpdatingId(ticket.id);
    try {
      const res = await fetch(`/api/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharedWithOrganizer: nextShared }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(
          data?.message || "Failed to update organizer sharing setting",
          "error"
        );
        return;
      }

      if (data.ticket) applyTicketUpdate(data.ticket);
      showToast(
        nextShared
          ? "Shared ticket with event organizer"
          : "Removed direct organizer override",
        "success"
      );
    } catch {
      showToast("Error updating organizer sharing setting", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openNotesModal = (ticket: SupportTicketItem) => {
    setEditingNoteTicket(ticket);
    setNoteDraft(ticket.adminNotes || "");
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteTicket) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/support/${editingNoteTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: noteDraft }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data?.message || "Failed to save note", "error");
        return;
      }

      if (data.ticket) applyTicketUpdate(data.ticket);
      showToast("Resolution notes saved", "success");
      setEditingNoteTicket(null);
    } catch {
      showToast("Error saving notes", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const badgeClass =
      STATUS_BADGE_CLASSES[status] ||
      "text-zinc-700 bg-zinc-100 border-zinc-200/80";
    const dotClass = STATUS_DOT_CLASSES[status] || "bg-zinc-500";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap ${badgeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        {status}
      </span>
    );
  };

  const renderTypeBadge = (issueType: string) => {
    const typeClass =
      TYPE_BADGE_CLASSES[issueType] ||
      "text-zinc-700 bg-zinc-100 border-zinc-200/80";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${typeClass}`}
      >
        {issueType}
      </span>
    );
  };

  const renderVerificationBadges = (ticket: SupportTicketItem) => {
    if (ticket.issueType !== "Event Concern") return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        {ticket.attendeeVerified ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck size={11} />
            Verified Attendee
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <UserX size={11} />
            Not in Attendance
          </span>
        )}
        {ticket.sharedWithOrganizer && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Share2 size={10} />
            Shared w/ Organizer
          </span>
        )}
      </div>
    );
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDisplayUser = (ticket: SupportTicketItem) => {
    return ticket.reporterName || ticket.user?.name || "Visitor";
  };

  const renderRowActions = (ticket: SupportTicketItem) => {
    const isPending = ticket.status !== "Resolved";
    const isUpdating = updatingId === ticket.id;

    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {isAdmin && ticket.issueType === "Account/Profile Typo" && (
          <Link
            href={`/dashboard/users?search=${encodeURIComponent(ticket.reporterEmail)}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 transition-colors whitespace-nowrap"
          >
            <ExternalLink size={12} />
            Edit User
          </Link>
        )}

        {isAdmin && ticket.issueType === "Event Concern" && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleShareToggle(ticket)}
            title="Delegate ticket visibility to the event organizer even if attendee check-in is missing"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap disabled:opacity-50 ${
              ticket.sharedWithOrganizer
                ? "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                : "bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200"
            }`}
          >
            <Share2 size={12} />
            <span>{ticket.sharedWithOrganizer ? "Shared" : "Share"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => openNotesModal(ticket)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 transition-colors whitespace-nowrap"
        >
          <MessageSquareText size={12} />
          <span>{ticket.adminNotes ? "Edit Note" : "Note"}</span>
        </button>

        <button
          type="button"
          disabled={isUpdating}
          onClick={() =>
            handleStatusUpdate(ticket.id, isPending ? "Resolved" : "Pending")
          }
          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap disabled:opacity-50 ${
            isPending
              ? "bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900"
              : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200"
          }`}
        >
          {isUpdating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isPending ? (
            <CheckCircle2 size={13} />
          ) : (
            <RotateCcw size={13} />
          )}
          <span>{isPending ? "Resolve" : "Reopen"}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Main Card Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-200 bg-zinc-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                All ({counts.all})
              </button>
              {SUPPORT_STATUSES.map((statusOption) => (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setStatusFilter(statusOption)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === statusOption
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {statusOption} (
                  {statusOption === "Pending" ? counts.pending : counts.resolved})
                </button>
              ))}
            </div>

            {isAdmin && (
              <select
                aria-label="Filter by issue type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 focus:outline-none focus:border-zinc-400"
              >
                <option value="all">All Types</option>
                {SUPPORT_ISSUE_TYPES.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search user, event, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-white border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

        {/* Table / Cards Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                <LifeBuoy size={22} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-700 mb-1">
                No support tickets found
              </h3>
              <p className="text-xs text-zinc-400 max-w-xs">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "No support requests match the current filters."
                  : isAdmin
                    ? "Concerns submitted from the landing page Help button will appear here."
                    : "Verified attendee concerns or admin-delegated tickets for your events will appear here."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:flex flex-1 flex-col min-h-0">
                <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar bg-white border-b border-zinc-100 shrink-0">
                  <table className="table-modern w-full table-fixed">
                    <thead>
                      <tr>
                        <th className="w-[18%] px-5 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Reporter
                        </th>
                        <th className="w-[17%] px-3 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Type &amp; Verification
                        </th>
                        <th className="w-[29%] px-3 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Details
                        </th>
                        <th className="w-[11%] px-3 py-3 text-left text-xs font-semibold text-zinc-500 tracking-wide">
                          Timestamp
                        </th>
                        <th className="w-[9%] px-3 py-3 text-center text-xs font-semibold text-zinc-500 tracking-wide">
                          Status
                        </th>
                        <th className="w-[16%] px-4 py-3 text-right text-xs font-semibold text-zinc-500 tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y divide-zinc-100">
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors bg-white"
                        >
                          <td className="w-[18%] px-5 py-3.5 align-top overflow-hidden">
                            <div className="font-semibold text-sm text-zinc-800 truncate">
                              {getDisplayUser(ticket)}
                            </div>
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                              {ticket.reporterEmail}
                            </div>
                          </td>

                          <td className="w-[17%] px-3 py-3.5 align-top">
                            {renderTypeBadge(ticket.issueType)}
                            {renderVerificationBadges(ticket)}
                          </td>

                          <td className="w-[29%] px-3 py-3.5 align-top">
                            {ticket.eventName && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded max-w-full truncate">
                                  <Calendar size={11} className="shrink-0 text-zinc-500" />
                                  <span className="truncate">{ticket.eventName}</span>
                                </div>
                                {isAdmin && ticket.organizer && (
                                  <span className="text-[11px] font-medium text-zinc-500 truncate">
                                    Organizer: {ticket.organizer.name || ticket.organizer.email}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap break-words">
                              {ticket.description}
                            </p>
                            {ticket.adminNotes && (
                              <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                                <span className="font-semibold text-zinc-700">Note: </span>
                                {ticket.adminNotes}
                              </div>
                            )}
                          </td>

                          <td className="w-[11%] px-3 py-3.5 align-top">
                            <span
                              suppressHydrationWarning
                              className="text-xs text-zinc-500 font-medium leading-snug block"
                            >
                              {formatTimestamp(ticket.createdAt)}
                            </span>
                          </td>

                          <td className="w-[9%] px-3 py-3.5 align-top text-center">
                            {renderStatusBadge(ticket.status)}
                          </td>

                          <td className="w-[16%] px-4 py-3.5 align-top text-right">
                            {renderRowActions(ticket)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="lg:hidden flex-1 overflow-y-auto overflow-x-hidden bg-white">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border-b border-zinc-100 px-4 py-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-zinc-800 truncate">
                          {getDisplayUser(ticket)}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {ticket.reporterEmail}
                        </div>
                      </div>
                      {renderStatusBadge(ticket.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {renderTypeBadge(ticket.issueType)}
                      {ticket.eventName && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/80 px-2 py-0.5 rounded max-w-full truncate">
                          <Calendar size={11} className="shrink-0 text-zinc-500" />
                          <span className="truncate">{ticket.eventName}</span>
                        </span>
                      )}
                    </div>

                    {renderVerificationBadges(ticket)}

                    {isAdmin && ticket.organizer && (
                      <div className="text-[11px] font-medium text-zinc-500">
                        Organizer: {ticket.organizer.name || ticket.organizer.email}
                      </div>
                    )}

                    <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap break-words">
                      {ticket.description}
                    </p>

                    {ticket.adminNotes && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                        <span className="font-semibold text-zinc-700">Note: </span>
                        {ticket.adminNotes}
                      </div>
                    )}

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span
                        suppressHydrationWarning
                        className="text-[11px] text-zinc-400 font-medium"
                      >
                        {formatTimestamp(ticket.createdAt)}
                      </span>
                      {renderRowActions(ticket)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resolution Notes Modal */}
      <AnimatePresence>
        {editingNoteTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-zinc-800">
                  Resolution Notes
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingNoteTicket(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Add internal resolution notes for{" "}
                <strong className="text-zinc-700">
                  {editingNoteTicket.reporterEmail}
                </strong>
                .
              </p>

              <form onSubmit={handleSaveNotes} className="space-y-4">
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Document how this concern was checked or resolved..."
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNoteTicket(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50"
                  >
                    {savingNote && <Loader2 size={13} className="animate-spin" />}
                    Save Note
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-zinc-900 border-zinc-800 text-white"
            }`}
          >
            {toast.type === "error" ? <X size={14} /> : <Check size={14} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
