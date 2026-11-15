import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getHostSurface, getRequestOrigin, getSurfaceOrigin } from "@/lib/domain";

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";
  const requestOrigin = getRequestOrigin(
    hostname,
    req.url,
    req.headers.get("x-forwarded-proto")
  );
  const pathname = url.pathname;

  // Skip static assets, API routes, and global auth/verification pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/logout" ||
    pathname.startsWith("/validate") ||
    pathname.startsWith("/attend") ||
    pathname.startsWith("/kiosk") ||
    pathname.startsWith("/scanner")
  ) {
    return NextResponse.next();
  }

  const surface = getHostSurface(hostname);

  const nextWithPath = (effectivePath: string, rewriteTarget?: URL) => {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-shim-pathname", effectivePath);
    if (rewriteTarget) {
      return NextResponse.rewrite(rewriteTarget, {
        request: { headers: requestHeaders },
      });
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
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
      return NextResponse.redirect(new URL("/dashboard", requestOrigin));
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
      return NextResponse.redirect(new URL("/portal", requestOrigin));
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
