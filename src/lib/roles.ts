export const CERTIFICATE_ROLES = [
  "Organizer",
  "Speaker",
  "Participant",
  "Others",
] as const;

export type CertificateRole = (typeof CERTIFICATE_ROLES)[number];

export function isValidCertificateRole(value: unknown): value is CertificateRole {
  return (
    typeof value === "string" &&
    (CERTIFICATE_ROLES as readonly string[]).includes(value)
  );
}

export function normalizeCertificateRole(value: unknown): CertificateRole {
  if (typeof value !== "string") return "Participant";
  const match = CERTIFICATE_ROLES.find(
    (r) => r.toLowerCase() === value.trim().toLowerCase()
  );
  return match ?? "Participant";
}
