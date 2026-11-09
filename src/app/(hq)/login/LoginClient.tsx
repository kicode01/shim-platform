"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Mail, Key, ShieldAlert, ArrowLeft, Eye, EyeOff, Loader2, Award, Check } from "lucide-react";

/* ---------------------------------------------------------------------------
   Shared field styling.
   Kept at module scope so the login and register screens stay pixel-identical
   (they had drifted apart). The `dark:` variants are resolved by Tailwind's
   default `media` strategy, i.e. they follow the OS / browser light-dark
   preference — no class toggle and no theme provider required.
   --------------------------------------------------------------------------- */
const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 transition-colors focus:outline-none focus:border-zinc-400 focus:bg-white " +
  "focus:ring-4 focus:ring-zinc-900/5 " +
  "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 " +
  "dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:focus:ring-white/5";

const FIELD_ICON = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500";

const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const SUBMIT =
  "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium " +
  "text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white";

const LINK = "font-medium text-zinc-900 hover:underline dark:text-zinc-100";

/* The two halves of the split. The left panel is PINNED — it never scrolls —
   and the right panel owns its own scroller, so a long form no longer drags
   the brand copy up with it. */
const PANEL_LEFT =
  "relative hidden lg:flex lg:w-1/2 min-w-0 shrink-0 overflow-hidden bg-[#0a0a0a] " +
  "dark:border-r dark:border-zinc-900";
const PANEL_LEFT_INNER =
  // `dark-scrollbar` because this panel is dark in BOTH themes while its
  // siblings follow the OS preference — it cannot inherit the right tokens
  // from <main>.
  "auth-brand-panel dark-scrollbar relative z-10 flex w-full flex-col overflow-y-auto px-12 py-14 xl:px-16 xl:py-16";
const PANEL_RIGHT =
  "flex w-full min-w-0 flex-col overflow-y-auto overscroll-contain bg-white lg:w-1/2 dark:bg-zinc-950";
const PANEL_RIGHT_INNER = "flex flex-1 flex-col justify-center px-5 py-10 sm:px-8 sm:py-14";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from an emailed link (?email=...&claim=...) so an attendee who
  // already has an account can sign in and find their certificate waiting.
  const claimId = searchParams.get("claim");
  const registered = searchParams.get("registered");
  useEffect(() => {
    const emailFromLink = searchParams.get("email");
    if (emailFromLink) setEmail(emailFromLink);
  }, [searchParams]);

  const handleDemoFill = (role: "admin" | "member") => {
    if (role === "admin") {
      setEmail("admin@shim.app");
      setPassword("admin123");
    } else {
      setEmail("member@shim.app");
      setPassword("member123");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        if (window.location.hostname.includes("shim-hq")) {
          try {
            const handoffRes = await fetch("/api/auth/handoff");
            if (handoffRes.ok) {
              const data = await handoffRes.json();
              if (data.url) {
                window.location.href = data.url;
                return;
              }
            }
          } catch (e) {
            console.error("Handoff failed", e);
          }
        }

        if (window.location.hostname.includes("shim-wallet")) {
          window.location.href = "/portal";
          return;
        } else if (window.location.hostname.includes("shim-studio")) {
          window.location.href = "/dashboard";
          return;
        }

        const sess = await getSession();
        window.location.href = sess?.user?.role === "member" ? "/portal" : "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { key: "admin" as const, label: "Organizer Demo", email: "admin@shim.app" },
    { key: "member" as const, label: "Attendee Demo", email: "member@shim.app" },
  ];

  return (
    /* `flex-1 min-h-0` makes the shell EXACTLY the height of <main>, and
       `overflow-hidden` stops anything escaping it. That is deliberate and
       different from the old bug: there, the shell was `overflow-hidden` with
       `min-h-screen` children, so the columns were clamped to the viewport and
       the form was clipped with nowhere to scroll. Here each column owns its
       own scroller (see PANEL_LEFT_INNER / PANEL_RIGHT), so nothing is
       unreachable — the shell itself simply never needs to scroll.
       `min-h-0` is the load-bearing bit: without it a flex item keeps
       `min-height: auto` and would grow past the viewport instead. */
    <div className="auth-shell flex-1 min-h-0 flex w-full overflow-hidden font-sans bg-[#0a0a0a]">
      {/* ---------------------------------------------------------------
          Left: brand panel. Stays dark in BOTH themes — it is the visual
          anchor — and is PINNED: it is not the scroller, so the form on the
          right can scroll all it likes without moving this copy.
          Hidden below `lg`, which also means it steps aside automatically
          when the user zooms in far enough that the CSS viewport drops
          under 1024px.
          --------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={PANEL_LEFT}
      >
        {/* Decorative wash. Sits OUTSIDE the scroller below so it is clipped
            once, by this panel, and never drifts when the copy scrolls. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-32 h-[380px] w-[380px] rounded-full bg-white/[0.05] blur-[110px]" />
          <div className="absolute -bottom-24 right-0 h-[320px] w-[320px] rounded-full bg-white/[0.04] blur-[100px]" />
        </div>

        <aside className={PANEL_LEFT_INNER}>
          {/* `my-auto` centres the copy in the space above the footer, and
              collapses to 0 when there is not enough room — so on a short
              window it simply starts at the top and scrolls instead of being
              clipped off the top edge. */}
          <div className="auth-brand-copy my-auto w-full max-w-lg">
            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-white xl:text-5xl">
              The standard for modern credentials.
            </h1>
            <p className="mb-10 max-w-md text-base leading-relaxed text-zinc-400 xl:text-lg">
              Generate, distribute, and verify thousands of digital certificates in seconds. Secured by cryptographic
              ledgers.
            </p>

            <ul className="flex flex-col gap-4">
              {[
                "Cryptographically secured records",
                "Instant QR-code validation",
                "Bulk data import via JSON/CSV",
                "Tamper-proof audit logs",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-zinc-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-brand-footer mt-10 text-sm text-zinc-500">&copy; {new Date().getFullYear()} shim Digital Platform</div>
        </aside>
      </motion.div>

      {/* ---------------------------------------------------------------
          Right: form panel. Follows the system theme and owns its own
          scroller. `overscroll-contain` stops the scroll chaining out to
          <main> when the form hits its end.
          --------------------------------------------------------------- */}
      <section className={PANEL_RIGHT}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className={PANEL_RIGHT_INNER}
        >
          <div className="mx-auto w-full max-w-[420px]">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/40 dark:shadow-none">
              <div className="mb-6">
                <h2 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Welcome Back
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Access your organizer dashboard.</p>
              </div>

              {(claimId || registered) && (
                <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Award size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {claimId
                      ? "Your certificate is waiting in your wallet. Sign in to see it."
                      : "Account created. Sign in to open your wallet."}
                  </span>
                </div>
              )}

              {/* Demo access cards */}
              <div className="mb-6 flex flex-col gap-3">
                {demoAccounts.map((acct) => (
                  <div
                    key={acct.key}
                    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-zinc-300 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                  >
                    <div className="min-w-0">
                      <div className="mb-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{acct.label}</div>
                      <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{acct.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDemoFill(acct.key)}
                      className="shrink-0 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    >
                      Auto-fill
                    </button>
                  </div>
                ))}
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-6 flex items-center gap-2.5 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
                >
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="login-email" className={LABEL}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className={FIELD_ICON} />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      className={FIELD}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@shim.app"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className={LABEL}>
                    Password
                  </label>
                  <div className="relative">
                    <Key size={16} className={FIELD_ICON} />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className={`${FIELD} pr-10`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className={SUBMIT} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  <span>{loading ? "Authenticating..." : "Sign In"}</span>
                </button>
              </form>
            </div>

            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No account?{" "}
              <Link
                href={
                  email
                    ? `/register?email=${encodeURIComponent(email)}${claimId ? `&claim=${claimId}` : ""}`
                    : "/register"
                }
                className={LINK}
              >
                Create One
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
