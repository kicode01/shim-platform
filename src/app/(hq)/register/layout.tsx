import { redirectIfAuthenticated } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();
  return <>{children}</>;
}
