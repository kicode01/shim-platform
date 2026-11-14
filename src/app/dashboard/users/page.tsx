import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage member designations and certificate roles.",
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    redirect(isLocal ? "/login" : "https://shim-hq.vercel.app/login");
  }

  if ((session.user as any).role === "member") {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    redirect(isLocal ? "/portal" : "https://shim-wallet.vercel.app");
  }

  const [users, certEmails] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        certificateRole: true,
        membershipId: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    }),
    prisma.certificate.findMany({
      where: { deletedAt: null, recipientEmail: { not: null } },
      select: { recipientEmail: true },
    }),
  ]);

  const certCountByEmail = new Map<string, number>();
  for (const c of certEmails) {
    const key = c.recipientEmail?.trim().toLowerCase();
    if (key) {
      certCountByEmail.set(key, (certCountByEmail.get(key) ?? 0) + 1);
    }
  }

  const initialUsers = users.map((u) => ({
    ...u,
    certificateCount: u.email
      ? certCountByEmail.get(u.email.trim().toLowerCase()) ?? 0
      : 0,
  }));

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">
            User Management
          </h1>
          <p className="text-sm text-zinc-500">
            Assign certificate designations for registered members across events
          </p>
        </div>
      </div>

      <UsersClient initialUsers={initialUsers} />
    </div>
  );
}
