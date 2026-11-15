export type HostSurface = "hq" | "studio" | "wallet" | "local";

/**
 * Plain `localhost` or `127.0.0.1` without a `shim-*` prefix operates as a
 * single-host local dev workspace. Simulated subdomains like
 * `shim-hq.localhost:3000`, `shim-studio.localhost:3000`, and
 * `shim-wallet.localhost:3000` resolve locally while testing multi-domain rules.
 */
export function isLocalHost(host?: string | null): boolean {
  if (!host) return false;
  return host.includes("localhost") || host.includes("127.0.0.1");
}

export function getHostSurface(host?: string | null): HostSurface {
  if (!host) return "local";
  const lower = host.toLowerCase();
  if (lower.includes("shim-studio")) return "studio";
  if (lower.includes("shim-wallet")) return "wallet";
  if (lower.includes("shim-hq")) return "hq";
  if (isLocalHost(lower)) return "local";
  return "hq";
}

export function isSimulatedSubdomain(host?: string | null): boolean {
  if (!host) return false;
  const lower = host.toLowerCase();
  return (
    isLocalHost(lower) &&
    (lower.includes("shim-hq") ||
      lower.includes("shim-studio") ||
      lower.includes("shim-wallet"))
  );
}

export function getTargetSurfaceForRole(
  role?: string | null
): "hq" | "studio" | "wallet" {
  if (role === "admin") return "hq";
  if (role === "member") return "wallet";
  return "studio";
}

export function getSurfaceOrigin(
  surface: "hq" | "studio" | "wallet",
  currentHost?: string | null
): string {
  if (currentHost && isLocalHost(currentHost)) {
    const portMatch = currentHost.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : ":3000";
    return `http://shim-${surface}.localhost${port}`;
  }
  return `https://shim-${surface}.vercel.app`;
}

/**
 * Reconstructs the public origin from the incoming `Host` header instead of `req.url`
 * (which Next.js dev/proxies may bind as `http://localhost:3000`).
 */
export function getRequestOrigin(
  host?: string | null,
  fallbackUrl?: string | null,
  protoHint?: string | null
): string {
  const cleanHost = host?.trim();
  if (cleanHost) {
    const hintedProto = protoHint?.split(",")[0]?.trim().toLowerCase();
    const proto =
      hintedProto === "http" || hintedProto === "https"
        ? hintedProto
        : isLocalHost(cleanHost) || fallbackUrl?.startsWith("http://")
          ? "http"
          : "https";
    return `${proto}://${cleanHost}`;
  }
  if (fallbackUrl) {
    try {
      return new URL(fallbackUrl).origin;
    } catch {
      // Fallback below
    }
  }
  return "http://localhost:3000";
}

export function getWorkspacePath(role?: string | null): "/portal" | "/dashboard" {
  return role === "member" ? "/portal" : "/dashboard";
}

export function getWorkspaceHref(
  role?: string | null,
  host?: string | null
): string {
  const path = getWorkspacePath(role);
  const surface = getHostSurface(host);
  if (surface === "local") {
    return path;
  }
  if (surface === getTargetSurfaceForRole(role)) {
    return path;
  }
  return "/api/auth/handoff?redirect=1";
}
