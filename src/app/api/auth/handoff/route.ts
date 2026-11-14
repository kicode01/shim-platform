import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createHandoffUrl } from "@/lib/handoff";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shouldRedirect = searchParams.get("redirect") === "1";

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      if (shouldRedirect) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const role = (session.user as any).role as string | undefined;

    const handoffUrl = await createHandoffUrl({
      userId,
      role,
      host: req.headers.get("host"),
      requestUrl: req.url,
    });

    if (shouldRedirect) {
      return NextResponse.redirect(handoffUrl);
    }

    return NextResponse.json({ url: handoffUrl });
  } catch (error) {
    console.error("Handoff generation error:", error);
    if (shouldRedirect) {
      return NextResponse.redirect(new URL("/login?error=handoff_failed", req.url));
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
