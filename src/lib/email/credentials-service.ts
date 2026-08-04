import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { EmailAccountId } from "@/lib/email/types";
import { resolveEmailWorkspaceId, type EmailWorkspaceScope } from "@/lib/email-workspace";

import { getAccountDefinition, listEmailAccountIds } from "@/lib/email/accounts";

type DbCredential = {
  account_id: string;
  email: string;
  password: string;
  updated_at: string;
};

type MemoryCredential = { email: string; password: string };

declare global {
  // Ambient `var` is required for globalThis augmentation.
  var __unit311EmailCredentials: Map<string, MemoryCredential> | undefined;
}

function memoryCredentialStore() {
  if (!globalThis.__unit311EmailCredentials) {
    globalThis.__unit311EmailCredentials = new Map();
  }
  return globalThis.__unit311EmailCredentials;
}

function memoryKey(workspaceId: string, id: EmailAccountId) {
  return `${workspaceId}:${id}`;
}

function readMemoryCredential(workspaceId: string, id: EmailAccountId): MemoryCredential | null {
  return memoryCredentialStore().get(memoryKey(workspaceId, id)) ?? null;
}

function passwordEnvCandidates(id: EmailAccountId): Array<string | undefined> {
  const shared = [
    process.env.ZOHO_DRONECATALYST_PASSWORD,
    process.env.ZOHO_PASSWORD,
    process.env.ZOHO_APP_PASSWORD,
  ];

  if (id === "info") {
    return [
      process.env.ZOHO_INFO_PASSWORD,
      process.env.ZOHO_DRONECATALYST_INFO_PASSWORD,
      ...shared,
    ];
  }
  if (id === "paul") {
    return [
      process.env.ZOHO_PAUL_PASSWORD,
      process.env.ZOHO_DRONECATALYST_PAUL_PASSWORD,
      ...shared,
    ];
  }
  if (id === "admin") {
    return [process.env.ZOHO_ADMIN_PASSWORD, ...shared];
  }
  return [process.env.ZOHO_DEMO_PASSWORD, ...shared];
}

/** Env credentials are shared platform secrets (not tenant DB rows). */
function readEnvCredential(id: EmailAccountId): MemoryCredential | null {
  const account = getAccountDefinition(id);
  for (const raw of passwordEnvCandidates(id)) {
    const password = raw?.trim();
    if (password) return { email: account.email, password };
  }
  return null;
}

async function readSupabaseCredential(
  id: EmailAccountId,
  workspaceId: string,
): Promise<MemoryCredential | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_mailbox_credentials")
    .select("email, password")
    .eq("workspace_id", workspaceId)
    .eq("account_id", id)
    .maybeSingle();

  if (error || !data?.password) return null;

  const row = data as Pick<DbCredential, "email" | "password">;
  return {
    email: row.email.trim() || getAccountDefinition(id).email,
    password: row.password.trim(),
  };
}

export async function resolveAccountCredentials(
  id: EmailAccountId,
  scope?: EmailWorkspaceScope,
): Promise<MemoryCredential | null> {
  // Platform env secrets win first (Internal/Demo + shared Zoho app passwords).
  // Tenant DB / memory credentials cover customer hosts that persist their own row.
  const envCredential = readEnvCredential(id);
  if (envCredential) return envCredential;

  let workspaceId: string | null = null;
  try {
    workspaceId = await resolveEmailWorkspaceId(scope);
  } catch {
    workspaceId = null;
  }
  if (!workspaceId) return null;

  return (
    readMemoryCredential(workspaceId, id) ?? (await readSupabaseCredential(id, workspaceId))
  );
}

/**
 * Persist platform env mailbox secrets into the current workspace DB row when
 * missing. Makes OnwardAir / Talanton Email (demo@) stay connected without a
 * one-off “Save & connect” prompt after deploys.
 */
export async function ensureWorkspaceMailboxCredentialsFromEnv(
  ids: readonly EmailAccountId[],
  scope?: EmailWorkspaceScope,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  let workspaceId: string;
  try {
    workspaceId = await resolveEmailWorkspaceId(scope);
  } catch {
    return;
  }

  for (const id of ids) {
    const envCredential = readEnvCredential(id);
    if (!envCredential?.password) continue;
    const existing = await readSupabaseCredential(id, workspaceId);
    if (existing?.password === envCredential.password) continue;
    try {
      await saveMailboxCredentials(id, envCredential.password, envCredential.email, {
        workspaceId,
      });
    } catch {
      // Non-fatal — env fallback still serves mail until an operator saves credentials.
    }
  }
}

export async function isAccountConfiguredAsync(
  id: EmailAccountId,
  scope?: EmailWorkspaceScope,
): Promise<boolean> {
  return Boolean(await resolveAccountCredentials(id, scope));
}

export async function getMailboxCredentialStatus(scope?: EmailWorkspaceScope) {
  const workspaceId = await resolveEmailWorkspaceId(scope);
  const ids = listEmailAccountIds();
  const configured = await Promise.all(
    ids.map(async (id) => [id, await isAccountConfiguredAsync(id, { workspaceId })] as const),
  );

  const storage = isSupabaseConfigured()
    ? ("supabase" as const)
    : memoryCredentialStore().size > 0
      ? ("memory" as const)
      : ("environment" as const);

  return {
    ...Object.fromEntries(configured),
    storage,
  } as Record<EmailAccountId, boolean> & { storage: "supabase" | "memory" | "environment" };
}

export async function saveMailboxCredentials(
  id: EmailAccountId,
  password: string,
  email?: string,
  scope?: EmailWorkspaceScope,
) {
  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    throw new Error("Password is required.");
  }

  const workspaceId = await resolveEmailWorkspaceId(scope);
  const accountEmail = email?.trim() || getAccountDefinition(id).email;

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("email_mailbox_credentials")
      .upsert(
        {
          workspace_id: workspaceId,
          account_id: id,
          email: accountEmail,
          password: trimmedPassword,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "workspace_id,account_id" },
      )
      .select("account_id, email, updated_at")
      .single();

    if (error) throw new Error(error.message);
    memoryCredentialStore().set(memoryKey(workspaceId, id), {
      email: accountEmail,
      password: trimmedPassword,
    });
    return data as Pick<DbCredential, "account_id" | "email" | "updated_at">;
  }

  memoryCredentialStore().set(memoryKey(workspaceId, id), {
    email: accountEmail,
    password: trimmedPassword,
  });
  return {
    account_id: id,
    email: accountEmail,
    updated_at: new Date().toISOString(),
  };
}
