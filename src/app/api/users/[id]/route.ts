import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiStaffAccess } from "@/lib/auth-guard";
import { CERTIFICATE_ROLES, isValidCertificateRole } from "@/lib/roles";
import {
  ACCOUNT_TIERS,
  isValidAccountTier,
  resolveEffectiveAllowedPages,
  sanitizeAllowedPages,
} from "@/lib/permissions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireApiStaffAccess();
  if (error) return error;

  if (user.role !== "admin") {
    return NextResponse.json(
      { message: "Only administrators can manage user accounts." },
      { status: 403 }
    );
  }

  const { id } = await props.params;

  try {
    const body = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        allowedPages: true,
        certificateRole: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const updateData: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      certificateRole?: string;
      allowedPages?: string[];
    } = {};

    if (body?.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { message: "Name cannot be empty." },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body?.email !== undefined) {
      if (typeof body.email !== "string" || !EMAIL_PATTERN.test(body.email.trim())) {
        return NextResponse.json(
          { message: "Please enter a valid email address." },
          { status: 400 }
        );
      }
      const nextEmail = body.email.trim().toLowerCase();
      if (nextEmail !== (existingUser.email || "").trim().toLowerCase()) {
        const conflict = await prisma.user.findFirst({
          where: {
            id: { not: id },
            email: { equals: nextEmail, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (conflict) {
          return NextResponse.json(
            { message: "Another account already uses that email address." },
            { status: 409 }
          );
        }
      }
      updateData.email = nextEmail;
    }

    if (body?.role !== undefined) {
      if (!isValidAccountTier(body.role)) {
        return NextResponse.json(
          { message: `Invalid role. Allowed values: ${ACCOUNT_TIERS.join(", ")}` },
          { status: 400 }
        );
      }
      if (id === user.id && body.role !== "admin") {
        return NextResponse.json(
          { message: "You cannot demote your own administrator account." },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    if (body?.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { message: "isActive must be a boolean." },
          { status: 400 }
        );
      }
      if (id === user.id && body.isActive === false) {
        return NextResponse.json(
          { message: "You cannot suspend your own administrator account." },
          { status: 400 }
        );
      }
      updateData.isActive = body.isActive;
    }

    if (body?.certificateRole !== undefined) {
      if (
        typeof body.certificateRole !== "string" ||
        !isValidCertificateRole(body.certificateRole.trim())
      ) {
        return NextResponse.json(
          {
            message: `Invalid certificate role. Allowed values: ${CERTIFICATE_ROLES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.certificateRole = body.certificateRole.trim();
    }

    if (body?.allowedPages !== undefined) {
      if (!Array.isArray(body.allowedPages)) {
        return NextResponse.json(
          { message: "allowedPages must be an array of page keys." },
          { status: 400 }
        );
      }
      updateData.allowedPages = sanitizeAllowedPages(body.allowedPages);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No user updates were provided." },
        { status: 400 }
      );
    }

    const oldEmail = existingUser.email?.trim() || "";
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        allowedPages: true,
        certificateRole: true,
        membershipId: true,
      },
    });

    const syncProfileToRecords = Boolean(body?.syncProfileToRecords);
    const attendanceSync: { role?: string; name?: string; email?: string } = {};

    if (updateData.certificateRole) {
      attendanceSync.role = updateData.certificateRole;
    }
    if (syncProfileToRecords && updateData.name) {
      attendanceSync.name = updateData.name;
    }
    if (syncProfileToRecords && updateData.email) {
      attendanceSync.email = updateData.email;
    }

    const lookupEmail = oldEmail || updatedUser.email || "";
    if (Object.keys(attendanceSync).length > 0 && lookupEmail) {
      await prisma.attendance.updateMany({
        where: {
          email: { equals: lookupEmail, mode: "insensitive" },
        },
        data: attendanceSync,
      });
    }

    return NextResponse.json({
      user: {
        ...updatedUser,
        allowedPages: resolveEffectiveAllowedPages(
          updatedUser.role,
          updatedUser.allowedPages
        ),
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 }
    );
  }
}
