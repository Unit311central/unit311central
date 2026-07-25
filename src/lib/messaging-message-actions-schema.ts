import { readFileSync } from "node:fs";
import { join } from "node:path";

import { queryScalarViaManagementApi } from "@/lib/internal-db-migrations";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

const MIGRATION = "supabase/migrations/117_messaging_message_actions.sql";

let ensurePromise: Promise<boolean> | null = null;
let schemaKnownReady = false;

export function isMissingMessageActionColumnError(message: string) {
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("deleted_at") ||
      normalized.includes("archived_at") ||
      normalized.includes("internal_message_saves")) &&
    (normalized.includes("could not find") ||
      normalized.includes("does not exist") ||
      normalized.includes("schema cache") ||
      normalized.includes("column") ||
      normalized.includes("relation"))
  );
}

async function readyViaRest(): Promise<boolean | null> {
  if (!isSupabaseServiceRoleConfigured()) return null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase
      .from("internal_messages")
      .select("deleted_at, archived_at")
      .limit(1);
    if (!error) return true;
    if (isMissingMessageActionColumnError(error.message)) return false;
    return null;
  } catch {
    return null;
  }
}

async function readyViaManagement(): Promise<boolean | null> {
  try {
    const row = await queryScalarViaManagementApi<{ ready: boolean }>(
      `select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'internal_messages'
          and column_name = 'deleted_at'
      ) as ready`,
    );
    if (row == null) return null;
    return row.ready === true;
  } catch {
    return null;
  }
}

async function applyViaManagement() {
  const sql = readFileSync(join(process.cwd(), MIGRATION), "utf8");
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    (process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname.split(".")[0] : null);
  if (token.length < 20 || !projectRef) return false;

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to apply ${MIGRATION} (${response.status}): ${body.slice(0, 240)}`);
  }
  await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "notify pgrst, 'reload schema'" }),
  }).catch(() => undefined);
  return true;
}

export async function ensureMessagingMessageActionsSchema(force = false) {
  try {
    if (!force && schemaKnownReady) return true;
    if (!force) {
      const viaRest = await readyViaRest();
      if (viaRest === true) {
        schemaKnownReady = true;
        return true;
      }
      if (viaRest !== false) {
        const viaMgmt = await readyViaManagement();
        if (viaMgmt === true) {
          schemaKnownReady = true;
          return true;
        }
      }
    }

    if (!ensurePromise) {
      ensurePromise = applyViaManagement()
        .then(async (applied) => {
          if (!applied) return false;
          await new Promise((resolve) => setTimeout(resolve, 400));
          const ready = (await readyViaRest()) === true || (await readyViaManagement()) === true;
          if (ready) schemaKnownReady = true;
          return ready;
        })
        .catch((error) => {
          console.warn(
            "[Messaging] message actions schema ensure failed",
            error instanceof Error ? error.message : error,
          );
          return false;
        })
        .finally(() => {
          ensurePromise = null;
        });
    }
    return ensurePromise;
  } catch {
    return false;
  }
}
