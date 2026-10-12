import { NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing_handoff", req.url));
    }

    // 1. Decode and verify the handoff token
    const decoded = await decode({
      token,
      secret: process.env.NEXTAUTH_SECRET || "super-secret-nextauth-token-12345",
      salt: "shim-handoff-token-salt",
    });

    if (!decoded || !decoded.userId || decoded.purpose !== "handoff") {
      return NextResponse.redirect(new URL("/login?error=invalid_handoff", req.url));
    }

    // Handoff tokens expire very quickly (e.g., 60 seconds)
    // The decode function verifies signature, but we also manually check expiry just in case
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && (decoded.exp as number) < now) {
      return NextResponse.redirect(new URL("/login?error=expired_handoff", req.url));
    }

    // 2. Fetch the user to ensure they still exist and get their latest details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId as string }
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=user_not_found", req.url));
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

    // 4. Set the session cookie directly
    const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https://") ? "https" : "http");
    const isHttps = proto === "https";
    const cookieName = isHttps ? "__Secure-next-auth.session-token" : "next-auth.session-token";

    const cookieStore = await cookies();
    cookieStore.set(cookieName, sessionJwt, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // 5. Redirect instantly to their correct portal based on role
    const destination = user.role === "member" ? "/portal" : "/dashboard";
    return NextResponse.redirect(new URL(destination, req.url));

  } catch (error) {
    console.error("Handoff consumption error:", error);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}
