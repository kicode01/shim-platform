"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { getSession, SessionProvider, useSession } from "next-auth/react";
import { getHostSurface, getWorkspaceHref } from "@/lib/domain";
import {
  ClientSessionUser,
  getLoginUrlForCurrentHost,
  hasAuthErrorQuery,
  isActiveSessionUser,
  trySafeClientReplace,
} from "@/lib/client-auth";

const ENTRY_PATHS = new Set(["/", "/login", "/register"]);
const AUTO_SESSION_REDIRECT_PATHS = new Set(["/", "/register"]);
const PUBLIC_UTILITY_PREFIXES = [
  "/validate",
  "/attend",
  "/kiosk",
  "/scanner",
  "/logout",
];

function isProtectedPath(path: string, host: string): boolean {
  const surface = getHostSurface(host);
  if (surface === "studio" || surface === "wallet") {
    return (
      !ENTRY_PATHS.has(path) &&
      !PUBLIC_UTILITY_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`)
      )
    );
  }
  return path.startsWith("/dashboard") || path.startsWith("/portal");
}

/**
 * Re-validates entry and protected routes if restored from bfcache or client history:
 * active signed-in users visiting `/`, `/login`, or `/register` are sent straight to
 * their workspace without prompting, while `?error=` flows and suspended/stale cookies
 * never bounce back into a loop.
 */
function AuthenticatedEntryGuard() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handlePageShow = async (event: PageTransitionEvent) => {
      const navEntry = performance.getEntriesByType?.("navigation")?.[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isBackForward =
        event.persisted || navEntry?.type === "back_forward";
      if (!isBackForward) return;

      const path = window.location.pathname;
      const host = window.location.host;
      const isEntry = ENTRY_PATHS.has(path);
      const isProtected = isProtectedPath(path, host);
      if (!isEntry && !isProtected) return;

      if (isEntry && hasAuthErrorQuery()) return;

      const current = await getSession();
      const user = current?.user as ClientSessionUser | undefined;
      if (isEntry && isActiveSessionUser(user)) {
        trySafeClientReplace(getWorkspaceHref(user.role, host));
      } else if (isProtected && !isActiveSessionUser(user)) {
        const errorCode =
          user?.isActive === false ? "account_suspended" : undefined;
        trySafeClientReplace(getLoginUrlForCurrentHost(errorCode));
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !AUTO_SESSION_REDIRECT_PATHS.has(pathname) ||
      hasAuthErrorQuery()
    ) {
      return;
    }
    const user = session?.user as ClientSessionUser | undefined;
    if (!isActiveSessionUser(user)) return;
    trySafeClientReplace(getWorkspaceHref(user.role, window.location.host));
  }, [pathname, session, status]);

  return null;
}

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <AuthenticatedEntryGuard />
      {children}
    </SessionProvider>
  );
}
