import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Cinzel, Cormorant_Garamond, Great_Vibes, Playfair_Display, Space_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import SurfaceMarker from "@/components/SurfaceMarker";
import DynamicFavicon from "@/components/DynamicFavicon";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-spacemono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-spacegrotesk",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "shim",
    template: "shim | %s",
  },
  description: "Cryptographic credential platform with instant verification.",
  keywords: ["Digital Certificates", "QR Verification", "Event Management", "Certificate Generator", "Seminar Certificates"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shim",
  },
  icons: {
    icon: [
      { url: "/logo-light.svg", media: "(prefers-color-scheme: light)", type: "image/svg+xml" },
      { url: "/logo-dark.svg", media: "(prefers-color-scheme: dark)", type: "image/svg+xml" },
    ],
    shortcut: [
      { url: "/logo-light.svg", media: "(prefers-color-scheme: light)" },
      { url: "/logo-dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/logo-light.svg", media: "(prefers-color-scheme: light)" },
      { url: "/logo-dark.svg", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${cinzel.variable} ${cormorant.variable} ${greatVibes.variable} ${playfair.variable} ${spaceMono.variable} ${spaceGrotesk.variable}`}>
      <body className="flex flex-col h-screen w-full overflow-hidden bg-[#0a0a0a]">
        <AuthProvider>
          <DynamicFavicon />
          <Navbar />
          {/* <main> is the app-wide scroll container, so it owns the page
              surface.

              NO `scrollbar-gutter: stable` here. It used to be set, to stop
              content jumping when a scrollbar appeared — but it reserves the
              gutter on EVERY route, including the ones where <main> never
              overflows because an inner panel is the real scroller (the
              dashboard, /login, /register, /validate). On those routes the
              reservation showed up as an empty rail sitting immediately next
              to the genuine scrollbar: the "double scrollbar". A scrollbar
              gutter must live on the element that actually scrolls, so there
              is no way to have it here without paying that cost everywhere.

              Dropping it also removes the reason `bg-zinc-50` had to live on
              <main> in the first place: an unpainted gutter used to let
              <body>'s near-black show through as a stripe down the right edge.
              With no gutter there is nothing to paint. The surface colour stays
              here anyway so light pages don't each have to declare one.

              <SurfaceMarker /> still sets `data-surface` from the route, which
              drives the scrollbar thumb tokens in globals.css — so the dark
              pages (/validate, /login, /) get a light thumb and light pages a
              dark one, without either page reaching outside itself. */}
          <main data-app-scroll data-surface="light" className="flex-1 flex flex-col relative min-h-0 overflow-y-auto bg-zinc-50">
            <SurfaceMarker />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
