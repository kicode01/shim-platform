/**
 * Shared constants and validation helpers for user-submitted support tickets.
 */

export const SUPPORT_ISSUE_TYPES = [
  "Event Concern",
  "Account/Profile Typo",
] as const;

export type SupportIssueType = (typeof SUPPORT_ISSUE_TYPES)[number];

export const SUPPORT_STATUSES = ["Pending", "Resolved"] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export function isValidSupportIssueType(value: string): value is SupportIssueType {
  return (SUPPORT_ISSUE_TYPES as readonly string[]).includes(value);
}

export function isValidSupportStatus(value: string): value is SupportStatus {
  return (SUPPORT_STATUSES as readonly string[]).includes(value);
}
