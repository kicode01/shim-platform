import { redirectIfAuthenticated } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();
  return <>{children}</>;
}
