import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  getHostSurface,
  getTargetSurfaceForRole,
  getWorkspacePath,
} from "@/lib/domain";
import { createHandoffUrl } from "@/lib/handoff";
import LoginClient from "./LoginClient";
import HandoffRedirect from "./HandoffRedirect";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your digital credentials.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      const headersList = await headers();
      const host = headersList.get("host") || "";
      const surface = getHostSurface(host);
      const targetSurface = getTargetSurfaceForRole(user.role);

      if (surface === "local" || surface === targetSurface) {
        redirect(getWorkspacePath(user.role));
      } else {
        const handoffUrl = await createHandoffUrl({
          userId: user.id,
          role: user.role,
          host,
        });
        return <HandoffRedirect url={handoffUrl} role={user.role} />;
      }
    }
  }

  return <LoginClient />;
}
