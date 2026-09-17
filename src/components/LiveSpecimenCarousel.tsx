"use client";

import React, { useState, useEffect } from "react";

const CERTIFICATES = [
  // 1. Brutalist / Default
  {
    id: "brutalist",
    render: (isActive: boolean) => (
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: isActive ? 10 : 0 }}
      >
        <svg viewBox="0 0 800 560" className="w-full h-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;900&family=Playfair+Display:wght@700&family=Alex+Brush&display=swap');
              `}
            </style>
          </defs>
          <rect width="800" height="560" fill="#fcfbf7" />
          
          <rect x="24" y="24" width="752" height="512" fill="none" stroke="#0f172a" strokeWidth="4" />
          <rect x="30" y="30" width="740" height="500" fill="none" stroke="#0f172a" strokeWidth="1" />
          
          <text x="64" y="80" fontFamily="'Inter', sans-serif" fontSize="32" fontWeight="900" fill="#0f172a" letterSpacing="-1.5">shim</text>
          <text x="64" y="100" fontFamily="'Inter', sans-serif" fontSize="11" fontWeight="700" fill="#64748b" letterSpacing="3">PROFESSIONAL CREDENTIALING</text>
          
          <text x="736" y="80" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="700" fill="#64748b" letterSpacing="2" textAnchor="end">DATE OF ISSUE</text>
          <text x="736" y="100" fontFamily="monospace" fontSize="16" fontWeight="600" fill="#0f172a" textAnchor="end">OCT 24, 2026</text>
          
          <text x="64" y="220" fontFamily="'Inter', sans-serif" fontSize="14" fontWeight="800" fill="#64748b" letterSpacing="4">CERTIFICATE OF ACHIEVEMENT</text>
          <text x="64" y="260" fontFamily="'Inter', sans-serif" fontSize="20" fontWeight="500" fill="#0f172a">This certifies that</text>
          
          <text x="64" y="330" fontFamily="'Playfair Display', serif" fontSize="64" fontWeight="700" fill="#0f172a">Jane Doe</text>
          
          <text x="64" y="390" fontFamily="'Inter', sans-serif" fontSize="20" fontWeight="500" fill="#0f172a">has successfully completed the requirements for</text>
          <text x="64" y="430" fontFamily="'Inter', sans-serif" fontSize="28" fontWeight="900" fill="#0f172a" letterSpacing="-0.5">Global Tech Summit 2026</text>
          
          <path d="M 64 500 L 260 500" stroke="#0f172a" strokeWidth="2" />
          <text x="162" y="490" fontFamily="'Alex Brush', cursive" fontSize="36" fill="#0f172a" textAnchor="middle">John Smith</text>
          <text x="162" y="520" fontFamily="'Inter', sans-serif" fontSize="11" fontWeight="800" fill="#64748b" letterSpacing="2" textAnchor="middle">EVENT DIRECTOR</text>
          
          <g transform="translate(636, 400)">
            <rect width="100" height="100" fill="#fff" stroke="#0f172a" strokeWidth="3" />
            <path d="M 15 15 L 40 15 L 40 40 L 15 40 Z M 22 22 L 33 22 L 33 33 L 22 33 Z" fill="#0f172a" />
            <path d="M 60 15 L 85 15 L 85 40 L 60 40 Z M 67 22 L 78 22 L 78 33 L 67 33 Z" fill="#0f172a" />
            <path d="M 15 60 L 40 60 L 40 85 L 15 85 Z M 22 67 L 33 67 L 33 78 L 22 78 Z" fill="#0f172a" />
            <rect x="50" y="15" width="5" height="5" fill="#0f172a" />
            <rect x="50" y="25" width="5" height="5" fill="#0f172a" />
            <rect x="15" y="50" width="5" height="5" fill="#0f172a" />
            <rect x="25" y="50" width="5" height="5" fill="#0f172a" />
            <rect x="40" y="50" width="25" height="5" fill="#0f172a" />
            <rect x="80" y="50" width="5" height="5" fill="#0f172a" />
            <rect x="50" y="60" width="10" height="25" fill="#0f172a" />
            <rect x="65" y="60" width="5" height="5" fill="#0f172a" />
            <rect x="65" y="70" width="15" height="15" fill="#0f172a" />
            <rect x="80" y="60" width="5" height="25" fill="#0f172a" />
          </g>
        </svg>
      </div>
    )
  },
  // 2. Academic / Classic
  {
    id: "academic",
    render: (isActive: boolean) => (
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: isActive ? 10 : 0 }}
      >
        <svg viewBox="0 0 800 560" className="w-full h-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Pinyon+Script&family=Inter:wght@600;700&display=swap');
              `}
            </style>
          </defs>
          <rect width="800" height="560" fill="#fffdf5" />
          
          <rect x="30" y="30" width="740" height="500" fill="none" stroke="#7f1d1d" strokeWidth="8" />
          <rect x="42" y="42" width="716" height="476" fill="none" stroke="#7f1d1d" strokeWidth="2" />
          <rect x="48" y="48" width="704" height="464" fill="none" stroke="#7f1d1d" strokeWidth="1" />
          
          <text x="400" y="90" fontFamily="'Playfair Display', serif" fontSize="28" fontWeight="700" fill="#7f1d1d" letterSpacing="4" textAnchor="middle">SHIM UNIVERSITY</text>
          <text x="400" y="115" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="700" fill="#b45309" letterSpacing="6" textAnchor="middle">ACADEMIC EXCELLENCE</text>
          
          <text x="400" y="210" fontFamily="'Playfair Display', serif" fontSize="18" fill="#475569" fontStyle="italic" textAnchor="middle">This document is proudly presented to</text>
          
          <text x="400" y="280" fontFamily="'Playfair Display', serif" fontSize="64" fontWeight="700" fill="#1e293b" textAnchor="middle">Dr. Alan Turing</text>
          
          <text x="400" y="340" fontFamily="'Playfair Display', serif" fontSize="16" fill="#475569" textAnchor="middle">in recognition of outstanding contributions to the</text>
          <text x="400" y="380" fontFamily="'Playfair Display', serif" fontSize="26" fontWeight="700" fill="#7f1d1d" textAnchor="middle">AI Frontiers Conference</text>
          
          <path d="M 120 460 L 300 460" stroke="#1e293b" strokeWidth="1" />
          <text x="210" y="445" fontFamily="'Pinyon Script', cursive" fontSize="36" fill="#1e293b" textAnchor="middle">Alice Johnson</text>
          <text x="210" y="480" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="700" fill="#64748b" letterSpacing="2" textAnchor="middle">PROGRAM CHAIR</text>
          
          <g transform="translate(400, 450)">
            <circle r="35" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
            <circle r="28" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3,3" />
            <text y="5" fontFamily="'Playfair Display', serif" fontSize="24" fontWeight="bold" fill="#b45309" textAnchor="middle">★</text>
          </g>

          <path d="M 500 460 L 680 460" stroke="#1e293b" strokeWidth="1" />
          <text x="590" y="445" fontFamily="'Playfair Display', serif" fontSize="20" fill="#1e293b" textAnchor="middle">Nov 12, 2026</text>
          <text x="590" y="480" fontFamily="'Inter', sans-serif" fontSize="10" fontWeight="700" fill="#64748b" letterSpacing="2" textAnchor="middle">DATE OF ISSUE</text>
        </svg>
      </div>
    )
  },
  // 3. Modern Minimalist / Tech
  {
    id: "minimalist",
    render: (isActive: boolean) => (
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: isActive ? 10 : 0 }}
      >
        <svg viewBox="0 0 800 560" className="w-full h-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Space+Mono:wght@400;700&display=swap');
              `}
            </style>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#fff" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="800" height="560" fill="#064e3b" />
          <rect width="800" height="560" fill="url(#grid)" opacity="0.1" />
          
          <rect x="40" y="40" width="720" height="480" fill="#ffffff" />
          <rect x="40" y="40" width="720" height="8" fill="#10b981" />
          
          <text x="80" y="100" fontFamily="'Space Mono', monospace" fontSize="20" fontWeight="700" fill="#047857" letterSpacing="1">shim // VERIFIED</text>
          <text x="720" y="100" fontFamily="'Space Mono', monospace" fontSize="14" fill="#94a3b8" textAnchor="end">DEC 05, 2026</text>
          
          <text x="80" y="200" fontFamily="'Outfit', sans-serif" fontSize="12" fontWeight="800" fill="#64748b" letterSpacing="4">HACKATHON WINNER</text>
          <text x="80" y="270" fontFamily="'Outfit', sans-serif" fontSize="56" fontWeight="900" fill="#0f172a" letterSpacing="-1.5">Sarah Jenkins</text>
          
          <text x="80" y="320" fontFamily="'Outfit', sans-serif" fontSize="18" fontWeight="400" fill="#475569">Awarded first place in the</text>
          <text x="80" y="355" fontFamily="'Outfit', sans-serif" fontSize="24" fontWeight="800" fill="#047857">Web3 Developers Hackathon</text>
          
          <path d="M 520 460 L 720 460" stroke="#cbd5e1" strokeWidth="2" />
          <text x="520" y="445" fontFamily="'Outfit', sans-serif" fontSize="24" fontWeight="800" fill="#0f172a">Michael Chen</text>
          <text x="520" y="485" fontFamily="'Space Mono', monospace" fontSize="11" fill="#64748b" letterSpacing="1">LEAD ORGANIZER</text>
          
          <g transform="translate(80, 420)">
            <rect width="80" height="80" fill="#f8fafc" />
            <path d="M 0 0 L 80 0 L 80 80 L 0 80 Z" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <path d="M 10 10 L 30 10 L 30 30 L 10 30 Z M 15 15 L 25 15 L 25 25 L 15 25 Z" fill="#047857" />
            <path d="M 50 10 L 70 10 L 70 30 L 50 30 Z M 55 15 L 65 15 L 65 25 L 55 25 Z" fill="#047857" />
            <path d="M 10 50 L 30 50 L 30 70 L 10 70 Z M 15 55 L 25 55 L 25 65 L 15 65 Z" fill="#047857" />
            
            <rect x="40" y="10" width="5" height="5" fill="#047857" />
            <rect x="40" y="20" width="5" height="5" fill="#047857" />
            <rect x="10" y="40" width="5" height="5" fill="#047857" />
            <rect x="20" y="40" width="5" height="5" fill="#047857" />
            <rect x="35" y="40" width="20" height="5" fill="#047857" />
            <rect x="65" y="40" width="5" height="5" fill="#047857" />
            <rect x="40" y="50" width="10" height="20" fill="#047857" />
            <rect x="55" y="50" width="5" height="5" fill="#047857" />
            <rect x="55" y="60" width="15" height="10" fill="#047857" />
            <rect x="65" y="50" width="5" height="20" fill="#047857" />
          </g>
        </svg>
      </div>
    )
  },
  // 4. Corporate / Modern
  {
    id: "corporate",
    render: (isActive: boolean) => (
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: isActive ? 10 : 0 }}
      >
        <svg viewBox="0 0 800 560" className="w-full h-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap');
              `}
            </style>
            <linearGradient id="corpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eef2ff" />
              <stop offset="100%" stopColor="#e0e7ff" />
            </linearGradient>
          </defs>
          <rect width="800" height="560" fill="url(#corpGrad)" />
          
          <path d="M 0 0 L 800 0 L 800 120 C 500 200 300 0 0 120 Z" fill="#312e81" />
          
          <text x="40" y="60" fontFamily="'Outfit', sans-serif" fontSize="28" fontWeight="900" fill="#ffffff" letterSpacing="-0.5">SHIM INSTITUTE</text>
          <text x="40" y="80" fontFamily="'Outfit', sans-serif" fontSize="12" fontWeight="600" fill="#a5b4fc" letterSpacing="1">ENTERPRISE CREDENTIAL</text>
          
          <text x="40" y="240" fontFamily="'Outfit', sans-serif" fontSize="16" fontWeight="800" fill="#4338ca" letterSpacing="2">CERTIFICATE OF COMPLETION</text>
          <text x="40" y="320" fontFamily="'Outfit', sans-serif" fontSize="56" fontWeight="900" fill="#1e1b4b" letterSpacing="-1">David Miller</text>
          
          <text x="40" y="370" fontFamily="'Outfit', sans-serif" fontSize="18" fill="#475569">has completed the professional training program:</text>
          <text x="40" y="410" fontFamily="'Outfit', sans-serif" fontSize="28" fontWeight="800" fill="#312e81">Cybersecurity Fundamentals 101</text>
          
          <path d="M 40 500 L 240 500" stroke="#cbd5e1" strokeWidth="2" />
          <text x="40" y="485" fontFamily="'Outfit', sans-serif" fontSize="24" fontWeight="600" fill="#1e1b4b">Sarah Jenkins</text>
          <text x="40" y="520" fontFamily="'Outfit', sans-serif" fontSize="11" fontWeight="700" fill="#64748b" letterSpacing="1">LEAD INSTRUCTOR</text>
          
          <g transform="translate(680, 40)">
             <circle cx="60" cy="60" r="40" fill="#ffffff" stroke="#c7d2fe" strokeWidth="4" />
             <path d="M 45 60 L 55 70 L 75 50" fill="none" stroke="#4338ca" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
    )
  },
  // 5. Creative / Agency
  {
    id: "creative",
    render: (isActive: boolean) => (
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: isActive ? 10 : 0 }}
      >
        <svg viewBox="0 0 800 560" className="w-full h-auto drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&display=swap');
              `}
            </style>
            <linearGradient id="creativeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="100%" stopColor="#ffe4e6" />
            </linearGradient>
          </defs>
          <rect width="800" height="560" fill="url(#creativeGrad)" />
          
          {/* giant background text */}
          <text x="400" y="350" fontFamily="'Space Grotesk', sans-serif" fontSize="240" fontWeight="900" fill="#fecdd3" opacity="0.4" textAnchor="middle">SHIM</text>
          
          <circle cx="100" cy="100" r="150" fill="#f43f5e" opacity="0.1" />
          <circle cx="700" cy="450" r="200" fill="#fb923c" opacity="0.1" />
          
          <text x="60" y="100" fontFamily="'Space Grotesk', sans-serif" fontSize="14" fontWeight="900" fill="#e11d48" letterSpacing="4">CREATIVE MASTERCLASS</text>
          <text x="740" y="100" fontFamily="'Space Grotesk', sans-serif" fontSize="14" fontWeight="700" fill="#881337" textAnchor="end">NO. 849201</text>
          
          <text x="60" y="260" fontFamily="'Space Grotesk', sans-serif" fontSize="72" fontWeight="900" fill="#881337" letterSpacing="-2">Elena Rodriguez</text>
          
          <text x="60" y="320" fontFamily="'Space Grotesk', sans-serif" fontSize="24" fontWeight="700" fill="#e11d48">Advanced UI/UX Masterclass</text>
          
          <rect x="60" y="350" width="80" height="8" fill="#f43f5e" />
          
          <path d="M 60 500 L 260 500" stroke="#fecdd3" strokeWidth="3" />
          <text x="60" y="485" fontFamily="'Space Grotesk', sans-serif" fontSize="24" fontWeight="900" fill="#881337">Alex Morgan</text>
          <text x="60" y="520" fontFamily="'Space Grotesk', sans-serif" fontSize="12" fontWeight="700" fill="#e11d48" letterSpacing="1">CREATIVE DIRECTOR</text>
        </svg>
      </div>
    )
  }
];

export default function LiveSpecimenCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CERTIFICATES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[800/560] pointer-events-none">
      {CERTIFICATES.map((cert, index) => {
        const isActive = index === currentIndex;
        return <React.Fragment key={cert.id}>{cert.render(isActive)}</React.Fragment>;
      })}
    </div>
  );
}
