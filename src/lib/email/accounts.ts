import type {
  EmailAccount,
  EmailAccountId,
  EmailMailboxFolder,
  PlatformEmailAccountId,
} from "@/lib/email/types";
import type { EmailWorkspaceScope } from "@/lib/email-workspace";

import { resolveAccountCredentials } from "@/lib/email/credentials-service";
import { resolvePlatformMailboxEmailFromEnv } from "@/lib/email/platform-mailbox";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { isPlatformWorkspaceSlug } from "@/lib/workspace-brand";

export const ZOHO_IMAP_HOST = process.env.ZOHO_IMAP_HOST?.trim() || "imap.zoho.eu";
export const ZOHO_IMAP_PORT = Number(process.env.ZOHO_IMAP_PORT) || 993;
export const ZOHO_SMTP_HOST = process.env.ZOHO_SMTP_HOST?.trim() || "smtp.zoho.eu";
export const ZOHO_SMTP_PORT = Number(process.env.ZOHO_SMTP_PORT) || 465;
export const ZOHO_CALDAV_HOST =
  process.env.ZOHO_CALDAV_HOST?.trim() || "https://calendar.zoho.eu";

const ACCOUNT_DEFINITIONS: readonly EmailAccount[] = [
  {
    id: "info",
    email: "info@unit311central.com",
    name: "Shared Inbox",
  },
  {
    id: "paul",
    email: "paul@unit311central.com",
    name: "Paul",
  },
  {
    id: "admin",
    email: "admin@unit311central.com",
    name: "Admin",
  },
  {
    id: "demo",
    email: "demo@unit311central.com",
    name: "Demo",
  },
];

const ALL_ACCOUNT_IDS: readonly PlatformEmailAccountId[] = ["info", "paul", "admin", "demo"];

export type { PlatformEmailAccountId };

export function listEmailAccountIds(): readonly PlatformEmailAccountId[] {
  return ALL_ACCOUNT_IDS;
}

/** Talanton / OnwardAir Email show only the shared demo mailbox (not full platform inboxes). */
const DEMO_ONLY_EMAIL_ACCOUNT_IDS: readonly PlatformEmailAccountId[] = ["demo"];

function accountsForIds(ids: readonly PlatformEmailAccountId[]): EmailAccount[] {
  return ids
    .map((id) => ACCOUNT_DEFINITIONS.find((account) => account.id === id))
    .filter((account): account is EmailAccount => Boolean(account))
    .map((account) => ({
      ...account,
      email:
        resolveAccountEmailFromEnv(account.id as PlatformEmailAccountId) ?? account.email,
    }));
}

export function getPublicEmailAccounts(options?: {
  demo?: boolean;
  workspaceSlug?: string | null;
}): EmailAccount[] {
  // Platform Zoho mailboxes (info@ / paul@ / admin@ / demo@unit311central.com)
  // are Internal/Demo by default. Talanton + OnwardAir are allowed the demo mailbox only.
  void options?.demo;
  const slug = String(options?.workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (isPlatformWorkspaceSlug(slug)) {
    return accountsForIds(ALL_ACCOUNT_IDS);
  }
  if (isTalantonImpactSlug(slug) || isOnwardAirSlug(slug) || isAbhiSlug(slug)) {
    return accountsForIds(DEMO_ONLY_EMAIL_ACCOUNT_IDS);
  }
  return [];
}

export function getAccountDefinition(id: EmailAccountId): EmailAccount {
  const account = ACCOUNT_DEFINITIONS.find((entry) => entry.id === id);
  if (!account) {
    throw new Error(`Unknown mailbox: ${id}`);
  }
  return {
    ...account,
    email: resolveAccountEmailFromEnv(id as PlatformEmailAccountId) ?? account.email,
  };
}

function resolveAccountEmailFromEnv(id: PlatformEmailAccountId): string | null {
  const account = ACCOUNT_DEFINITIONS.find((entry) => entry.id === id);
  const defaultEmail = account?.email ?? "";

  const candidates: Array<string | undefined> =
    id === "info"
      ? [process.env.ZOHO_INFO_EMAIL, process.env.ZOHO_EMAIL]
      : id === "paul"
        ? [process.env.ZOHO_PAUL_EMAIL, process.env.ZOHO_EMAIL]
        : id === "admin"
          ? [process.env.ZOHO_ADMIN_EMAIL, process.env.ZOHO_EMAIL]
          : [process.env.ZOHO_DEMO_EMAIL, process.env.ZOHO_EMAIL];

  return resolvePlatformMailboxEmailFromEnv(id, defaultEmail, candidates);
}

export async function getAccountCredentials(
  id: EmailAccountId,
  scope?: EmailWorkspaceScope,
): Promise<{ email: string; password: string }> {
  const credentials = await resolveAccountCredentials(id, scope);
  if (!credentials) {
    const mailbox = getAccountDefinition(id).email;
    throw new Error(
      `Zoho mailbox ${mailbox} is not configured. Set ZOHO_${id.toUpperCase()}_PASSWORD on the server or save credentials in the Email settings panel.`,
    );
  }

  return credentials;
}

export async function isAccountConfigured(
  id: EmailAccountId,
  scope?: EmailWorkspaceScope,
): Promise<boolean> {
  try {
    await getAccountCredentials(id, scope);
    return true;
  } catch {
    return false;
  }
}

export async function isAnyMailboxConfigured(scope?: EmailWorkspaceScope): Promise<boolean> {
  const results = await Promise.all(
    ALL_ACCOUNT_IDS.map((id) => isAccountConfigured(id, scope)),
  );
  return results.some(Boolean);
}

export function parseAccountId(value: string | null): EmailAccountId | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (
    trimmed === "info" ||
    trimmed === "paul" ||
    trimmed === "admin" ||
    trimmed === "demo"
  ) {
    return trimmed;
  }
  if (/^[a-z][a-z0-9_-]{0,62}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function parseMailboxFolder(value: string | null): EmailMailboxFolder {
  return value === "sent" ? "sent" : "inbox";
}

export function getMailboxLabel(accountId: EmailAccountId) {
  return getAccountDefinition(accountId).email;
}
