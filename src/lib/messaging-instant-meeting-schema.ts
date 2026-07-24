import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  queryScalarViaManagementApi,
  withResolvedDatabaseClient,
} from "@/lib/internal-db-migrations";

const INSTANT_MEETING_MIGRATION = "supabase/migrations/113_messaging_instant_meetings.sql";

let ensurePromise: Promise<boolean> | null = null;

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

async function instantMeetingSchemaReady() {
  const row = await queryScalarViaManagementApi<{ ready: boolean }>(
    `select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'messaging_call_rooms'
        and column_name = 'guest_token'
    ) as ready`,
  );

  if (row?.ready) return true;

  const appliedViaDb = await withResolvedDatabaseClient(async (client) => {
    const result = await client.query<{ ready: boolean }>(
      `select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'messaging_call_rooms'
          and column_name = 'guest_token'
      ) as ready`,
    );
    return result.rows[0]?.ready === true;
  });

  return appliedViaDb === true;
}

async function applyInstantMeetingMigration() {
  const sql = readFileSync(join(process.cwd(), INSTANT_MEETING_MIGRATION), "utf8");
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
  const projectRef =
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    (process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname.split(".")[0] : null);

  if (token.length >= 20 && projectRef) {
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
    });

    return true;
  }

  const appliedViaDb = await withResolvedDatabaseClient(async (client) => {
    await client.query(sql);
    await client.query("notify pgrst, 'reload schema'");
    return true;
  });

  if (appliedViaDb !== true) {
    console.warn(
      "[Messaging] Unable to apply instant meeting migration automatically. Run /api/internal/apply-unit311central-pending-migrations.",
    );
    return false;
  }

  return true;
}

export async function ensureMessagingInstantMeetingSchema(force = false) {
  if (!force && (await instantMeetingSchemaReady())) {
    return true;
  }

  if (!ensurePromise) {
    ensurePromise = applyInstantMeetingMigration()
      .then(async (applied) => {
        if (!applied) return false;
        return instantMeetingSchemaReady();
      })
      .catch((error) => {
        console.warn("[Messaging] instant meeting schema ensure failed", error);
        return false;
      })
      .finally(() => {
        ensurePromise = null;
      });
  }

  return ensurePromise;
}
