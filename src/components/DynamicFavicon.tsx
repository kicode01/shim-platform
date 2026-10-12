"use client";

import { useEffect } from "react";

/**
 * Dynamically switches the browser tab favicon between:
 * - /logo-light.svg (dark glyph for light browser theme)
 * - /logo-dark.svg (white glyph for dark browser theme)
 * Responds instantly to OS/browser theme changes.
 */
export default function DynamicFavicon() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const setFavicon = (isDark: boolean) => {
      const iconUrl = isDark ? "/logo-dark.svg" : "/logo-light.svg";

      // Update all existing icon links
      const links: NodeListOf<HTMLLinkElement> = document.querySelectorAll(
        "link[rel*='icon'], link[rel='apple-touch-icon']"
      );

      if (links.length > 0) {
        links.forEach((link) => {
          link.href = iconUrl;
        });
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/svg+xml";
        link.href = iconUrl;
        document.head.appendChild(link);
      }
    };

    // Initial check
    setFavicon(mediaQuery.matches);

    // Live listener for theme toggles
    const listener = (e: MediaQueryListEvent) => {
      setFavicon(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      // Legacy fallback
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return null;
}
