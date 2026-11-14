export function isLocalHost(host?: string | null): boolean {
  if (!host) return false;
  return host.includes("localhost") || host.includes("127.0.0.1");
}

export function getWorkspacePath(role?: string | null): "/portal" | "/dashboard" {
  return role === "member" ? "/portal" : "/dashboard";
}

export function getWorkspaceHref(role?: string | null, host?: string | null): string {
  const path = getWorkspacePath(role);
  if (!host || isLocalHost(host) || host.includes("shim-studio") || host.includes("shim-wallet")) {
    return path;
  }
  return "/api/auth/handoff?redirect=1";
}
