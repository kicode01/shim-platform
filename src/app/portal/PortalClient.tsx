"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowUpRight,
  X,
  Plus,
  Check,
  Award,
  CalendarDays,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";

interface Certificate {
  id: string;
  recipientName: string;
  role: string;
  status: string;
  issueDate: string;
  event: { name: string };
  template: { name: string };
}

interface PortalClientProps {
  user: { name: string; membershipId: string };
  certificates: Certificate[];
  stats: {
    totalCertificates: number;
    eventsAttended: number;
    organizations: number;
    verifications: number;
  };
  insights: {
    events: string[];
    organizations: string[];
  };
}

/* ── The isometric "S" mark, traced from public/logo-mono.svg ───────────────
   Three parallelogram faces with the two signature slashes knocked out.
   Inline geometry rather than an <img> so it inherits currentColor and stays
   crisp at every size. This is the shared mark of the whole product.        */
function IsometricMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  const maskId = `shim-gap-${size}-${className.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <mask id={maskId}>
        <rect width="256" height="256" fill="#fff" />
        <line x1="28" y1="96" x2="164" y2="96" stroke="#000" strokeWidth="8" strokeLinecap="round" />
        <line x1="92" y1="160" x2="228" y2="160" stroke="#000" strokeWidth="8" strokeLinecap="round" />
      </mask>
      <g mask={`url(#${maskId})`} fill="currentColor">
        <polygon points="32,96 160,96 224,160 96,160" />
        <polygon points="96,32 224,32 160,96 32,96" />
        <polygon points="96,160 224,160 160,224 32,224" />
      </g>
    </svg>
  );
}

/* ── QR glyph, hand-drawn on a 16-unit grid (not a stock icon) ───────────── */
function QRGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.8" y="2.8" width="1.4" height="1.4" fill="currentColor" />
      <rect x="10" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.8" y="2.8" width="1.4" height="1.4" fill="currentColor" />
      <rect x="1" y="10" width="5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.8" y="11.8" width="1.4" height="1.4" fill="currentColor" />
      <rect x="10" y="10" width="1.6" height="1.6" fill="currentColor" />
      <rect x="13.4" y="10" width="1.6" height="1.6" fill="currentColor" />
      <rect x="10" y="13.4" width="1.6" height="1.6" fill="currentColor" />
      <rect x="13.4" y="13.4" width="1.6" height="1.6" fill="currentColor" />
      <rect x="11.7" y="11.7" width="1.6" height="1.6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

/* ── Derived helpers ──────────────────────────────────────────────────────── */

const INK_ACCENTS = ["#0b7285", "#3b3486", "#a3450f", "#1f2937", "#5b21b6", "#065f46"];

function seedOf(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function PortalClient({ user, certificates, stats, insights }: PortalClientProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  // `createPortal` needs a browser DOM. Track mount via a layout effect that
  // subscribes to an external system (the document) rather than setState
  // synchronously in an effect body.
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const marks = useMemo(() => {
    const map = new Map<string, number>();
    certificates.forEach((c) => map.set(c.id, seedOf(c.id)));
    return map;
  }, [certificates]);

  const inkOf = (id: string) => INK_ACCENTS[(marks.get(id) ?? seedOf(id)) % INK_ACCENTS.length];

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const totalEvents = certificates.length
    ? new Set(certificates.map((c) => c.event.name)).size
    : stats.eventsAttended;

  /* Metric ribbon — mirrors the HQ ribbon verbatim: 1px-gap grid on a zinc-200
     bed, white cells, oversized ghost watermark, uppercase micro-label.       */
  const cells = [
    { id: "total", value: stats.totalCertificates, label: "Credentials", Icon: Award },
    { id: "events", value: totalEvents, label: "Events", Icon: CalendarDays },
    { id: "issuers", value: stats.organizations, label: "Issuers", Icon: Building2 },
    { id: "verifs", value: stats.verifications, label: "Verifications", Icon: ShieldCheck },
  ];

  const issuedYear = certificates.length
    ? new Date(certificates[0].issueDate).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="flex-1 w-full font-sans">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-6">

        {/* ══ Holder card — the page's one statement of identity ══════════
             This absorbs what used to be a separate "Wallet / Credentials
             issued to you" title block: the name is the page title, the ID is
             the subtitle. Stating it once keeps the header from repeating the
             navbar chip above it.                                          */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-zinc-200 rounded-xl shadow-sm mb-6 overflow-hidden"
        >
          <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
              <div className="w-[64px] h-[64px] shrink-0 bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden">
                <span className="text-zinc-50 text-[22px] font-black tracking-[-0.03em] leading-none select-none">
                  {initialsOf(user.name)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                {/* Meta rule — label and badge share one optical weight so
                    neither outranks the name below them. */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-400">
                    Wallet holder
                  </span>
                  <span className="h-3 w-px bg-zinc-200" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-400">
                    <IsometricMark size={9} className="text-zinc-300" />
                    Synced
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-700 tracking-tight leading-tight truncate">
                  {user.name}
                </h1>
                <button
                  onClick={() => copy(user.membershipId, "id")}
                  className="group flex items-center gap-1.5 mt-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                  title="Copy membership ID"
                >
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
                    {user.membershipId}
                  </span>
                  {copied === "id" ? (
                    <Check size={11} className="text-emerald-600" />
                  ) : (
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      copy
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Action pair — the two things a holder actually does: present their
                own pass, or check someone else's. Stacked so they read as a set. */}
            <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowQR(true)}
                className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-xl px-4 h-10 hover:bg-zinc-800 active:translate-y-px transition-all shadow-sm"
              >
                <QRGlyph size={13} />
                <span className="text-sm font-medium">Show check-in pass</span>
              </button>
              <Link
                href="/validate"
                className="group inline-flex items-center justify-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 bg-white rounded-xl px-4 h-10 hover:bg-zinc-50 transition-colors shadow-sm"
              >
                Verify a credential
                <ArrowUpRight size={14} strokeWidth={1.9} className="text-zinc-400 group-hover:text-zinc-700 transition-colors" />
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ══ Key metrics ribbon — the organizer signature element ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="bg-zinc-200 border border-zinc-200 rounded-xl shadow-sm mb-6 grid grid-cols-2 lg:grid-cols-4 gap-[1px] overflow-hidden"
        >
          {cells.map((c) => (
            <div
              key={c.id}
              className="relative p-5 bg-white flex flex-col justify-start hover:bg-zinc-50/80 transition-colors overflow-hidden group"
            >
              <c.Icon
                className="absolute -right-2 -bottom-3 text-zinc-900 opacity-[0.06] group-hover:opacity-[0.09] transition-opacity w-16 h-16"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-zinc-500">{c.label}</span>
              <AnimatedNumber value={c.value} />
            </div>
          ))}
        </motion.div>

        {/* ══ Credentials table ══════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-6"
        >
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-800 tracking-tight">Held credentials</h2>
              <p className="text-zinc-500 text-sm font-medium mt-0.5">
                {certificates.length} {certificates.length === 1 ? "record" : "records"} on file
              </p>
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-3 py-1.5 rounded-md shadow-[inset_0_1px_3px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,1)] tabular-nums">
              {String(certificates.length).padStart(2, "0")} / {issuedYear}
            </span>
          </div>

          {certificates.length === 0 ? (
            <EmptyLedger userName={user.name} />
          ) : (
            <ul className="divide-y divide-zinc-200">
              {certificates.map((cert, i) => {
                const ink = inkOf(cert.id);
                const valid = cert.status === "valid";
                return (
                  <motion.li
                    key={cert.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.03 * Math.min(i, 6) }}
                  >
                    <Link
                      href={`/validate?id=${cert.id}`}
                      className="group relative flex items-center gap-4 p-5 hover:bg-zinc-50/80 transition-colors"
                    >
                      {/* Ink rule — the credential's own accent, revealed on hover */}
                      <span
                        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: ink }}
                      />

                      {/* Monogram chip, tinted toward the credential's ink */}
                      <span
                        className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-[13px] font-bold"
                        style={{ backgroundColor: `${ink}14`, color: ink }}
                      >
                        {initialsOf(cert.role || cert.event.name)}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-zinc-800 tracking-tight truncate">
                            {cert.role}
                          </h3>
                          {valid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <Check size={9} strokeWidth={3} />
                              Valid
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md">
                              {cert.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-zinc-500 truncate mt-0.5">
                          {cert.event.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-400">
                          <span className="truncate max-w-[9rem]">{cert.template.name}</span>
                          <span className="text-zinc-300">·</span>
                          <span className="tabular-nums whitespace-nowrap">
                            {formatDate(cert.issueDate)}
                          </span>
                          <span className="hidden md:inline text-zinc-300">·</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              copy(cert.id, cert.id);
                            }}
                            className="hidden md:inline hover:text-zinc-700 transition-colors truncate max-w-[8rem]"
                            title="Copy credential ID"
                          >
                            {copied === cert.id ? "copied" : cert.id}
                          </button>
                        </div>
                      </div>

                      <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-zinc-300 group-hover:text-zinc-900 group-hover:bg-zinc-100 transition-colors">
                        <ArrowUpRight size={16} strokeWidth={1.9} />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {/* ══ Provenance ═════════════════════════════════════════════════ */}
        {certificates.length > 0 && (insights.events.length > 0 || insights.organizations.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="bg-zinc-200 border border-zinc-200 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-[1px] overflow-hidden"
          >
            {insights.organizations.length > 0 && (
              <div className="bg-white p-6">
                <div className="text-sm font-medium text-zinc-500 mb-3.5">Issued by</div>
                <ul className="space-y-2.5">
                  {insights.organizations.slice(0, 4).map((name) => (
                    <li key={name} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                      <span className="text-sm text-zinc-700 truncate">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights.events.length > 0 && (
              <div className="bg-white p-6">
                <div className="text-sm font-medium text-zinc-500 mb-3.5">Event history</div>
                <ul className="space-y-2.5">
                  {insights.events.slice(0, 5).map((name) => (
                    <li key={name} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                      <span className="text-sm text-zinc-700 truncate">{name}</span>
                    </li>
                  ))}
                  {insights.events.length > 5 && (
                    <li className="font-mono text-[10px] text-zinc-400 pl-4">
                      +{insights.events.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </motion.section>
        )}
      </div>

      {/* ══ Check-in pass modal ═══════════════════════════════════════════ */}
      {isMounted && showQR
        ? createPortal(
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-[3px]"
                onClick={() => setShowQR(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 10 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-[400px] max-h-[calc(100vh-2rem)] overflow-y-auto"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200">
                      <div className="flex items-center gap-2">
                        <IsometricMark size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                          Check-in pass
                        </span>
                      </div>
                      <button
                        onClick={() => setShowQR(false)}
                        className="text-zinc-400 hover:text-zinc-900 transition-colors"
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="bg-zinc-900 relative overflow-hidden">
                      {/* 32px grid etched into the dark field */}
                      <div
                        className="absolute inset-0 opacity-[0.07] pointer-events-none"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                        }}
                      />
                      {/* Corner registration marks, inset by the same 20px as content */}
                      <span className="absolute top-3 left-3 w-4 h-4 border-t border-l border-emerald-500/40" />
                      <span className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-emerald-500/40" />

                      <div className="relative z-10 p-5 flex flex-col items-center">
                        {/* QR — a 132px code inside a 156px plate keeps a 12px
                            quiet zone and leaves the holder block room to breathe. */}
                        <div className="bg-zinc-50 p-3 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                          <QRCodeSVG
                            value={user.membershipId}
                            size={132}
                            level="H"
                            includeMargin={false}
                            fgColor="#09090b"
                            bgColor="#fafafa"
                          />
                        </div>

                        <div className="mt-5 w-full">
                          <div className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">
                            Holder
                          </div>
                          <div className="text-zinc-50 text-sm font-bold tracking-tight truncate">
                            {user.name}
                          </div>
                        </div>

                        <button
                          onClick={() => copy(user.membershipId, "modal")}
                          className="mt-5 w-full flex items-center justify-between border-t border-zinc-700/70 pt-3.5 group"
                        >
                          <span className="font-mono text-[11px] tracking-[0.16em] text-zinc-300 group-hover:text-zinc-50 transition-colors break-all pr-3">
                            {user.membershipId}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0">
                            {copied === "modal" ? "copied" : "copy"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <p className="px-5 py-4 text-[13px] leading-relaxed text-zinc-500">
                      Present this pass at check-in. It links to your wallet — every credential
                      issued to{" "}
                      <span className="text-zinc-700 font-medium">{user.membershipId}</span> is
                      filed here automatically.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}

/* ── Count-up — rAF drives a DOM node directly, so no state churn per frame.
   SSR renders the true value, so the real number is always in the markup. ── */
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only animate on mount; skip for zero and for reduced-motion users.
    if (!first.current) {
      el.textContent = String(value);
      return;
    }
    first.current = false;
    if (value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 520;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="mt-1.5 text-3xl font-bold text-zinc-800 tracking-tight tabular-nums">
      {value}
    </span>
  );
}

/* ── Empty ledger — the message is the whole state, so it owns the whole area.
   The card body is a fixed 320px tall centring well (flex/items-center/
   justify-center), which puts the block on the card's true optical centre
   instead of stranding it below a stack of ghost rows. The ghost rows are
   *behind* the message as a faint backdrop, absolutely positioned and bled to
   the edges, so they still advertise "a table lives here" without stealing the
   vertical axis. The card body is 320px tall either way — with or without
   records — so the page never jumps when the first credential lands. */
function EmptyLedger({ userName }: { userName: string }) {
  return (
    <div className="relative h-[320px] flex items-center justify-center px-6">
      {/* Ghost table — backdrop only, does not participate in layout */}
      <div className="absolute inset-0" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 flex items-center gap-4 px-5"
            style={{ top: 76 * i, opacity: 0.7 - i * 0.24 }}
          >
            <span className="w-11 h-11 shrink-0 rounded-lg bg-zinc-100" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 bg-zinc-100 rounded w-1/3" />
              <div className="h-2 bg-zinc-100/80 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Centred message — on top of the ghost rows, on a white plate so the
          faded rows never read as struck-through text */}
      <div className="relative flex flex-col items-center text-center bg-white rounded-2xl px-8 py-5">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-zinc-300 bg-white mb-3.5">
          <Plus size={15} className="text-zinc-400" strokeWidth={1.75} />
        </span>
        <h3 className="text-sm font-bold text-zinc-800 tracking-tight">
          No credentials on file
        </h3>
        <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-[30rem]">
          Nothing has been issued to{" "}
          <span className="text-zinc-700 font-semibold">{userName}</span> yet. Show the
          check-in pass above at an event and your first credential lands here automatically.
        </p>
      </div>
    </div>
  );
}
