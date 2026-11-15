import { NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { getHostSurface, getRequestOrigin, getSurfaceOrigin } from "@/lib/domain";

function buildLoginErrorUrl(
  errorCode: string,
  host: string | null,
  requestOrigin: string
): URL {
  const loginOrigin =
    getHostSurface(host) === "local"
      ? requestOrigin
      : getSurfaceOrigin("hq", host);
  return new URL(`/login?error=${errorCode}`, loginOrigin);
}

export async function GET(req: Request) {
  const headerStore = await headers();
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    headerStore.get("x-forwarded-host") ||
    headerStore.get("host");
  const protoHeader =
    req.headers.get("x-forwarded-proto") || headerStore.get("x-forwarded-proto");
  const requestOrigin = getRequestOrigin(host, req.url, protoHeader);

  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        buildLoginErrorUrl("missing_handoff", host, requestOrigin)
      );
    }

    // 1. Decode and verify the handoff token
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET || "super-secret-nextauth-token-12345",
      salt: "shim-handoff-token-salt",
    });

    if (!decoded || !decoded.userId || decoded.purpose !== "handoff") {
      return NextResponse.redirect(
        buildLoginErrorUrl("invalid_handoff", host, requestOrigin)
      );
    }

    // Handoff tokens expire very quickly (e.g., 60 seconds)
    // The decode function verifies signature, but we also manually check expiry just in case
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && (decoded.exp as number) < now) {
      return NextResponse.redirect(
        buildLoginErrorUrl("expired_handoff", host, requestOrigin)
      );
    }

    // 2. Fetch the user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId as string }
    });

    if (!user || !user.isActive) {
      return NextResponse.redirect(
        buildLoginErrorUrl(
          !user ? "user_not_found" : "account_suspended",
          host,
          requestOrigin
        )
      );
    }

    // 3. Generate a NextAuth-compatible session JWT
    const sessionJwt = await encode({
      token: {
        name: user.name,
        email: user.email,
        sub: user.id, // NextAuth uses 'sub' for the user ID inherently
        id: user.id,
        role: user.role
      },
      secret: process.env.NEXTAUTH_SECRET || "super-secret-nextauth-token-12345",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // 4. Determine redirect destination on the incoming host origin
    const destination = user.role === "member" ? "/portal" : "/dashboard";
    const redirectUrl = new URL(destination, requestOrigin);
    const response = NextResponse.redirect(redirectUrl);

    // 5. Set the session cookie directly on both response and cookieStore
    const proto = req.headers.get("x-forwarded-proto") || (requestOrigin.startsWith("https://") ? "https" : "http");
    const isHttps = proto === "https";
    const secureCookieName = "__Secure-next-auth.session-token";
    const standardCookieName = "next-auth.session-token";

    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    };

    if (isHttps) {
      response.cookies.set(secureCookieName, sessionJwt, cookieOptions);
      response.cookies.set(standardCookieName, sessionJwt, { ...cookieOptions, secure: false });
    } else {
      response.cookies.set(standardCookieName, sessionJwt, cookieOptions);
    }

    try {
      const cookieStore = await cookies();
      if (isHttps) {
        cookieStore.set(secureCookieName, sessionJwt, cookieOptions);
        cookieStore.set(standardCookieName, sessionJwt, { ...cookieOptions, secure: false });
      } else {
        cookieStore.set(standardCookieName, sessionJwt, cookieOptions);
      }
    } catch {
      // Ignore if cookieStore is read-only
    }

    return response;

  } catch (error) {
    console.error("Handoff consumption error:", error);
    return NextResponse.redirect(
      buildLoginErrorUrl("server_error", host, requestOrigin)
    );
  }
}
