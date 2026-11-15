export const PROFILE_ICONS = [
  { key: "initials", label: "Initials" },
  { key: "user", label: "Person" },
  { key: "shield", label: "Shield" },
  { key: "award", label: "Award" },
  { key: "briefcase", label: "Briefcase" },
  { key: "graduation-cap", label: "Scholar" },
  { key: "sparkles", label: "Sparkles" },
  { key: "compass", label: "Compass" },
  { key: "layers", label: "Studio" },
  { key: "terminal", label: "Builder" },
] as const;

export type ProfileIconKey = (typeof PROFILE_ICONS)[number]["key"];

export const PROFILE_ICON_KEYS: readonly ProfileIconKey[] = PROFILE_ICONS.map(
  (icon) => icon.key
);

const DEMO_ACCOUNT_EMAILS = new Set([
  "admin@shim.app",
  "admin@sppq.edu",
  "organizer@shim.app",
  "member@shim.app",
]);

export const PROFILE_SYNC_EVENT = "shim:profile-sync";
export const PROFILE_SYNC_STORAGE_KEY = "shim:profile-sync";

export function isValidProfileIcon(value: unknown): value is ProfileIconKey {
  return (
    typeof value === "string" &&
    (PROFILE_ICON_KEYS as readonly string[]).includes(value)
  );
}

/**
 * Normalizes persisted `User.avatarIcon` values. `"initials"` maps to `null`
 * so the Navbar falls back cleanly to the default first-letter badge.
 */
export function normalizeStoredAvatarIcon(
  value: string | null | undefined
): string | null {
  if (!value || value === "initials" || !isValidProfileIcon(value)) {
    return null;
  }
  return value;
}

/**
 * Identifies built-in demo accounts whose hardcoded passwords in `LoginClient`
 * and `auth.ts` must stay intact for one-click Demo Sign-In.
 */
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}

/** Notifies active client listeners and same-origin tabs to re-sync profile/feature state. */
export function emitProfileSyncSignal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_SYNC_EVENT));
  try {
    window.localStorage.setItem(PROFILE_SYNC_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors in restricted browser contexts.
  }
}
