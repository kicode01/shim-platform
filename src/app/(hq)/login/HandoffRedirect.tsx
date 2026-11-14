"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, LogOut } from "lucide-react";

interface HandoffRedirectProps {
  url: string;
  role?: string | null;
}

export default function HandoffRedirect({ url, role }: HandoffRedirectProps) {
  const destinationLabel = role === "member" ? "Attendee Wallet" : "Organizer Studio";

  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-zinc-100 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-100" />
        </div>
        <h1 className="text-base font-semibold text-zinc-50">
          Redirecting to your {destinationLabel}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          You are already signed in. Opening your workspace now...
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <a
            href={url}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
          >
            <span>Continue to {destinationLabel}</span>
            <ArrowRight size={15} />
          </a>
          <Link
            href="/logout"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <LogOut size={13} />
            <span>Sign out to switch account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
