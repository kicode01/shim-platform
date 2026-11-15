import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiSessionUser } from "@/lib/auth-guard";
import {
  canUserEditOwnProfile,
  getProfileEditingSetting,
  ProfileEditingFeature,
} from "@/lib/features";
import {
  isDemoAccountEmail,
  isValidProfileIcon,
  normalizeStoredAvatarIcon,
} from "@/lib/profile";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const RESTRICTED_PROFILE_FIELDS = [
  "email",
  "role",
  "isActive",
  "allowedPages",
  "certificateRole",
  "membershipId",
] as const;

function buildProfileResponse(
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    membershipId: string | null;
    avatarIcon: string | null;
  },
  setting: ProfileEditingFeature
) {
  const canEditProfile = canUserEditOwnProfile(user.role, setting);
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      membershipId: user.membershipId,
      avatarIcon: canEditProfile
        ? normalizeStoredAvatarIcon(user.avatarIcon)
        : null,
      isDemo: isDemoAccountEmail(user.email),
    },
    canEditProfile,
    feature: setting,
  };
}

export async function GET() {
  const { user, error } = await requireApiSessionUser();
  if (error) return error;

  const setting = await getProfileEditingSetting();
  return NextResponse.json(buildProfileResponse(user, setting), {
    headers: NO_STORE_HEADERS,
  });
}

export async function PATCH(req: Request) {
  const { user, error } = await requireApiSessionUser();
  if (error) return error;

  const setting = await getProfileEditingSetting();
  if (!canUserEditOwnProfile(user.role, setting)) {
    return NextResponse.json(
      {
        message:
          "Self-service profile editing is currently disabled by an administrator.",
      },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { message: "Invalid profile payload." },
      { status: 400 }
    );
  }

  for (const field of RESTRICTED_PROFILE_FIELDS) {
    if (body[field] !== undefined) {
      return NextResponse.json(
        {
          message: `Field "${field}" cannot be changed from self-service profile settings.`,
        },
        { status: 403 }
      );
    }
  }

  const updateData: {
    name?: string;
    avatarIcon?: string | null;
    image?: string;
  } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { message: "Display name cannot be empty." },
        { status: 400 }
      );
    }
    const cleanName = body.name.trim();
    if (cleanName.length > 80) {
      return NextResponse.json(
        { message: "Display name must be 80 characters or fewer." },
        { status: 400 }
      );
    }
    updateData.name = cleanName;
  }

  if (body.avatarIcon !== undefined) {
    if (body.avatarIcon !== null && !isValidProfileIcon(body.avatarIcon)) {
      return NextResponse.json(
        { message: "Invalid profile icon selection." },
        { status: 400 }
      );
    }
    updateData.avatarIcon = normalizeStoredAvatarIcon(body.avatarIcon);
  }

  if (body.newPassword !== undefined && body.newPassword !== "") {
    if (isDemoAccountEmail(user.email)) {
      return NextResponse.json(
        { message: "Passwords for shared demo accounts cannot be changed." },
        { status: 403 }
      );
    }
    if (typeof body.newPassword !== "string") {
      return NextResponse.json(
        { message: "Invalid new password format." },
        { status: 400 }
      );
    }
    if (body.newPassword.length < 6 || body.newPassword.length > 128) {
      return NextResponse.json(
        { message: "New password must be between 6 and 128 characters." },
        { status: 400 }
      );
    }
    if (
      body.confirmPassword !== undefined &&
      body.confirmPassword !== body.newPassword
    ) {
      return NextResponse.json(
        { message: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    const dbCredentials = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    if (dbCredentials?.image) {
      if (
        typeof body.currentPassword !== "string" ||
        body.currentPassword !== dbCredentials.image
      ) {
        return NextResponse.json(
          { message: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    updateData.image = body.newPassword;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { message: "No profile changes were provided." },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      membershipId: true,
      avatarIcon: true,
    },
  });

  return NextResponse.json(buildProfileResponse(updatedUser, setting), {
    headers: NO_STORE_HEADERS,
  });
}
