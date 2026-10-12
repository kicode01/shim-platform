"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Stamp, 
  FileSpreadsheet, 
  LogOut,
  UserCheck,
  Calendar,
  ArrowRight,
  BookOpen,
  History,
  Award,
  User
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isLandingMode = pathname === "/" || isAuthPage;
  const isValidateMode = pathname.startsWith("/validate");
  const isDashboardMode = pathname.startsWith("/dashboard");
  const isPortalMode = pathname.startsWith("/portal");

  const [confirmLogout, setConfirmLogout] = useState(false);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    // Prefetch pages for fast transitions.
    //
    // Deferred a frame and wrapped in try/catch on purpose. `router.prefetch`
    // reaches into the App Router's action queue, which throws
    // "Internal Next.js error: Router action dispatched before initialization"
    // (E668) if it is called before the router has finished mounting. During
    // Fast Refresh the router module is briefly re-initialized while this
    // effect re-runs, which is exactly that window — it showed up as an
    // uncaught error in the console during HMR. A prefetch is only a
    // best-effort optimisation, so it must never surface an error.
    const raf = requestAnimationFrame(() => {
      try {
        router.prefetch('/validate');
        router.prefetch('/dashboard');
        router.prefetch('/portal');
      } catch {
        /* Router not ready yet; the next mount will prefetch instead. */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [router]);

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/credentials", label: "Credentials", icon: BookOpen },
    { href: "/dashboard/events", label: "Events", icon: Calendar },
    { href: "/dashboard/templates", label: "Templates", icon: Stamp },
    { href: "/dashboard/generate", label: "Generate", icon: FileSpreadsheet },
    { href: "/dashboard/audit", label: "Audit Trail", icon: History },
  ];

  if (pathname.startsWith("/kiosk") || pathname.startsWith("/scanner")) return null;

  return (
    <>
      <header className={`sticky top-0 z-50 no-print transition-colors duration-500 flex items-center h-16 ${
        isLandingMode
          ? 'mob-nav-landing bg-[#0a0a0a] border-b border-zinc-700'
          : 'bg-white border-b border-zinc-200'
      }`}>
        <div className="mob-nav-inner w-full px-4 sm:px-6 h-full flex justify-between items-center">
          
          {/* Left area begins - Logo. Every surface sits flush to the page edge,
              same as the attendee bar. (The landing page previously used a
              max-w-7xl mx-auto frame here, which inset the header while the
              /validate bar ran edge-to-edge — the two surfaces disagreed.) */}
          <div className="shrink-0 h-full flex items-center">
            <Link 
              href={isLandingMode ? "/" : isPortalMode ? "/portal" : "/dashboard"} 
              className={`flex items-center h-full z-50 ${
                (pathname === "/dashboard" || pathname === "/" || pathname === "/portal" || isValidateMode) ? 'cursor-default pointer-events-none' : ''
              }`}
            >
              {/* Logo lockup.
                  The mark is sized to the FULL lockup band — from the top of
                  "shim" down to the baseline of the tagline — so it reads as
                  the same weight as the whole name block rather than floating
                  up beside the wordmark. Row 1 is therefore `items-center`:
                  the mark centres against the wordmark column (wordmark +
                  tagline), while the wordmark itself stays top-aligned with
                  the mark's own top.
                  On non-landing modes the mode suffix (`.organizer` /
                  `.attendee` / `.validate`) is an inline sibling of "shim", so
                  the inner row is an inline flex to keep them on one line.
                  The name column is `items-start` on landing so "shim" and the
                  tagline share a left edge — the tagline is the wider of the
                  two, so its extra width spills right, clear of the mark.
                  Non-landing modes have no tagline and keep the natural
                  centred pair. */}
              <div className="flex flex-col items-start">
                {/* The row is TOP-aligned, not centre-aligned. The mark is the
                    only child whose height is stable for the whole transition
                    (52 -> 24, tweened), while the name column changes height
                    abruptly when the tagline mounts/unmounts. With
                    `items-center` the column's changing height moved the
                    wordmark vertically every frame — the lockup visibly sank
                    and rose. Pinning to the top makes the mark's top edge the
                    single fixed reference for the entire animation. */}
                <div className="mob-lockup-row flex items-start gap-2.5">
                {/* Static width/height as well as the animation: without an
                    intrinsic size the SVG paints at its natural dimensions for
                    one frame before framer-motion initialises, which showed up
                    as a giant logo flashing over the header on streamed/slow
                    loads. `initial={false}` makes the first render use those
                    values instead of animating in from nothing. */}
                <motion.img
                  src={isLandingMode ? "/logo-dark.svg" : "/logo-light.svg"}
                  alt="shim logo"
                  width={isLandingMode ? 52 : 24}
                  height={isLandingMode ? 52 : 24}
                  initial={false}
                  animate={{
                    height: isLandingMode ? 52 : 24,
                    width: isLandingMode ? 52 : 24
                  }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="mob-logo shrink-0 object-contain"
                />
                {/* The name column. The tagline is absolutely positioned so it
                    is OUT of flow: while the wordmark's font-size tweens, a
                    flowed tagline would be re-centred by layout on every frame
                    and read as the whole lockup sliding sideways. Taking it out
                    of flow freezes the mark and wordmark geometry for the whole
                    transition. */}
                <div className={`mob-lockup relative flex flex-col ${isLandingMode ? "items-start" : "items-center"}`}>
                <div className="flex items-baseline">
                  {/* Same reasoning as the logo: a static fontSize on the first
                      render stops the wordmark from flashing at the inherited
                      size before the animation engine takes over.
                      `transformOrigin: left` keeps the left edge pinned, so the
                      glyphs grow/shrink toward the mark instead of drifting. */}
                  <motion.span 
                    initial={false}
                    animate={{ 
                      fontSize: isLandingMode ? "42px" : "24px",
                      color: isLandingMode ? "#ffffff" : "#18181b"
                    }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    className="mob-wordmark font-black tracking-[-0.08em] lowercase leading-none"
                    style={{
                      fontFamily: 'var(--font-inter), system-ui, sans-serif',
                      fontSize: isLandingMode ? "42px" : "24px",
                      color: isLandingMode ? "#ffffff" : "#18181b",
                      transformOrigin: 'left center',
                    }}
                  >
                    shim
                  </motion.span>
                
                <AnimatePresence mode="wait">
                  {isDashboardMode && (
                    <motion.span 
                      key="dashboard"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mob-suffix text-zinc-700 text-2xl font-black tracking-[-0.08em] lowercase leading-none"
                      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                    >
                      .organizer
                    </motion.span>
                  )}
                  {isPortalMode && (
                    <motion.span 
                      key="portal"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mob-suffix text-zinc-700 text-2xl font-black tracking-[-0.08em] lowercase leading-none"
                      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                    >
                      .attendee
                    </motion.span>
                  )}
                  {isValidateMode && (
                    <motion.span 
                      key="validate"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mob-suffix text-zinc-400 text-2xl font-black tracking-[-0.08em] lowercase leading-none"
                      style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                    >
                      .validate
                    </motion.span>
                  )}
                </AnimatePresence>
                </div>
                <AnimatePresence mode="wait">
                  {isLandingMode && (
                    /* Absolute so it never participates in layout: the column
                       is sized purely by the wordmark, which means the mark and
                       wordmark stop moving during the transition. The exit is a
                       pure fade (no `x`) — a translate on top of an already
                       re-laying-out parent was what made it smear sideways. */
                    <motion.span 
                      key="subtitle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="mob-tagline absolute left-0 top-full -mt-[3px] block text-[7.5px] font-bold text-zinc-400 uppercase tracking-[0.22em] whitespace-nowrap text-left"
                    >
                      Digital Credential Platform
                    </motion.span>
                  )}
                </AnimatePresence>
                </div>
                </div>
                </div>
            </Link>
          </div>

          {/* Middle Content - Nav Links */}
          <div className="mob-nav-spacer flex-1 flex justify-center h-full">
            <AnimatePresence>
              {/* Other modes could place items here if needed in the future */}
            </AnimatePresence>
          </div>

          {/* Right Section. The landing-mode fixed column width is gone with
              the max-w-7xl frame it was balancing against. */}
          <div className="flex items-center justify-end h-full shrink-0 w-auto">
            {isMounted && (
              <AnimatePresence mode="wait">
                {isLandingMode && (
                  <motion.div 
                    key="landing-right"
                    initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="mob-nav-right flex items-center gap-4 sm:gap-6"
                >
                  {!isAuthPage && (
                    <>
                      <Link href="/validate" className="mob-cta text-sm font-medium text-zinc-100 hover:text-white transition-colors flex items-center gap-1.5 bg-zinc-700 border border-zinc-700 rounded-xl px-3 py-1.5 hover:border-zinc-700 whitespace-nowrap shadow-sm">
                        Verify
                      </Link>
                      <div className="mob-divider h-5 w-px bg-zinc-700 shrink-0 hidden sm:block"></div>
                      <Link href="/login" className="text-sm font-medium mob-hide text-zinc-400 hover:text-zinc-100 transition-colors whitespace-nowrap inline-block">
                        Sign In
                      </Link>
                      <Link href="/register" className="mob-cta bg-zinc-100 hover:bg-white text-zinc-700 transition-colors text-sm font-medium rounded-xl px-4 py-2 flex items-center gap-2 whitespace-nowrap shadow-sm">
                        Get Started
                        <ArrowRight size={14} className="shrink-0" />
                      </Link>
                    </>
                  )}
                </motion.div>
              )}

              {isDashboardMode && (
                <motion.div 
                  key="dashboard-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="mob-nav-right flex items-center gap-4 h-full"
                >
                  {/* Verify button — organizer only */}
                  <Link
                    href="/validate"
                    className="mob-cta flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
                  >
                    <span className="text-xs font-bold tracking-wide uppercase">
                      Verify
                    </span>
                  </Link>

                  <div className="mob-divider w-px h-5 bg-zinc-200 mx-2"></div>

                  {/* User chip — monogram only, matching the portal bar. The
                      dashboard header names the user in context, so the chip
                      stays a quiet identity anchor rather than a second label. */}
                  <div className="flex items-center gap-2.5 p-1 pr-1 rounded-2xl hover:bg-zinc-100/80 transition-colors cursor-default shrink-0">
                    <div className="mob-avatar w-8 h-8 flex items-center justify-center font-bold text-xs shrink-0 rounded-xl bg-zinc-800 text-white">
                      {session?.user?.name?.charAt(0).toUpperCase() || <UserCheck size={14} />}
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={async () => {
                      if (!confirmLogout) {
                        setConfirmLogout(true);
                        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
                        logoutTimeoutRef.current = setTimeout(() => setConfirmLogout(false), 3000);
                      } else {
                        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
                        setConfirmLogout(false);
                        await signOut({ redirect: false });
                        const isLocal = window.location.hostname.includes("localhost");
                        window.location.href = isLocal ? "/logout" : "https://shim-hq.vercel.app/logout";
                      }
                    }}
                    className={`mob-icon-btn shrink-0 flex items-center justify-center transition-all overflow-hidden ${
                      confirmLogout 
                        ? "w-[80px] h-8 rounded-xl bg-red-600 text-white font-semibold text-xs tracking-wide" 
                        : "w-8 h-8 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    }`}
                    title="Sign Out"
                  >
                    <AnimatePresence mode="wait">
                      {confirmLogout ? (
                        <motion.span 
                          key="confirm"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="text-xs font-medium whitespace-nowrap"
                        >
                          Confirm
                        </motion.span>
                      ) : (
                        <motion.div 
                          key="icon"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <LogOut size={16} strokeWidth={2} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )}

              {/* Portal right section — white, no Verify */}
              {isPortalMode && (
                <motion.div
                  key="portal-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="mob-nav-right flex items-center gap-4 h-full"
                >
                  {/* User chip — light. Monogram only: the wallet's holder card
                      states the name and ID in full, so repeating them here only
                      crowds the bar. This stays a quiet "signed in as" anchor. */}
                  <div className="flex items-center gap-2.5 rounded-2xl shrink-0" title={session?.user?.email || ""}>
                    <div className="mob-avatar w-8 h-8 flex items-center justify-center font-bold text-xs shrink-0 rounded-xl bg-zinc-800 text-white">
                      {session?.user?.name?.charAt(0).toUpperCase() || <UserCheck size={14} />}
                    </div>
                  </div>

                  {/* Logout — light */}
                  <button
                    onClick={async () => {
                      if (!confirmLogout) {
                        setConfirmLogout(true);
                        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
                        logoutTimeoutRef.current = setTimeout(() => setConfirmLogout(false), 3000);
                      } else {
                        if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
                        setConfirmLogout(false);
                        await signOut({ redirect: false });
                        const isLocal = window.location.hostname.includes("localhost");
                        window.location.href = isLocal ? "/logout" : "https://shim-hq.vercel.app/logout";
                      }
                    }}
                    className={`mob-icon-btn shrink-0 flex items-center justify-center border transition-all rounded-xl overflow-hidden ${
                      confirmLogout
                        ? "w-[80px] h-8 border-red-600 bg-red-600 text-white hover:bg-red-700 shadow-sm"
                        : "w-8 h-8 border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 shadow-sm"
                    }`}
                    title="Sign Out"
                  >
                    <AnimatePresence mode="wait">
                      {confirmLogout ? (
                        <motion.span
                          key="confirm-portal"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="text-xs font-medium whitespace-nowrap"
                        >
                          Confirm
                        </motion.span>
                      ) : (
                        <motion.div
                          key="icon-portal"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <LogOut size={16} strokeWidth={2} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              )}

              {isValidateMode && (
                <motion.div 
                  key="validate-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="mob-nav-right flex items-center gap-4"
                >
                  {session?.user ? (
                    (session.user as any).role === "member" ? (
                      <Link 
                        href="/portal"
                        className="mob-cta flex items-center justify-center bg-zinc-700 border border-zinc-700 text-zinc-100 hover:text-white hover:bg-zinc-600 transition-colors rounded-xl px-4 py-2 shadow-sm text-sm font-medium whitespace-nowrap"
                      >
                        <span>Portal</span>
                      </Link>
                    ) : (
                      <Link 
                        href="/dashboard"
                        className="mob-cta flex items-center justify-center bg-zinc-700 border border-zinc-700 text-zinc-100 hover:text-white hover:bg-zinc-600 transition-colors rounded-xl px-4 py-2 shadow-sm text-sm font-medium whitespace-nowrap"
                      >
                        <span>Dashboard</span>
                      </Link>
                    )
                  ) : (
                    <div className="flex items-center gap-6">
                      <Link href="/" className="mob-cta text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors whitespace-nowrap">
                        Home
                      </Link>
                      <Link href="/login" className="mob-cta flex items-center justify-center bg-zinc-700 border border-zinc-700 hover:bg-zinc-700 text-zinc-100 hover:text-white transition-colors rounded-xl px-4 py-2 shadow-sm text-sm font-medium whitespace-nowrap">
                        Sign In
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

