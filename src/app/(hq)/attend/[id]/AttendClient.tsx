"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Mail, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";

const ATTENDEE_ROLE_OPTIONS = ["Speaker", "Participant", "Organizer", "Others"] as const;

interface AttendClientProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    date: string | null;
  };
}

type Result =
  | { kind: "deferred"; accountExists: boolean; emailSent: boolean }
  | { kind: "certificate"; certificateId: string; accountExists: boolean; emailSent: boolean };

export default function AttendClient({ event }: AttendClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedRole = selectedRole === "Others" ? customRole.trim() : selectedRole;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email address.");
      return;
    }
    if (!selectedRole) {
      setError("Please select your role.");
      return;
    }
    if (selectedRole === "Others" && !customRole.trim()) {
      setError("Please enter your custom role.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/attend/${event.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: resolvedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to check in");
      }

      if (data.certificateId) {
        setResult({
          kind: "certificate",
          certificateId: data.certificateId,
          accountExists: Boolean(data.accountExists),
          emailSent: Boolean(data.emailSent),
        });
      } else {
        setResult({
          kind: "deferred",
          accountExists: Boolean(data.accountExists),
          emailSent: Boolean(data.emailSent),
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimEmail = encodeURIComponent(email);
  const signupHref = `/register?email=${claimEmail}${result?.kind === "certificate" ? `&claim=${result.certificateId}` : ""}`;
  const loginHref = `/login?email=${claimEmail}${result?.kind === "certificate" ? `&claim=${result.certificateId}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-zinc-950 overflow-y-auto font-sans">
      {/* Custom Attend Header */}
      <header className="w-full px-6 py-6 flex items-center border-b border-zinc-200 shrink-0">
        <div className="max-w-md w-full mx-auto flex items-center justify-center md:justify-start gap-2">
          <img src="/icon-qr.svg" alt="Shim Logo" className="w-8 h-8 object-contain" />
        </div>
      </header>

      {/* Main Content - Full Bleed */}
      <main className="flex-1 flex flex-col px-6 py-8 md:px-12 md:py-16 w-full max-w-2xl mx-auto">
        
        <div className="text-left mb-12">
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">Event Check-In</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-3 text-zinc-800 leading-none">
            {event.name}
          </h1>
          {event.date && (
            <p className="text-zinc-500 font-medium text-lg">
              {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between">
          {result?.kind === "deferred" ? (
            <div className="animate-fade-in py-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-zinc-800 tracking-tight leading-none">
                    You're checked in
                  </h2>
                  <p className="text-zinc-500 font-medium mt-1">
                    Thanks for attending {event.name} as <span className="text-zinc-700 font-semibold">{resolvedRole}</span>.
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl p-5 mb-6 bg-zinc-50">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {result.emailSent ? (
                      <>
                        <p className="text-zinc-800 font-semibold mb-1">Check your inbox</p>
                        <p className="text-zinc-500">
                          We sent a confirmation to <span className="font-medium text-zinc-700">{email}</span>.
                          Your certificate will be emailed to you by the organizers once it's issued.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-zinc-800 font-semibold mb-1">You're on the list</p>
                        <p className="text-zinc-500">
                          Your certificate will be issued by the organizers soon and emailed to{" "}
                          <span className="font-medium text-zinc-700">{email}</span>.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {result.accountExists ? (
                  <Link
                    href={loginHref}
                    className="w-full py-4 px-6 bg-zinc-800 text-white font-bold text-lg rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-3"
                  >
                    Sign in to see it in your wallet <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    href={signupHref}
                    className="w-full py-4 px-6 bg-zinc-800 text-white font-bold text-lg rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-3"
                  >
                    Create an account to keep it <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-6 text-center leading-relaxed">
                {result.accountExists
                  ? "Your certificate will drop straight into your existing account."
                  : `Use ${email} to create your account and the certificate will land in your wallet the moment it's issued.`}
              </p>
            </div>
          ) : result?.kind === "certificate" ? (
            <div className="animate-fade-in py-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-zinc-800 tracking-tight leading-none">
                    You're checked in
                  </h2>
                  <p className="text-zinc-500 font-medium mt-1">
                    Certificate issued for {name} ({resolvedRole}).
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl p-5 mb-6 bg-zinc-50">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {result.emailSent ? (
                      <>
                        <p className="text-zinc-800 font-semibold mb-1">We emailed your certificate</p>
                        <p className="text-zinc-500">
                          Sent to <span className="font-medium text-zinc-700">{email}</span>. Follow the link in that email to view, download, or save it.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-zinc-800 font-semibold mb-1">Certificate ready</p>
                        <p className="text-zinc-500">
                          We couldn't send the email just now, but you can open your certificate directly below.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/validate?id=${result.certificateId}`}
                  className="w-full py-4 px-6 bg-zinc-800 text-white font-bold text-lg rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-3"
                >
                  View certificate now <ArrowRight className="w-5 h-5" />
                </Link>

                {result.accountExists ? (
                  <Link
                    href={loginHref}
                    className="w-full py-4 px-6 bg-white text-zinc-800 border-2 border-zinc-200 font-bold text-lg rounded-xl hover:border-zinc-400 transition-colors flex items-center justify-center gap-3"
                  >
                    Sign in to see it in your wallet
                  </Link>
                ) : (
                  <Link
                    href={signupHref}
                    className="w-full py-4 px-6 bg-white text-zinc-800 border-2 border-zinc-200 font-bold text-lg rounded-xl hover:border-zinc-400 transition-colors flex items-center justify-center gap-3"
                  >
                    Create an account to keep it <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>

              <p className="text-xs text-zinc-400 mt-6 text-center leading-relaxed">
                {result.accountExists
                  ? "This certificate has already been added to your existing Shim account."
                  : `Use ${email} to create your account and this certificate will land straight in your wallet.`}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border-l-4 border-red-500 font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-transparent border-b-2 border-zinc-200 focus:border-zinc-800 text-zinc-800 text-xl md:text-2xl py-4 focus:outline-none transition-colors placeholder:text-transparent disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                  <label 
                    htmlFor="name" 
                    className="absolute left-0 top-4 text-zinc-400 text-xl md:text-2xl transition-all peer-focus:-top-3 peer-focus:text-xs peer-focus:font-bold peer-focus:text-zinc-800 peer-focus:uppercase peer-focus:tracking-widest peer-valid:-top-3 peer-valid:text-xs peer-valid:font-bold peer-valid:text-zinc-400 peer-valid:uppercase peer-valid:tracking-widest pointer-events-none"
                  >
                    Full Name
                  </label>
                  <p className="text-xs text-zinc-400 mt-2 font-medium">How it should appear on your certificate</p>
                </div>

                <div className="relative group pt-6">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-transparent border-b-2 border-zinc-200 focus:border-zinc-800 text-zinc-800 text-xl md:text-2xl py-4 focus:outline-none transition-colors placeholder:text-transparent disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                  <label 
                    htmlFor="email" 
                    className="absolute left-0 top-10 text-zinc-400 text-xl md:text-2xl transition-all peer-focus:top-3 peer-focus:text-xs peer-focus:font-bold peer-focus:text-zinc-800 peer-focus:uppercase peer-focus:tracking-widest peer-valid:top-3 peer-valid:text-xs peer-valid:font-bold peer-valid:text-zinc-400 peer-valid:uppercase peer-valid:tracking-widest pointer-events-none"
                  >
                    Email Address
                  </label>
                </div>

                <div className="relative pt-6">
                  <label
                    htmlFor="role"
                    className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1"
                  >
                    Role *
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      required
                      value={selectedRole}
                      onChange={(e) => {
                        const next = e.target.value;
                        setSelectedRole(next);
                        if (next !== "Others") {
                          setCustomRole("");
                        }
                      }}
                      disabled={isSubmitting}
                      className={`w-full appearance-none bg-transparent border-b-2 border-zinc-200 focus:border-zinc-800 text-xl md:text-2xl py-3 pr-10 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer ${
                        selectedRole ? "text-zinc-800" : "text-zinc-400"
                      }`}
                    >
                      <option value="" disabled>
                        Select your role
                      </option>
                      {ATTENDEE_ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option} className="text-zinc-800 bg-white">
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={20}
                      className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 font-medium">Printed on your event certificate</p>
                </div>

                {selectedRole === "Others" && (
                  <div className="relative group pt-6">
                    <input
                      id="customRole"
                      type="text"
                      required
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder=" "
                      className="peer w-full bg-transparent border-b-2 border-zinc-200 focus:border-zinc-800 text-zinc-800 text-xl md:text-2xl py-4 focus:outline-none transition-colors placeholder:text-transparent disabled:opacity-50"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="customRole"
                      className="absolute left-0 top-10 text-zinc-400 text-xl md:text-2xl transition-all peer-focus:top-3 peer-focus:text-xs peer-focus:font-bold peer-focus:text-zinc-800 peer-focus:uppercase peer-focus:tracking-widest peer-valid:top-3 peer-valid:text-xs peer-valid:font-bold peer-valid:text-zinc-400 peer-valid:uppercase peer-valid:tracking-widest pointer-events-none"
                    >
                      Specify Your Role *
                    </label>
                    <p className="text-xs text-zinc-400 mt-2 font-medium">Enter your custom designation (e.g. Judge, Panelist)</p>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-12">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-zinc-800 text-white font-bold text-lg rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Checking in...
                    </>
                  ) : (
                    "Complete Check-in"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-12 text-center text-sm font-medium text-zinc-400">
          <p>Powered by <Link href="/" className="text-zinc-800 hover:text-black transition-colors font-bold">shim</Link></p>
        </div>
      </main>
    </div>
  );
}
