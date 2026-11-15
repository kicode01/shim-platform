/**
 * Per-account dashboard page permissions and role access helpers.
 * "admin" always holds full access to every page including Admin-only "users".
 * "organizer" accounts only see modules enabled in their `allowedPages` list.
 */

export const ORGANIZER_PAGES = [
  { key: "overview", label: "Overview", shortLabel: "Home", href: "/dashboard" },
  { key: "credentials", label: "Credentials", shortLabel: "Creds", href: "/dashboard/credentials" },
  { key: "events", label: "Events", shortLabel: "Events", href: "/dashboard/events" },
  { key: "templates", label: "Templates", shortLabel: "Studio", href: "/dashboard/templates" },
  { key: "issue", label: "Issue", shortLabel: "Issue", href: "/dashboard/generate" },
  { key: "audit", label: "Audit", shortLabel: "Audit", href: "/dashboard/audit" },
  { key: "support", label: "Support", shortLabel: "Support", href: "/dashboard/support" },
] as const;

export type OrganizerPageKey = (typeof ORGANIZER_PAGES)[number]["key"];

export const ORGANIZER_PAGE_KEYS: readonly OrganizerPageKey[] = ORGANIZER_PAGES.map(
  (p) => p.key
);

/** Default pages granted to self-registered organizer accounts (Support stays off until Admin grants it). */
export const DEFAULT_ORGANIZER_PAGES: OrganizerPageKey[] = [
  "overview",
  "credentials",
  "events",
  "templates",
  "issue",
  "audit",
];

export type DashboardGateKey = OrganizerPageKey | "admin-only";

export const ACCOUNT_TIERS = ["admin", "organizer", "member"] as const;
export type AccountTier = (typeof ACCOUNT_TIERS)[number];

export function isValidAccountTier(value: unknown): value is AccountTier {
  return (
    typeof value === "string" &&
    (ACCOUNT_TIERS as readonly string[]).includes(value)
  );
}

export function isValidOrganizerPageKey(value: unknown): value is OrganizerPageKey {
  return (
    typeof value === "string" &&
    (ORGANIZER_PAGE_KEYS as readonly string[]).includes(value)
  );
}

export function sanitizeAllowedPages(input: unknown): OrganizerPageKey[] {
  if (!Array.isArray(input)) {
    return [...DEFAULT_ORGANIZER_PAGES];
  }
  const seen = new Set<OrganizerPageKey>();
  for (const item of input) {
    if (isValidOrganizerPageKey(item)) {
      seen.add(item);
    }
  }
  return ORGANIZER_PAGE_KEYS.filter((k) => seen.has(k));
}

export function resolveEffectiveAllowedPages(
  role: string | null | undefined,
  allowedPages: readonly string[] | null | undefined
): OrganizerPageKey[] {
  if (role === "admin") {
    return [...ORGANIZER_PAGE_KEYS];
  }
  if (!Array.isArray(allowedPages)) {
    return [...DEFAULT_ORGANIZER_PAGES];
  }
  return ORGANIZER_PAGE_KEYS.filter((k) => allowedPages.includes(k));
}

export function canAccessDashboardPage(
  role: string | null | undefined,
  allowedPages: readonly string[] | null | undefined,
  pageKey: DashboardGateKey
): boolean {
  if (role === "admin") return true;
  if (role !== "organizer") return false;
  if (pageKey === "admin-only") return false;
  const effective = resolveEffectiveAllowedPages(role, allowedPages);
  return effective.includes(pageKey);
}

export function getFirstAllowedDashboardHref(
  role: string | null | undefined,
  allowedPages: readonly string[] | null | undefined
): string | null {
  if (role === "admin") return "/dashboard";
  if (role !== "organizer") return null;
  const effective = resolveEffectiveAllowedPages(role, allowedPages);
  const first = ORGANIZER_PAGES.find((p) => effective.includes(p.key));
  return first ? first.href : null;
}

export function getPageKeyForDashboardPath(
  pathname: string
): DashboardGateKey | null {
  if (pathname === "/dashboard") return "overview";
  if (pathname.startsWith("/dashboard/users")) return "admin-only";
  if (pathname.startsWith("/dashboard/credentials")) return "credentials";
  if (pathname.startsWith("/dashboard/events")) return "events";
  if (pathname.startsWith("/dashboard/templates")) return "templates";
  if (pathname.startsWith("/dashboard/generate")) return "issue";
  if (pathname.startsWith("/dashboard/audit")) return "audit";
  if (pathname.startsWith("/dashboard/support")) return "support";
  return null;
}
