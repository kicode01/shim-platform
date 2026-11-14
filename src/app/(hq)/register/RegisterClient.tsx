"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserPlus, Mail, Key, User, ShieldAlert, ArrowLeft, Eye, EyeOff, Loader2, Award, Check,
} from "lucide-react";

/* Same tokens as LoginClient — see the notes there. Kept in sync deliberately
   so the two screens cannot drift apart again. */
const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 pl-10 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 transition-colors focus:outline-none focus:border-zinc-400 focus:bg-white " +
  "focus:ring-4 focus:ring-zinc-900/5 " +
  "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 " +
  "dark:focus:border-zinc-600 dark:focus:bg-zinc-900 dark:focus:ring-white/5";

const FIELD_ICON = "pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-zinc-400 dark:text-zinc-500";

const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const FIELD_INVALID =
  "border-red-300 focus:border-red-400 focus:ring-red-500/10 " +
  "dark:border-red-500/50 dark:focus:border-red-500 dark:focus:ring-red-500/10";

interface PasswordInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  toggleLabel: string;
  invalid?: boolean;
  describedBy?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/** Shared password input row with leading icon and show/hide visibility toggle. */
function PasswordInputField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  toggleLabel,
  invalid = false,
  describedBy,
  inputRef,
}: PasswordInputFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <Key size={16} className={FIELD_ICON} />
        <input
          ref={inputRef}
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className={`${FIELD} pr-10 ${invalid ? FIELD_INVALID : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={toggleLabel}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

const SUBMIT =
  "mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium " +
  "text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 " +
  "dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-white";

const LINK = "font-medium text-zinc-900 hover:underline dark:text-zinc-100";

/* Left pinned / right scrolls — same split contract as LoginClient. */
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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("organizer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Pre-fill from an emailed signup link (?email=...&claim=...) so the attendee
  // only has to choose a password. Default the role to attendee in that case.
  const claimId = searchParams.get("claim");
  const emailFromLink = searchParams.get("email");
  useEffect(() => {
    if (emailFromLink) {
      setEmail(emailFromLink);
      setRole("member");
    }
  }, [emailFromLink]);

  const loginHref = email
    ? `/login?email=${encodeURIComponent(email)}${claimId ? `&claim=${claimId}` : ""}`
    : "/login";

  const handlePasswordChange = (nextPassword: string) => {
    setPassword(nextPassword);
    if (error === "Passwords do not match." && (!confirmPassword || nextPassword === confirmPassword)) {
      setError("");
    }
  };

  const handleConfirmPasswordChange = (nextConfirm: string) => {
    setConfirmPassword(nextConfirm);
    if (error === "Passwords do not match." && (!nextConfirm || password === nextConfirm)) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAlreadyRegistered(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, confirmPassword, role }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // Send them straight to sign-in with the email pre-filled so the
        // certificate they were emailed is delivered to their new account.
        router.push(`/login?email=${encodeURIComponent(email)}${claimId ? `&claim=${claimId}` : ""}&registered=1`);
      } else {
        const data = await res.json();
        if (res.status === 409 || /already/i.test(data.message || "")) {
          setAlreadyRegistered(true);
          setError(data.message || "That email is already registered.");
        } else {
          setError(data.message || "Failed to register account.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "organizer", title: "Host Events", blurb: "I am an organizer." },
    { value: "member", title: "Earn Credentials", blurb: "I am an attendee." },
  ];

  return (
    /* `flex-1 min-h-0 overflow-hidden` = exactly the height of <main>, with each
       column owning its own scroller. See the longer note in LoginClient for
       why this is not the old clipping bug. */
    <div className="auth-shell flex-1 min-h-0 flex w-full overflow-hidden font-sans bg-[#0a0a0a]">
      {/* Left: brand panel — dark in both themes, and pinned (not the scroller) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={PANEL_LEFT}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-32 h-[380px] w-[380px] rounded-full bg-white/[0.05] blur-[110px]" />
          <div className="absolute -bottom-24 right-0 h-[320px] w-[320px] rounded-full bg-white/[0.04] blur-[100px]" />
        </div>

        <aside className={PANEL_LEFT_INNER}>
          <div className="auth-brand-copy my-auto w-full max-w-lg">
            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-balance text-white xl:text-5xl">
              Stop sending unverified PDFs.
            </h1>
            <p className="mb-10 max-w-md text-base leading-relaxed text-zinc-400 xl:text-lg">
              Give your participants credentials they can be proud of, backed by immutable audit logs and instant QR
              verification.
            </p>

            <ul className="flex flex-col gap-4">
              {[
                "Visual template designer",
                "1-click batch generation",
                "Public verification portal",
                "Role-based multi-credential support",
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

      {/* Right: form panel — follows the system theme, owns its own scroller */}
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
                  Create Account
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Join the standard in digital credentials.</p>
              </div>

              {claimId && (
                <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Award size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Create your account with <strong className="break-all">{emailFromLink || "your email"}</strong> and
                    your certificate will be added to your wallet automatically.
                  </span>
                </div>
              )}

              {alreadyRegistered && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>That email is already registered</span>
                  </div>
                  <p className="mb-3 text-sm text-amber-700 dark:text-amber-300/80">
                    You already have a Shim account with this email
                    {claimId ? ", and your new certificate has been added to it." : "."} Sign in instead to see your
                    wallet.
                  </p>
                  <Link
                    href={loginHref}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    <ArrowLeft size={14} /> Go to sign in
                  </Link>
                </div>
              )}

              {error && !alreadyRegistered && (
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
                  <label htmlFor="reg-name" className={LABEL}>
                    Full Name or Organization
                  </label>
                  <div className="relative">
                    <User size={16} className={FIELD_ICON} />
                    <input
                      id="reg-name"
                      type="text"
                      autoComplete="name"
                      className={FIELD}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe / Tech Corp"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className={LABEL}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className={FIELD_ICON} />
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      className={FIELD}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@shim.app"
                      required
                    />
                  </div>
                </div>

                <PasswordInputField
                  id="reg-password"
                  label="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  show={showPassword}
                  onToggleShow={() => setShowPassword(!showPassword)}
                  toggleLabel={showPassword ? "Hide password" : "Show password"}
                />

                <div>
                  <PasswordInputField
                    id="reg-confirm-password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    show={showConfirmPassword}
                    onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                    toggleLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    invalid={passwordsMismatch}
                    describedBy={confirmPassword.length > 0 ? "reg-confirm-password-feedback" : undefined}
                    inputRef={confirmPasswordRef}
                  />
                  {passwordsMismatch && (
                    <p
                      id="reg-confirm-password-feedback"
                      className="mt-1.5 text-xs text-red-600 dark:text-red-400"
                    >
                      Passwords do not match.
                    </p>
                  )}
                  {passwordsMatch && (
                    <p
                      id="reg-confirm-password-feedback"
                      className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      <Check size={12} strokeWidth={3} /> Passwords match
                    </p>
                  )}
                </div>

                <fieldset>
                  <legend className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    I want to...
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((option) => {
                      const selected = role === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`relative flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                            selected
                              ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/60"
                              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-transparent dark:hover:border-zinc-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={option.value}
                            className="sr-only"
                            checked={selected}
                            onChange={() => setRole(option.value)}
                          />
                          <span
                            aria-hidden
                            className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                              selected
                                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                                : "border-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {selected && <Check size={10} strokeWidth={3.5} />}
                          </span>
                          <span className="pr-5 text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                            {option.title}
                          </span>
                          <span className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                            {option.blurb}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <button type="submit" className={SUBMIT} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>{loading ? "Creating..." : "Create Account"}</span>
                </button>
              </form>
            </div>

            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className={LINK}>
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
