import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getWorkspaceHref } from "@/lib/domain";
import LoginClient, { type ActiveAccountSummary } from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your digital credentials.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  let activeAccount: ActiveAccountSummary | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (user && user.isActive && user.email) {
      const headersList = await headers();
      const host = headersList.get("host") || "";
      const continueHref = getWorkspaceHref(user.role, host);
      const workspaceLabel =
        user.role === "admin"
          ? "Admin Console"
          : user.role === "member"
            ? "Attendee Wallet"
            : "Organizer Studio";

      activeAccount = {
        email: user.email,
        name: user.name,
        role: user.role,
        continueHref,
        workspaceLabel,
      };
    }
  }

  return <LoginClient activeAccount={activeAccount} />;
}
