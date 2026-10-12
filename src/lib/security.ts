/**
 * Cryptographic security and PII protection utilities for Digital Certificates.
 *
 * Provides:
 * 1. Deterministic SHA-256 Certificate Fingerprinting (tamper-detection seal).
 * 2. Privacy-compliant PII Masking (e.g. attendee email obfuscation on public verification).
 */

export interface CertificateFingerprintInput {
  id: string;
  recipientName: string;
  role?: string | null;
  eventName?: string | null;
  issueDate: string | Date;
  issuerId?: string | null;
}

/**
 * Standard pure-JS SHA-256 digest function.
 * Works isomorphically in Node.js, browsers, web workers, and Edge runtimes
 * without external dependencies or polyfills.
 */
export function sha256(ascii: string): string {
  // If running in Node.js runtime, use native crypto if available for optimal C++ throughput
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodeCrypto = require("crypto");
      if (nodeCrypto && typeof nodeCrypto.createHash === "function") {
        return nodeCrypto.createHash("sha256").update(ascii, "utf8").digest("hex");
      }
    } catch {
      // Fall through to pure JS implementation
    }
  }

  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i: number, j: number;
  let result = "";
  const words: number[] = [];

  // Initial hash values (first 32 bits of fractional parts of square roots of primes 2..19)
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // Round constants (first 32 bits of fractional parts of cube roots of primes 2..311)
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  // Convert input string to UTF-8 byte stream
  const bytes = unescape(encodeURIComponent(ascii));
  const byteLength = bytes.length;
  for (i = 0; i < byteLength; i++) {
    words[i >> 2] |= (bytes.charCodeAt(i) & 0xff) << (8 * (3 - (i % 4)));
  }

  // Padding: append 1 bit (0x80) followed by zeroes and 64-bit length
  words[byteLength >> 2] |= 0x80 << (8 * (3 - (byteLength % 4)));
  words[(((byteLength + 8) >> 6) << 4) + 15] = byteLength * 8;

  const w = new Array(64);

  for (i = 0; i < words.length; i += 16) {
    let [ha, hb, hc, hd, he, hf, hg, hh] = hash;

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(he, 6) ^ rightRotate(he, 11) ^ rightRotate(he, 25);
      const ch = (he & hf) ^ (~he & hg);
      const temp1 = (hh + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(ha, 2) ^ rightRotate(ha, 13) ^ rightRotate(ha, 22);
      const maj = (ha & hb) ^ (ha & hc) ^ (hb & hc);
      const temp2 = (s0 + maj) | 0;

      hh = hg;
      hg = hf;
      hf = he;
      he = (hd + temp1) | 0;
      hd = hc;
      hc = hb;
      hb = ha;
      ha = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + ha) | 0;
    hash[1] = (hash[1] + hb) | 0;
    hash[2] = (hash[2] + hc) | 0;
    hash[3] = (hash[3] + hd) | 0;
    hash[4] = (hash[4] + he) | 0;
    hash[5] = (hash[5] + hf) | 0;
    hash[6] = (hash[6] + hg) | 0;
    hash[7] = (hash[7] + hh) | 0;
  }

  for (i = 0; i < 8; i++) {
    result += ("00000000" + (hash[i] >>> 0).toString(16)).slice(-8);
  }
  return result;
}

/**
 * Normalizes an issue date into a canonical ISO representation.
 */
function normalizeDate(d: string | Date): string {
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d).trim() : dt.toISOString();
  } catch {
    return String(d).trim();
  }
}

/**
 * Computes a deterministic SHA-256 cryptographic seal of a certificate's canonical properties.
 * If any text or date on the certificate is altered, the resulting hash will immediately diverge.
 */
export function computeCertificateFingerprint(data: CertificateFingerprintInput): string {
  const canonical = [
    `id:${(data.id || "").trim()}`,
    `recipient:${(data.recipientName || "").trim().toLowerCase()}`,
    `role:${(data.role || "").trim().toLowerCase()}`,
    `event:${(data.eventName || "").trim().toLowerCase()}`,
    `date:${normalizeDate(data.issueDate)}`,
    `issuer:${(data.issuerId || "").trim()}`,
  ].join("|");

  return sha256(canonical);
}

/**
 * Verifies that a certificate's properties match an expected SHA-256 fingerprint.
 */
export function verifyCertificateFingerprint(
  data: CertificateFingerprintInput,
  expectedFingerprint: string
): boolean {
  if (!expectedFingerprint || typeof expectedFingerprint !== "string") return false;
  const computed = computeCertificateFingerprint(data);
  return computed.toLowerCase() === expectedFingerprint.trim().toLowerCase();
}

/**
 * Formats a 64-character SHA-256 hash into human-readable segmented blocks.
 * Example: "9F83-C605-D4C8-2B3E...71FE-F4"
 */
export function formatFingerprint(
  hash: string,
  options: { short?: boolean; uppercase?: boolean } = {}
): string {
  if (!hash || typeof hash !== "string") return "";
  const cleaned = hash.replace(/[^a-fA-F0-9]/g, "");
  const formatted = options.uppercase !== false ? cleaned.toUpperCase() : cleaned.toLowerCase();

  if (options.short) {
    if (formatted.length <= 16) return formatted;
    return `${formatted.slice(0, 8)}...${formatted.slice(-8)}`;
  }

  // Group into 4-character chunks separated by dashes
  const chunks = formatted.match(/.{1,4}/g);
  return chunks ? chunks.join("-") : formatted;
}

/**
 * Masks Personally Identifiable Information (PII) in an email address for public display.
 * Retains the first character, last character, and domain for recipient self-recognition,
 * while preventing web scrapers and unauthorized viewers from harvesting attendee email addresses.
 *
 * Examples:
 * - "john.doe@gmail.com" => "j***e@gmail.com"
 * - "alex@pup.edu.ph"    => "a***x@pup.edu.ph"
 * - "sam@domain.com"     => "s*m@domain.com"
 * - "ab@domain.com"      => "a*@domain.com"
 * - "a@domain.com"       => "*@domain.com"
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return null;

  const localPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex);

  let maskedLocal = "";
  if (localPart.length === 1) {
    maskedLocal = "*";
  } else if (localPart.length === 2) {
    maskedLocal = `${localPart[0]}*`;
  } else if (localPart.length === 3) {
    maskedLocal = `${localPart[0]}*${localPart[2]}`;
  } else {
    maskedLocal = `${localPart[0]}***${localPart[localPart.length - 1]}`;
  }

  return `${maskedLocal}${domainPart}`;
}
