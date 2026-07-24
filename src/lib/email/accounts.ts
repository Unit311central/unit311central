import type { EmailAccount, EmailAccountId, EmailMailboxFolder } from "@/lib/email/types";
import type { EmailWorkspaceScope } from "@/lib/email-workspace";

import { resolveAccountCredentials } from "@/lib/email/credentials-service";

export const ZOHO_IMAP_HOST = process.env.ZOHO_IMAP_HOST?.trim() || "imap.zoho.eu";
export const ZOHO_IMAP_PORT = Number(process.env.ZOHO_IMAP_PORT ?? 993);
export const ZOHO_SMTP_HOST = process.env.ZOHO_SMTP_HOST?.trim() || "smtp.zoho.eu";
export const ZOHO_SMTP_PORT = Number(process.env.ZOHO_SMTP_PORT ?? 465);
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

const ALL_ACCOUNT_IDS: readonly EmailAccountId[] = ["info", "paul", "admin", "demo"];

export function listEmailAccountIds(): readonly EmailAccountId[] {
  return ALL_ACCOUNT_IDS;
}

export function getPublicEmailAccounts(): EmailAccount[] {
  return ACCOUNT_DEFINITIONS.map((account) => ({
    ...account,
    email: resolveAccountEmailFromEnv(account.id) ?? account.email,
  }));
}

export function getAccountDefinition(id: EmailAccountId): EmailAccount {
  const account = ACCOUNT_DEFINITIONS.find((entry) => entry.id === id);
  if (!account) throw new Error(`Unknown mailbox: ${id}`);
  return {
    ...account,
    email: resolveAccountEmailFromEnv(id) ?? account.email,
  };
}

function isPlainEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function resolveAccountEmailFromEnv(id: EmailAccountId): string | null {
  const candidates: Array<string | undefined> =
    id === "info"
      ? [process.env.ZOHO_INFO_EMAIL, process.env.ZOHO_EMAIL]
      : id === "paul"
        ? [process.env.ZOHO_PAUL_EMAIL, process.env.ZOHO_EMAIL]
        : id === "admin"
          ? [process.env.ZOHO_ADMIN_EMAIL, process.env.ZOHO_EMAIL]
          : [process.env.ZOHO_DEMO_EMAIL, process.env.ZOHO_EMAIL];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (value && isPlainEmail(value)) return value;
  }

  return null;
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
  if (value === "info" || value === "paul" || value === "admin" || value === "demo") {
    return value;
  }
  return null;
}

export function parseMailboxFolder(value: string | null): EmailMailboxFolder {
  return value === "sent" ? "sent" : "inbox";
}

export function getMailboxLabel(accountId: EmailAccountId) {
  return getAccountDefinition(accountId).email;
}
