import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import HomeClient from "./HomeClient";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    if (isLocal) {
      redirect((session.user as any).role === "member" ? "/portal" : "/dashboard");
    } else {
      redirect((session.user as any).role === "member" ? "https://shim-wallet.vercel.app" : "https://shim-studio.vercel.app");
    }
  }

  return <HomeClient />;
}
