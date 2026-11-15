import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getHostSurface, getRequestOrigin, getSurfaceOrigin } from "@/lib/domain";

const NO_STORE_ENTRY_PATHS = new Set(["/", "/login", "/register"]);

function withNoStore(response: NextResponse, pathname: string): NextResponse {
  if (NO_STORE_ENTRY_PATHS.has(pathname)) {
    // Prevent browser back/forward cache (bfcache) from restoring stale signed-out
    // snapshots of entry/auth pages once the user has signed in.
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  return response;
}

function buildRequestHeaders(req: NextRequest, effectivePath?: string): Headers {
  const requestHeaders = new Headers(req.headers);
  if (effectivePath) {
    requestHeaders.set("x-shim-pathname", effectivePath);
  }
  const authError = req.nextUrl.searchParams.get("error")?.trim();
  if (authError) {
    requestHeaders.set("x-shim-auth-error", authError);
  } else {
    requestHeaders.delete("x-shim-auth-error");
  }
  return requestHeaders;
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const requestOrigin = getRequestOrigin(
    hostname,
    req.url,
    req.headers.get("x-forwarded-proto")
  );
  const pathname = url.pathname;

  // Skip static assets and API routes immediately
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Pass global auth and public verification routes straight through while
  // still forwarding sanitized request headers (e.g. x-shim-auth-error) and no-store.
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/logout" ||
    pathname.startsWith("/validate") ||
    pathname.startsWith("/attend") ||
    pathname.startsWith("/kiosk") ||
    pathname.startsWith("/scanner")
  ) {
    const requestHeaders = buildRequestHeaders(req);
    return withNoStore(
      NextResponse.next({ request: { headers: requestHeaders } }),
      pathname
    );
  }

  const surface = getHostSurface(hostname);

  const nextWithPath = (effectivePath: string, rewriteTarget?: URL) => {
    const requestHeaders = buildRequestHeaders(req, effectivePath);
    const response = rewriteTarget
      ? NextResponse.rewrite(rewriteTarget, {
          request: { headers: requestHeaders },
        })
      : NextResponse.next({
          request: { headers: requestHeaders },
        });
    return withNoStore(response, pathname);
  };

  // Organizer Workspace (shim-studio)
  if (surface === "studio") {
    if (pathname.startsWith("/portal")) {
      const rest = pathname.replace(/^\/portal/, "") || "";
      return NextResponse.redirect(
        new URL(`${getSurfaceOrigin("wallet", hostname)}${rest}`)
      );
    }

    if (pathname === "/") {
      return withNoStore(NextResponse.redirect(new URL("/dashboard", requestOrigin)), pathname);
    }

    if (!pathname.startsWith("/dashboard")) {
      url.pathname = `/dashboard${pathname}`;
      return nextWithPath(url.pathname, url);
    }
    return nextWithPath(pathname);
  }

  // Attendee Wallet (shim-wallet)
  if (surface === "wallet") {
    if (pathname.startsWith("/dashboard")) {
      const rest = pathname.replace(/^\/dashboard/, "") || "";
      return NextResponse.redirect(
        new URL(`${getSurfaceOrigin("studio", hostname)}${rest}`)
      );
    }

    if (pathname === "/") {
      return withNoStore(NextResponse.redirect(new URL("/portal", requestOrigin)), pathname);
    }

    if (!pathname.startsWith("/portal")) {
      url.pathname = `/portal${pathname}`;
      return nextWithPath(url.pathname, url);
    }
    return nextWithPath(pathname);
  }

  // Main / Admin Workspace (shim-hq):
  // Serves public landing + auth routes AND /dashboard for authenticated admins.
  // Organizers hitting /dashboard or anyone hitting /portal are routed cleanly server-side.
  if (surface === "hq" && pathname.startsWith("/portal")) {
    const rest = pathname.replace(/^\/portal/, "") || "";
    return NextResponse.redirect(
      new URL(`${getSurfaceOrigin("wallet", hostname)}${rest}`)
    );
  }

  return nextWithPath(pathname);
}
