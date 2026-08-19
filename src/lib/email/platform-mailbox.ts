import type { EmailAccountId } from "@/lib/email/types";

const PLATFORM_MAILBOX_DOMAIN = "@unit311central.com";

export const PLATFORM_EMAIL_ACCOUNT_IDS: readonly EmailAccountId[] = [
  "info",
  "paul",
  "admin",
  "demo",
];

export function isPlatformManagedMailboxEmail(email: string | null | undefined): boolean {
  return String(email ?? "")
    .trim()
    .toLowerCase()
    .endsWith(PLATFORM_MAILBOX_DOMAIN);
}

/** Ignore stray tenant env overrides (e.g. barcelonadronecenter.com) on Unit311 inboxes. */
export function resolvePlatformMailboxEmailFromEnv(
  id: EmailAccountId,
  defaultEmail: string,
  candidates: Array<string | undefined>,
): string | null {
  const isPlatformInbox = defaultEmail.toLowerCase().endsWith(PLATFORM_MAILBOX_DOMAIN);
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) continue;
    if (isPlatformInbox && !value.toLowerCase().endsWith(PLATFORM_MAILBOX_DOMAIN)) {
      continue;
    }
    return value;
  }
  return null;
}
