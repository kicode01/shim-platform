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
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
      if (isLocal) {
        redirect((session.user as any).role === "member" ? "/portal" : "/dashboard");
      } else {
        redirect((session.user as any).role === "member" ? "https://shim-wallet.vercel.app" : "https://shim-studio.vercel.app");
      }
    }
  }

  return <LoginClient />;
}
