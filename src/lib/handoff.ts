import { encode } from "next-auth/jwt";
import {
  getHostSurface,
  getRequestOrigin,
  getSurfaceOrigin,
  getTargetSurfaceForRole,
} from "@/lib/domain";

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

  let effectiveHost = host || "";
  if (!effectiveHost && requestUrl) {
    try {
      effectiveHost = new URL(requestUrl).host;
    } catch {
      effectiveHost = "";
    }
  }

  const currentSurface = getHostSurface(effectiveHost);
  let targetOrigin: string;

  if (currentSurface === "local") {
    targetOrigin = getRequestOrigin(effectiveHost, requestUrl);
  } else {
    const targetSurface = getTargetSurfaceForRole(role);
    targetOrigin = getSurfaceOrigin(targetSurface, effectiveHost);
  }

  return `${targetOrigin}/api/auth/consume?token=${token}`;
}
