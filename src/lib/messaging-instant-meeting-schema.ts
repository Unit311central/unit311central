import { readFileSync } from "node:fs";
import { join } from "node:path";

import { queryScalarViaManagementApi } from "@/lib/internal-db-migrations";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

const INSTANT_MEETING_MIGRATION = "supabase/migrations/113_messaging_instant_meetings.sql";

let ensurePromise: Promise<boolean> | null = null;
let schemaKnownReady = false;

export function isMissingInstantMeetingColumnError(message: string) {
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("allow_guest_join") || normalized.includes("guest_token")) &&
    (normalized.includes("could not find") ||
      normalized.includes("does not exist") ||
      normalized.includes("schema cache") ||
      normalized.includes("column"))
  );
}

function isCircuitBreakerMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("ecircuitbreaker") ||
    normalized.includes("too many authentication failures") ||
    normalized.includes("temporarily blocked")
  );
}

/** Prefer PostgREST probe — never open raw Postgres from Instant Meeting creates. */
async function instantMeetingSchemaReadyViaRest(): Promise<boolean | null> {
  if (!isSupabaseServiceRoleConfigured()) return null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase
      .from("messaging_call_rooms")
      .select("guest_token, allow_guest_join")
      .limit(1);
    if (!error) return true;
    if (isMissingInstantMeetingColumnError(error.message)) return false;
    // Other errors (RLS, network) — unknown
    return null;
  } catch {
    return null;
  }
}

async function instantMeetingSchemaReadyViaManagement(): Promise<boolean | null> {
  try {
    const row = await queryScalarViaManagementApi<{ ready: boolean }>(
      `select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'messaging_call_rooms'
          and column_name = 'guest_token'
      ) as ready`,
    );
    if (row == null) return null;
    return row.ready === true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isCircuitBreakerMessage(message)) return null;
    return null;
  }
}

async function instantMeetingSchemaReady() {
  if (schemaKnownReady) return true;

  const viaRest = await instantMeetingSchemaReadyViaRest();
  if (viaRest === true) {
    schemaKnownReady = true;
    return true;
  }
  if (viaRest === false) return false;

  const viaMgmt = await instantMeetingSchemaReadyViaManagement();
  if (viaMgmt === true) {
    schemaKnownReady = true;
    return true;
  }
  return false;
}

async function applyInstantMeetingMigrationViaManagement() {
  const sql = readFileSync(join(process.cwd(), INSTANT_MEETING_MIGRATION), "utf8");
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
    throw new Error(
      `Failed to apply ${INSTANT_MEETING_MIGRATION} via Supabase management API (${response.status}): ${body.slice(0, 240)}`,
    );
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

/**
 * Ensure Instant Meeting columns exist without raw Postgres password probing.
 * Password-guessing against the pooler triggers ECIRCUITBREAKER and blocks creates.
 */
export async function ensureMessagingInstantMeetingSchema(force = false) {
  try {
    if (!force && (await instantMeetingSchemaReady())) {
      return true;
    }

    if (!ensurePromise) {
      ensurePromise = applyInstantMeetingMigrationViaManagement()
        .then(async (applied) => {
          if (!applied) return false;
          // Brief pause for PostgREST schema reload
          await new Promise((resolve) => setTimeout(resolve, 400));
          const ready = await instantMeetingSchemaReady();
          if (ready) schemaKnownReady = true;
          return ready;
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          if (!isCircuitBreakerMessage(message)) {
            console.warn("[Messaging] instant meeting schema ensure failed", message);
          }
          return false;
        })
        .finally(() => {
          ensurePromise = null;
        });
    }

    return ensurePromise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isCircuitBreakerMessage(message)) {
      console.warn("[Messaging] instant meeting schema ensure failed", message);
    }
    return false;
  }
}
