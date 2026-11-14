import { encode } from "next-auth/jwt";
import { isLocalHost } from "@/lib/domain";

export async function createHandoffUrl(params: {
  userId: string;
  role?: string | null;
  host?: string | null;
  requestUrl?: string | null;
}): Promise<string> {
  const { userId, role, host = "", requestUrl } = params;

  const token = await encode({
    token: {
      userId,
      purpose: "handoff",
    },
    secret: process.env.NEXTAUTH_SECRET || "super-secret-nextauth-token-12345",
    salt: "shim-handoff-token-salt",
    maxAge: 60,
  });

  const isLocal = isLocalHost(host) || (requestUrl ? isLocalHost(requestUrl) : false);

  let targetDomain: string;
  if (isLocal) {
    targetDomain = "http://localhost:3000";
    if (requestUrl) {
      try {
        targetDomain = new URL(requestUrl).origin;
      } catch {
        // Fallback to host header below
      }
    } else if (host) {
      targetDomain = `http://${host}`;
    }
  } else {
    targetDomain =
      role === "member" ? "https://shim-wallet.vercel.app" : "https://shim-studio.vercel.app";
  }

  return `${targetDomain}/api/auth/consume?token=${token}`;
}
