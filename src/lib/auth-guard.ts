import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getHostSurface,
  getSurfaceOrigin,
  getTargetSurfaceForRole,
  getWorkspaceHref,
} from "@/lib/domain";
import { createHandoffUrl } from "@/lib/handoff";
import {
  canAccessDashboardPage,
  DashboardGateKey,
  getFirstAllowedDashboardHref,
  resolveEffectiveAllowedPages,
} from "@/lib/permissions";

export interface AuthenticatedGuardUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  allowedPages: string[];
  certificateRole: string;
  membershipId: string | null;
}

export async function getFreshSessionUser(): Promise<AuthenticatedGuardUser | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) return null;
  return {
    ...user,
    allowedPages: resolveEffectiveAllowedPages(user.role, user.allowedPages),
  };
}

/**
 * Enforces API authorization, active status, and optional dashboard page permission.
 * Accepts either a single page key or an array of acceptable page keys (pass any).
 */
export async function requireApiStaffAccess(
  gate?: DashboardGateKey | DashboardGateKey[]
): Promise<
  | { user: AuthenticatedGuardUser; error?: undefined }
  | { user?: undefined; error: NextResponse }
> {
  const user = await getFreshSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!user.isActive) {
    return {
      error: NextResponse.json(
        { message: "Your account has been suspended by an administrator." },
        { status: 403 }
      ),
    };
  }

  if (user.role !== "admin" && user.role !== "organizer") {
    return {
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  if (gate) {
    const keys = Array.isArray(gate) ? gate : [gate];
    const allowed = keys.some((k) =>
      canAccessDashboardPage(user.role, user.allowedPages, k)
    );
    if (!allowed) {
      return {
        error: NextResponse.json(
          { message: "You do not have permission to access this module." },
          { status: 403 }
        ),
      };
    }
  }

  return { user };
}

/**
 * Enforces page-level authentication, account active state, domain routing
 * (`shim-hq` for admin, `shim-studio` for organizer, `shim-wallet` for attendee),
 * and per-organizer page permissions.
 */
export async function requireDashboardPageAccess(
  requiredPage?: DashboardGateKey
): Promise<AuthenticatedGuardUser> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const surface = getHostSurface(host);

  const user = await getFreshSessionUser();
  if (!user) {
    if (surface === "local") {
      redirect("/login");
    }
    redirect(`${getSurfaceOrigin("hq", host)}/login`);
  }

  if (!user.isActive) {
    const loginOrigin =
      surface === "local" ? "" : getSurfaceOrigin("hq", host);
    redirect(`${loginOrigin}/login?error=account_suspended`);
  }

  const targetSurface = getTargetSurfaceForRole(user.role);

  if (surface !== "local" && surface !== targetSurface) {
    const handoffUrl = await createHandoffUrl({
      userId: user.id,
      role: user.role,
      host,
    });
    redirect(handoffUrl);
  }

  if (user.role === "member") {
    if (surface === "local") {
      redirect("/portal");
    }
    const handoffUrl = await createHandoffUrl({
      userId: user.id,
      role: user.role,
      host,
    });
    redirect(handoffUrl);
  }

  if (
    requiredPage &&
    !canAccessDashboardPage(user.role, user.allowedPages, requiredPage)
  ) {
    const fallbackHref = getFirstAllowedDashboardHref(
      user.role,
      user.allowedPages
    );
    if (fallbackHref && fallbackHref !== getPathForPage(requiredPage)) {
      redirect(fallbackHref);
    }
    // Zero pages enabled or already on fallback -> return user so layout/page can render restricted state cleanly.
  }

  return user;
}

function getPathForPage(gate: DashboardGateKey): string {
  switch (gate) {
    case "overview":
      return "/dashboard";
    case "credentials":
      return "/dashboard/credentials";
    case "events":
      return "/dashboard/events";
    case "templates":
      return "/dashboard/templates";
    case "issue":
      return "/dashboard/generate";
    case "audit":
      return "/dashboard/audit";
    case "support":
      return "/dashboard/support";
    case "admin-only":
      return "/dashboard/users";
  }
}

/**
 * Redirects already-authenticated active users away from public and auth entry
 * pages (`/`, `/login`, `/register`) straight into their role's workspace.
 * Returns the resolved request `host` header so callers can forward `initialHost`.
 */
export async function redirectIfAuthenticated(): Promise<string> {
  const [headerList, session] = await Promise.all([
    headers(),
    getServerSession(authOptions),
  ]);
  const host = headerList.get("host") || "";
  const hasAuthError = Boolean(headerList.get("x-shim-auth-error"));
  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;

  if (!hasAuthError && sessionUserId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, role: true, isActive: true },
    });

    if (dbUser && dbUser.isActive) {
      const surface = getHostSurface(host);
      const workspaceHref = getWorkspaceHref(dbUser.role, host);

      if (workspaceHref.startsWith("/api/") && surface !== "local") {
        const handoffUrl = await createHandoffUrl({
          userId: dbUser.id,
          role: dbUser.role,
          host,
        });
        redirect(handoffUrl);
      }

      redirect(workspaceHref);
    }
  }

  return host;
}
