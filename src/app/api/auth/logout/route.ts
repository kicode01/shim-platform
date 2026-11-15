import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STANDARD_AUTH_COOKIES = [
  "next-auth.session-token",
  "next-auth.callback-url",
  "next-auth.csrf-token",
];

const SECURE_AUTH_COOKIES = [
  "__Secure-next-auth.session-token",
  "__Secure-next-auth.callback-url",
  "__Host-next-auth.csrf-token",
];

function isRequestHttps(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }
  return req.nextUrl.protocol === "https:";
}

function isNextAuthCookieName(name: string): boolean {
  return (
    name.startsWith("next-auth.") ||
    name.startsWith("__Secure-next-auth.") ||
    name.startsWith("__Host-next-auth.")
  );
}

/**
 * Clears NextAuth session, callback, and CSRF cookies on the incoming request
 * origin directly so logout never depends on a single `NEXTAUTH_URL` origin.
 */
export async function POST(req: NextRequest) {
  const isHttps = isRequestHttps(req);
  const cookiesToClear = new Map<string, boolean>();

  for (const name of STANDARD_AUTH_COOKIES) {
    cookiesToClear.set(name, false);
  }
  if (isHttps) {
    for (const name of SECURE_AUTH_COOKIES) {
      cookiesToClear.set(name, true);
    }
  }

  for (const existing of req.cookies.getAll()) {
    if (!isNextAuthCookieName(existing.name)) continue;
    const requiresSecure = existing.name.startsWith("__");
    if (requiresSecure && !isHttps) continue;
    cookiesToClear.set(existing.name, requiresSecure);
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  for (const [name, secure] of cookiesToClear.entries()) {
    const expiredOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure,
      maxAge: 0,
      expires: new Date(0),
    };
    response.cookies.set(name, "", expiredOptions);
    try {
      cookieStore?.set(name, "", expiredOptions);
    } catch {
      // Ignore read-only cookie store contexts
    }
  }

  return response;
}
