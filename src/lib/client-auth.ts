"use client";

import { getHostSurface, getSurfaceOrigin } from "@/lib/domain";

export interface ClientSessionUser {
  id?: string;
  role?: string;
  isActive?: boolean;
}

const REDIRECT_GUARD_KEY = "shim:auth_redirect_guard";
const REDIRECT_WINDOW_MS = 4000;
const MAX_CONSECUTIVE_REDIRECTS = 3;

/** Returns true only when the session user exists in Postgres and is active. */
export function isActiveSessionUser(
  user: ClientSessionUser | null | undefined
): user is ClientSessionUser & { id: string; isActive: true } {
  return Boolean(user?.id && user.isActive === true);
}

/** Checks whether the current URL carries an `?error=` auth/handoff parameter. */
export function hasAuthErrorQuery(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(new URLSearchParams(window.location.search).get("error"));
}

/** Clears the rapid-redirect circuit breaker after an explicit user action. */
export function clearAuthRedirectGuard(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(REDIRECT_GUARD_KEY);
  } catch {
    // Ignore storage access errors in restricted browser contexts.
  }
}

/**
 * Replaces the current history entry with `targetHref` unless doing so would
 * navigate to the exact current URL or repeat the same rapid client bounce.
 */
export function trySafeClientReplace(targetHref: string): boolean {
  if (typeof window === "undefined") return false;

  let resolvedUrl: URL;
  try {
    resolvedUrl = new URL(targetHref, window.location.href);
  } catch {
    return false;
  }

  if (resolvedUrl.href === window.location.href) {
    return false;
  }

  const from = `${window.location.origin}${window.location.pathname}`;
  const to = `${resolvedUrl.origin}${resolvedUrl.pathname}`;
  const now = Date.now();

  try {
    const raw = window.sessionStorage.getItem(REDIRECT_GUARD_KEY);
    let count = 1;
    if (raw) {
      const prev = JSON.parse(raw) as {
        from?: string;
        to?: string;
        count?: number;
        ts?: number;
      };
      if (
        typeof prev.ts === "number" &&
        now - prev.ts < REDIRECT_WINDOW_MS &&
        prev.from === from &&
        prev.to === to
      ) {
        count = (prev.count || 0) + 1;
      }
    }

    if (count >= MAX_CONSECUTIVE_REDIRECTS) {
      console.warn("[SHIM] Blocked rapid auth redirect loop:", from, "->", to);
      return false;
    }

    window.sessionStorage.setItem(
      REDIRECT_GUARD_KEY,
      JSON.stringify({ from, to, count, ts: now })
    );
  } catch {
    // Continue navigation even if sessionStorage is unavailable.
  }

  window.location.replace(resolvedUrl.href);
  return true;
}

/** Builds the canonical `/login` URL for the current surface (HQ on subdomains). */
export function getLoginUrlForCurrentHost(errorCode?: string): string {
  if (typeof window === "undefined") {
    return errorCode ? `/login?error=${encodeURIComponent(errorCode)}` : "/login";
  }

  const host = window.location.host;
  const surface = getHostSurface(host);
  const base =
    surface === "studio" || surface === "wallet"
      ? `${getSurfaceOrigin("hq", host)}/login`
      : "/login";

  return errorCode ? `${base}?error=${encodeURIComponent(errorCode)}` : base;
}
