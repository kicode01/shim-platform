import { prisma } from "@/lib/prisma";
import { ACCOUNT_TIERS, AccountTier, isValidAccountTier } from "@/lib/permissions";

export const EXPERIMENTAL_PROFILE_EDITING_KEY = "experimental_profile_editing";

export interface ProfileEditingFeature {
  enabled: boolean;
  roles: AccountTier[];
  updatedAt: string | null;
}

const DEFAULT_ROLES: AccountTier[] = [...ACCOUNT_TIERS];

export function sanitizeFeatureRoles(input: unknown): AccountTier[] {
  if (!Array.isArray(input)) {
    return [...DEFAULT_ROLES];
  }
  const seen = new Set<AccountTier>();
  for (const item of input) {
    if (isValidAccountTier(item)) {
      seen.add(item);
    }
  }
  return ACCOUNT_TIERS.filter((tier) => seen.has(tier));
}

export async function getProfileEditingSetting(): Promise<ProfileEditingFeature> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: EXPERIMENTAL_PROFILE_EDITING_KEY },
      select: {
        enabled: true,
        roles: true,
        updatedAt: true,
      },
    });

    if (!row) {
      return {
        enabled: false,
        roles: [...DEFAULT_ROLES],
        updatedAt: null,
      };
    }

    return {
      enabled: row.enabled,
      roles: sanitizeFeatureRoles(row.roles),
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch (err) {
    console.warn("[SHIM] Failed to read profile editing feature flag; failing closed:", err);
    return {
      enabled: false,
      roles: [...DEFAULT_ROLES],
      updatedAt: null,
    };
  }
}

export function canUserEditOwnProfile(
  role: string | null | undefined,
  setting: Pick<ProfileEditingFeature, "enabled" | "roles">
): boolean {
  if (!setting.enabled || !isValidAccountTier(role)) {
    return false;
  }
  return setting.roles.includes(role);
}

export async function updateProfileEditingSetting(input: {
  enabled: boolean;
  roles: AccountTier[];
  updatedBy: string;
}): Promise<ProfileEditingFeature> {
  const cleanRoles = sanitizeFeatureRoles(input.roles);
  const row = await prisma.platformSetting.upsert({
    where: { key: EXPERIMENTAL_PROFILE_EDITING_KEY },
    create: {
      key: EXPERIMENTAL_PROFILE_EDITING_KEY,
      enabled: input.enabled,
      roles: cleanRoles,
      updatedBy: input.updatedBy,
    },
    update: {
      enabled: input.enabled,
      roles: cleanRoles,
      updatedBy: input.updatedBy,
    },
    select: {
      enabled: true,
      roles: true,
      updatedAt: true,
    },
  });

  return {
    enabled: row.enabled,
    roles: sanitizeFeatureRoles(row.roles),
    updatedAt: row.updatedAt.toISOString(),
  };
}
