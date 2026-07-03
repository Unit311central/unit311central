import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { EmailAccountId } from "@/lib/email/types";

import { getAccountDefinition } from "@/lib/email/accounts";

type DbCredential = {
  account_id: string;
  email: string;
  password: string;
  updated_at: string;
};

function readEnvCredential(id: EmailAccountId): { email: string; password: string } | null {
  const account = getAccountDefinition(id);
  const password =
    id === "info"
      ? process.env.ZOHO_INFO_PASSWORD?.trim() ||
        process.env.ZOHO_PASSWORD?.trim() ||
        process.env.ZOHO_APP_PASSWORD?.trim()
      : process.env.ZOHO_PAUL_PASSWORD?.trim() ||
        process.env.ZOHO_PASSWORD?.trim() ||
        process.env.ZOHO_APP_PASSWORD?.trim();

  if (!password) return null;
  return { email: account.email, password };
}

async function readSupabaseCredential(
  id: EmailAccountId,
): Promise<{ email: string; password: string } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_mailbox_credentials")
    .select("email, password")
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
): Promise<{ email: string; password: string } | null> {
  return readEnvCredential(id) ?? (await readSupabaseCredential(id));
}

export async function isAccountConfiguredAsync(id: EmailAccountId): Promise<boolean> {
  return Boolean(await resolveAccountCredentials(id));
}

export async function getMailboxCredentialStatus() {
  const [infoConfigured, paulConfigured] = await Promise.all([
    isAccountConfiguredAsync("info"),
    isAccountConfiguredAsync("paul"),
  ]);

  return {
    info: infoConfigured,
    paul: paulConfigured,
    storage: isSupabaseConfigured() ? ("supabase" as const) : ("environment" as const),
  };
}

export async function saveMailboxCredentials(
  id: EmailAccountId,
  password: string,
  email?: string,
) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Add credentials as Vercel environment variables instead.");
  }

  const trimmedPassword = password.trim();
  if (!trimmedPassword) {
    throw new Error("Password is required.");
  }

  const accountEmail = email?.trim() || getAccountDefinition(id).email;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_mailbox_credentials")
    .upsert(
      {
        account_id: id,
        email: accountEmail,
        password: trimmedPassword,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" },
    )
    .select("account_id, email, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data as Pick<DbCredential, "account_id" | "email" | "updated_at">;
}
