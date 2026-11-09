import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your digital credentials.",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    if (host.includes("shim-wallet")) {
      redirect("/portal");
    } else if (host.includes("shim-studio")) {
      redirect("/dashboard");
    } else {
      redirect((session.user as any).role === "member" ? "/portal" : "/dashboard");
    }
  }

  return <LoginClient />;
}
