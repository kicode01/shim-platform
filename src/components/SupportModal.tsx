"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { X, CheckCircle2, AlertCircle, Loader2, LifeBuoy, Send } from "lucide-react";
import { SUPPORT_ISSUE_TYPES, SupportIssueType } from "@/lib/support";

export interface SupportEventOption {
  id: string;
  name: string;
  date: string | null;
}

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: SupportEventOption[];
}

export default function SupportModal({
  isOpen,
  onClose,
  events,
}: SupportModalProps) {
  const { data: session } = useSession();

  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [issueType, setIssueType] = useState<SupportIssueType>("Account/Profile Typo");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (session?.user) {
      setReporterName((prev) => prev || session.user?.name || "");
      setReporterEmail((prev) => prev || session.user?.email || "");
    }
  }, [isOpen, session]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const resetForm = () => {
    setReporterName(session?.user?.name || "");
    setReporterEmail(session?.user?.email || "");
    setIssueType("Account/Profile Typo");
    setEventId("");
    setDescription("");
    setError(null);
    setSubmittedId(null);
  };

  const handleClose = () => {
    if (submitting) return;
    setError(null);
    setSubmittedId(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reporterEmail.trim()) {
      setError("Please enter your email address so we can follow up.");
      return;
    }

    if (issueType === "Event Concern" && !eventId) {
      setError("Please select the event related to your concern.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe your issue or concern.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: reporterName.trim() || undefined,
          reporterEmail: reporterEmail.trim(),
          issueType,
          eventId: issueType === "Event Concern" ? eventId : undefined,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Failed to submit support ticket.");
        return;
      }

      setSubmittedId(data?.ticket?.id || "submitted");
      setDescription("");
      setEventId("");
    } catch {
      setError("Network error while submitting your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventOption = (ev: SupportEventOption) => {
    if (!ev.date) return ev.name;
    const d = new Date(ev.date);
    if (Number.isNaN(d.getTime())) return ev.name;
    const formatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${ev.name} (${formatted})`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-white text-zinc-900 rounded-2xl border border-zinc-200 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h2
                id="support-modal-title"
                className="text-lg font-bold text-zinc-900 leading-snug"
              >
                Help &amp; Support
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Report an account typo or raise an event concern directly to admins.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close support dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submittedId ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900">
                Support Ticket Submitted
              </h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                Your concern has been queued for our administrators with status{" "}
                <span className="font-semibold text-amber-700">Pending</span>.
              </p>
              {submittedId !== "submitted" && (
                <p className="text-[11px] font-mono text-zinc-400 pt-1">
                  Ticket ID: {submittedId}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors"
              >
                Submit Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="supportReporterName"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Your Name <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="supportReporterName"
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Jamie Cruz"
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label
                  htmlFor="supportReporterEmail"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="supportReporterEmail"
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="supportIssueType"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Issue Type <span className="text-red-500">*</span>
              </label>
              <select
                id="supportIssueType"
                value={issueType}
                onChange={(e) => {
                  const nextType = e.target.value as SupportIssueType;
                  setIssueType(nextType);
                  if (nextType !== "Event Concern") {
                    setEventId("");
                  }
                }}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 focus:outline-none focus:border-zinc-900"
              >
                {SUPPORT_ISSUE_TYPES.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            </div>

            {issueType === "Event Concern" && (
              <div>
                <label
                  htmlFor="supportEventSelect"
                  className="block text-xs font-semibold text-zinc-700 mb-1.5"
                >
                  Related Event <span className="text-red-500">*</span>
                </label>
                <select
                  id="supportEventSelect"
                  required
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value="">
                    {events.length > 0
                      ? "Select an event..."
                      : "No events currently available"}
                  </option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {formatEventOption(ev)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="supportDescription"
                className="block text-xs font-semibold text-zinc-700 mb-1.5"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="supportDescription"
                required
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  issueType === "Event Concern"
                    ? "Describe the concern with attendance, certificate delivery, or event details..."
                    : "Tell us what needs correcting (e.g. misspelled name, wrong email address, role update)..."
                }
                className="w-full p-3 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 resize-y min-h-[104px]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
                <span>Reviewed by event administrators</span>
                <span>{description.length}/2000</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                id="submitSupportBtn"
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-xs font-semibold text-white transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Concern</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
