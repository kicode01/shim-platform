import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import HomeClient from "./HomeClient";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect((session.user as any).role === "member" ? "/portal" : "/dashboard");
  }

  return <HomeClient />;
}
