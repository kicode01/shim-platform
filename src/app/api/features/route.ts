import { NextResponse } from "next/server";
import {
  requireApiSessionUser,
  requireApiStaffAccess,
} from "@/lib/auth-guard";
import {
  canUserEditOwnProfile,
  getProfileEditingSetting,
  ProfileEditingFeature,
  updateProfileEditingSetting,
} from "@/lib/features";
import { AccountTier, isValidAccountTier } from "@/lib/permissions";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function buildFeaturePayload(
  role: string,
  setting: ProfileEditingFeature
) {
  return {
    profileEditing: {
      ...setting,
      canEditOwnProfile: canUserEditOwnProfile(role, setting),
    },
  };
}

export async function GET() {
  const { user, error } = await requireApiSessionUser();
  if (error) return error;

  const setting = await getProfileEditingSetting();
  return NextResponse.json(buildFeaturePayload(user.role, setting), {
    headers: NO_STORE_HEADERS,
  });
}

export async function PATCH(req: Request) {
  const { user, error } = await requireApiStaffAccess();
  if (error) return error;

  if (user.role !== "admin") {
    return NextResponse.json(
      { message: "Only administrators can control experimental features." },
      { status: 403 }
    );
  }

  let body: { enabled?: unknown; roles?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  if (body?.enabled === undefined && body?.roles === undefined) {
    return NextResponse.json(
      { message: "Provide enabled or roles to update feature settings." },
      { status: 400 }
    );
  }

  const current = await getProfileEditingSetting();

  let nextEnabled = current.enabled;
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { message: "enabled must be a boolean." },
        { status: 400 }
      );
    }
    nextEnabled = body.enabled;
  }

  let nextRoles: AccountTier[] = current.roles;
  if (body.roles !== undefined) {
    if (!Array.isArray(body.roles)) {
      return NextResponse.json(
        { message: "roles must be an array of account tiers." },
        { status: 400 }
      );
    }
    for (const item of body.roles) {
      if (!isValidAccountTier(item)) {
        return NextResponse.json(
          { message: `Invalid role tier "${String(item)}".` },
          { status: 400 }
        );
      }
    }
    nextRoles = body.roles;
  }

  const updated = await updateProfileEditingSetting({
    enabled: nextEnabled,
    roles: nextRoles,
    updatedBy: user.id,
  });

  return NextResponse.json(buildFeaturePayload(user.role, updated), {
    headers: NO_STORE_HEADERS,
  });
}
