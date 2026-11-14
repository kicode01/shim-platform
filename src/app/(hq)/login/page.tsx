import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getWorkspacePath, isLocalHost } from "@/lib/domain";
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
      select: { id: true, role: true },
    });

    if (user) {
      const headersList = await headers();
      const host = headersList.get("host") || "";
      if (host.includes("shim-wallet")) {
        redirect("/portal");
      } else if (host.includes("shim-studio")) {
        redirect("/dashboard");
      } else if (isLocalHost(host)) {
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
