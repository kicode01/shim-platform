import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHandoffUrl } from "@/lib/handoff";
import { getHostSurface, getRequestOrigin, getSurfaceOrigin } from "@/lib/domain";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shouldRedirect = searchParams.get("redirect") === "1";
  const host = req.headers.get("host");
  const requestOrigin = getRequestOrigin(
    host,
    req.url,
    req.headers.get("x-forwarded-proto")
  );
  const loginOrigin =
    getHostSurface(host) === "local"
      ? requestOrigin
      : getSurfaceOrigin("hq", host);

  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id as string | undefined;

    if (!session?.user || !sessionUserId) {
      if (shouldRedirect) {
        return NextResponse.redirect(new URL("/login", loginOrigin));
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      if (shouldRedirect) {
        return NextResponse.redirect(
          new URL("/login?error=account_suspended", loginOrigin)
        );
      }
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const handoffUrl = await createHandoffUrl({
      userId: dbUser.id,
      role: dbUser.role,
      host,
      requestUrl: req.url,
    });

    if (shouldRedirect) {
      return NextResponse.redirect(handoffUrl);
    }

    return NextResponse.json({ url: handoffUrl });
  } catch (error) {
    console.error("Handoff generation error:", error);
    if (shouldRedirect) {
      return NextResponse.redirect(
        new URL("/login?error=handoff_failed", loginOrigin)
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
