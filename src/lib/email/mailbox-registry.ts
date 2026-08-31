import "server-only";

import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { resolveEmailWorkspaceId, type EmailWorkspaceScope } from "@/lib/email-workspace";

import {
  getPublicEmailAccounts,
  getAccountDefinition,
  listEmailAccountIds,
  ZOHO_IMAP_HOST,
  ZOHO_SMTP_HOST,
  type PlatformEmailAccountId,
} from "@/lib/email/accounts";
import { resolveAccountCredentials } from "@/lib/email/credentials-service";
import { isPlatformManagedMailboxEmail } from "@/lib/email/platform-mailbox";
import type {
  EmailAccount,
  EmailAccountId,
  EmailManagedAddress,
  EmailManagedAddressKind,
} from "@/lib/email/types";
import { isPlatformWorkspaceSlug } from "@/lib/workspace-brand";
import { findWorkspaceById } from "@/lib/workspace-host";

export type EmailMailboxProfile = {
  id: EmailAccountId;
  email: string;
  name: string;
  provider: "zoho";
  configured: boolean;
  imapHost: string;
  smtpHost: string;
  addresses: EmailManagedAddress[];
};

type DbProfileRow = {
  account_id: string;
  display_name: string;
  provider: string;
  imap_host: string | null;
  smtp_host: string | null;
};

type DbAddressRow = {
  account_id: string;
  address: string;
  kind: EmailManagedAddressKind;
};

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

async function readWorkspaceProfiles(workspaceId: string): Promise<DbProfileRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_mailbox_profiles")
    .select("account_id, display_name, provider, imap_host, smtp_host")
    .eq("workspace_id", workspaceId);
  if (error || !data) return [];
  return data as DbProfileRow[];
}

async function readWorkspaceAddresses(workspaceId: string): Promise<DbAddressRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_mailbox_addresses")
    .select("account_id, address, kind")
    .eq("workspace_id", workspaceId)
    .order("kind", { ascending: true })
    .order("address", { ascending: true });
  if (error || !data) return [];
  return data as DbAddressRow[];
}

function addressesForAccount(
  accountId: string,
  authEmail: string,
  rows: DbAddressRow[],
): EmailManagedAddress[] {
  const accountRows = rows.filter((row) => row.account_id === accountId);
  if (accountRows.length > 0) {
    return accountRows.map((row) => ({
      address: normalizeAddress(row.address),
      kind: row.kind,
    }));
  }
  return [{ address: normalizeAddress(authEmail), kind: "primary" }];
}

async function buildProfile(
  account: EmailAccount,
  workspaceId: string,
  profileRow: DbProfileRow | null,
  addressRows: DbAddressRow[],
): Promise<EmailMailboxProfile> {
  const credentials = await resolveAccountCredentials(account.id, { workspaceId });
  const authEmail = normalizeAddress(credentials?.email ?? account.email);
  const configured = Boolean(credentials?.password);
  return {
    id: account.id,
    email: authEmail,
    name: profileRow?.display_name?.trim() || account.name,
    provider: "zoho",
    configured,
    imapHost: profileRow?.imap_host?.trim() || ZOHO_IMAP_HOST,
    smtpHost: profileRow?.smtp_host?.trim() || ZOHO_SMTP_HOST,
    addresses: addressesForAccount(account.id, authEmail, addressRows),
  };
}

export async function listWorkspaceMailboxProfiles(
  scope?: EmailWorkspaceScope & { workspaceSlug?: string | null },
): Promise<EmailMailboxProfile[]> {
  const workspaceId = await resolveEmailWorkspaceId(scope);
  const workspace =
    scope?.workspaceSlug != null
      ? null
      : await findWorkspaceById(workspaceId).catch(() => null);
  const slug = String(scope?.workspaceSlug ?? workspace?.slug ?? "")
    .trim()
    .toLowerCase();

  const staticAccounts = getPublicEmailAccounts({ workspaceSlug: slug });
  const profileRows = await readWorkspaceProfiles(workspaceId);
  const addressRows = await readWorkspaceAddresses(workspaceId);

  const profileAccountIds = new Set(profileRows.map((row) => row.account_id));
  const workspaceOnlyAccounts: EmailAccount[] = profileRows
    .filter((row) => !staticAccounts.some((account) => account.id === row.account_id))
    .map((row) => {
      const primary =
        addressRows.find(
          (address) => address.account_id === row.account_id && address.kind === "primary",
        )?.address ??
        row.display_name ??
        row.account_id;
      return {
        id: row.account_id,
        email: normalizeAddress(primary),
        name: row.display_name,
      };
    });

  const accounts = [...staticAccounts, ...workspaceOnlyAccounts];
  const uniqueAccounts = accounts.filter(
    (account, index, list) => list.findIndex((entry) => entry.id === account.id) === index,
  );

  return Promise.all(
    uniqueAccounts.map((account) =>
      buildProfile(
        account,
        workspaceId,
        profileRows.find((row) => row.account_id === account.id) ?? null,
        addressRows,
      ),
    ),
  );
}

export async function resolveWorkspaceMailboxProfile(
  accountId: EmailAccountId,
  scope?: EmailWorkspaceScope & { workspaceSlug?: string | null },
): Promise<EmailMailboxProfile | null> {
  const profiles = await listWorkspaceMailboxProfiles(scope);
  return profiles.find((profile) => profile.id === accountId) ?? null;
}

export async function assertWorkspaceMailboxProfile(
  accountId: EmailAccountId,
  scope?: EmailWorkspaceScope & { workspaceSlug?: string | null },
): Promise<EmailMailboxProfile> {
  const profile = await resolveWorkspaceMailboxProfile(accountId, scope);
  if (!profile) {
    throw new Error(`Unknown mailbox: ${accountId}`);
  }
  return profile;
}

export async function isWorkspaceMailboxAvailable(
  accountId: EmailAccountId,
  scope?: EmailWorkspaceScope & { workspaceSlug?: string | null },
): Promise<boolean> {
  return Boolean(await resolveWorkspaceMailboxProfile(accountId, scope));
}

export function isPlatformEmailAccountId(value: string): value is PlatformEmailAccountId {
  return (listEmailAccountIds() as readonly string[]).includes(value);
}

export async function resolveMailboxAuthEmail(
  accountId: EmailAccountId,
  scope?: EmailWorkspaceScope,
): Promise<string> {
  const credentials = await resolveAccountCredentials(accountId, scope);
  if (credentials?.email) return normalizeAddress(credentials.email);
  try {
    return normalizeAddress(getAccountDefinition(accountId).email);
  } catch {
    const profile = await resolveWorkspaceMailboxProfile(accountId, scope);
    if (!profile) throw new Error(`Unknown mailbox: ${accountId}`);
    return profile.email;
  }
}

export function isCustomerWorkspaceMailbox(profile: EmailMailboxProfile): boolean {
  return !isPlatformManagedMailboxEmail(profile.email);
}

export async function listKnownMailboxAccountIds(
  scope?: EmailWorkspaceScope & { workspaceSlug?: string | null },
): Promise<EmailAccountId[]> {
  const profiles = await listWorkspaceMailboxProfiles(scope);
  return profiles.map((profile) => profile.id);
}

export async function isMailboxAllowedOnWorkspace(
  accountId: EmailAccountId,
  scope?: EmailWorkspaceScope & { workspaceSlug?: string | null },
): Promise<boolean> {
  if (isPlatformEmailAccountId(accountId)) {
    const workspaceId = await resolveEmailWorkspaceId(scope);
    const workspace = await findWorkspaceById(workspaceId).catch(() => null);
    const slug = String(scope?.workspaceSlug ?? workspace?.slug ?? "").toLowerCase();
    if (!isPlatformWorkspaceSlug(slug)) {
      const profiles = await listWorkspaceMailboxProfiles({ ...scope, workspaceSlug: slug });
      return profiles.some((profile) => profile.id === accountId);
    }
  }
  return Boolean(await resolveWorkspaceMailboxProfile(accountId, scope));
}
