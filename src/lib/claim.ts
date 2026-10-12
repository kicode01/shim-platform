import { prisma } from "@/lib/prisma";

/**
 * Ensure the given user has a wallet, then attach any certificates that were
 * issued to their email but are not yet linked. Returns how many were linked.
 *
 * This is the single source of truth for "a certificate belongs to this
 * account", used by both automated (kiosk) and manual (organizer-issued)
 * issuance paths so behaviour never drifts.
 */
export async function linkCertificatesToUser(
  userId: string,
  email: string | null | undefined,
  opts: { method: string; extraCertificateIds?: string[] } = { method: "wallet_link" }
): Promise<number> {
  const normalized = (email || "").trim().toLowerCase();
  const extraIds = opts.extraCertificateIds?.filter(Boolean) ?? [];

  if (!normalized && extraIds.length === 0) return 0;

  // One round-trip instead of two: find the wallet, and in the same batch ask
  // whether there is anything unclaimed for this email. `walletId: null` makes
  // this a cheap check on a normally-empty set, and lets us return early
  // without paying for the upsert + updateMany + createMany chain on the
  // (overwhelmingly common) visit where nothing needs linking.
  const [wallet, candidates] = await Promise.all([
    prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: { id: true },
    }),
    prisma.certificate.findMany({
      where: {
        walletId: null,
        OR: [
          ...(normalized ? [{ recipientEmail: { equals: normalized, mode: "insensitive" as const } }] : []),
          ...(extraIds.length ? [{ id: { in: extraIds } }] : []),
        ],
      },
      select: { id: true },
    }),
  ]);

  if (candidates.length === 0) return 0;

  const ids = candidates.map((c) => c.id);
  const now = new Date();

  // These two writes are independent of each other, so batch them.
  await Promise.all([
    prisma.certificate.updateMany({
      where: { id: { in: ids } },
      data: { walletId: wallet.id, isClaimed: true, claimedAt: now },
    }),
    prisma.auditLog.createMany({
      data: ids.map((id) => ({
        action: "CLAIMED",
        certificateId: id,
        ipAddress: opts.method,
        details: JSON.stringify({ method: opts.method, email: normalized || null }),
      })),
    }),
  ]);

  return candidates.length;
}

/**
 * Look up whether a Shim account exists for an email and, if so, link any
 * certificates issued to that email into the account's wallet.
 * Returns { accountExists, linked }.
 */
export async function linkCertificatesByEmail(
  email: string | null | undefined,
  opts: { method: string; extraCertificateIds?: string[] } = { method: "wallet_link" }
) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return { accountExists: false, linked: 0 };

  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true },
  });

  if (!user) return { accountExists: false, linked: 0 };

  const linked = await linkCertificatesToUser(user.id, normalized, opts);
  return { accountExists: true, linked };
}
