import Link from "next/link";
import { Search, Home, FileQuestion, ArrowLeft, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404",
  description: "Page not found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-zinc-100 font-sans">
      <div className="flex flex-col items-center text-center max-w-lg w-full">
        
        <div className="flex items-center gap-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-mono tracking-tighter text-zinc-300">404</h1>
          <div className="w-px h-8 bg-zinc-700"></div>
          <h2 className="text-sm sm:text-base font-medium tracking-wide uppercase text-zinc-300">Record Not Found</h2>
        </div>

        <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-sm">
          The requested registry record, URL, or credential could not be located.
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-2 bg-zinc-900 text-zinc-300 font-medium text-sm rounded hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
