"use client";

import { useEffect, useState, useRef } from "react";
import { Maximize, X } from "lucide-react";
import Link from "next/link";

interface KioskClientProps {
  eventId: string;
  eventName: string;
  initialCount: number;
}

export default function KioskClient({ eventId, eventName, initialCount }: KioskClientProps) {
  const [attendanceCount, setAttendanceCount] = useState(initialCount);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate styled QR code specifically for shim
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/attend/${eventId}`;
        
        // Dynamically import to avoid Next.js SSR issues with window/document
        const QRCodeStyling = (await import("qr-code-styling")).default;
        
        const qrCode = new QRCodeStyling({
          width: 400,
          height: 400,
          type: "svg",
          data: url,
          image: `${window.location.origin}/icon.svg`,
          dotsOptions: {
            color: "#ffffff",
            type: "classy", 
          },
          cornersSquareOptions: {
            color: "#ffffff",
            type: "square",
          },
          cornersDotOptions: {
            color: "#ffffff",
            type: "square",
          },
          backgroundOptions: {
            color: "transparent",
          },
          imageOptions: {
            margin: 15,
            imageSize: 0.25
          }
        });
        
        if (qrRef.current) {
          qrRef.current.innerHTML = "";
          qrCode.append(qrRef.current);
        }
      } catch (err) {
        console.error("Failed to generate styled QR code", err);
      }
    };
    
    generateQR();
  }, [eventId]);

  // Polling for live attendance count
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/attendance-count`);
        if (res.ok) {
          const data = await res.json();
          setAttendanceCount(data.count);
        }
      } catch (err) {
        console.error("Failed to poll attendance", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [eventId]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col relative font-sans selection:bg-zinc-200">
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-6 w-full">
        <div className="flex flex-col items-center max-w-3xl w-full">
          
          {/* Top Live Attendance Pill */}
          <div className="flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm text-xs font-semibold text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Kiosk</span>
            <span className="text-zinc-300">·</span>
            <span>{attendanceCount} {attendanceCount === 1 ? "Checked In" : "Checked In"}</span>
          </div>

          <div className="text-center mb-6 sm:mb-8 max-w-full">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-800 mb-3 sm:mb-4 leading-tight break-words">
              {eventName}
            </h1>
            <p className="text-sm sm:text-xl md:text-2xl text-zinc-500 max-w-xl mx-auto font-medium px-2">
              Scan this QR code with your phone's camera to instantly check in.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative mb-10 sm:mb-12 max-w-full">
            <div className="bg-zinc-950 p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] border border-zinc-800 relative shadow-2xl">
              <div 
                ref={qrRef} 
                className="w-[240px] h-[240px] sm:w-80 sm:h-80 md:w-[400px] md:h-[400px] flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full relative"
              >
              </div>
              {/* Fallback overlay in case canvas fails to draw SVG */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none z-50 rounded-full">
                <img src="/icon-white.svg" alt="Shim Logo" className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain" />
              </div>
            </div>
            
            {/* Pulsing prompt */}
            <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 bg-white text-zinc-950 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center shadow-lg border border-zinc-200 whitespace-nowrap">
              Ready to Scan
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
