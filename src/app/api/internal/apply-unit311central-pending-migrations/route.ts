import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  getMigrationReadiness,
  queryScalarViaManagementApi,
  withResolvedDatabaseClient,
} from "@/lib/internal-db-migrations";
import {
  MigrationQueryError,
  withMigrationQueryClient,
} from "@/lib/migration-query-client";
import {
  applyMigrationSqlViaClient,
  describePendingMigrationPlan,
  readMigrationSql,
  runPendingMigrations,
  type MigrationApplyResult,
} from "@/lib/migration-runner";
import {
  UNIT311_CENTRAL_PROJECT_REF,
  UNIT311_PENDING_MIGRATIONS,
} from "@/lib/unit311-pending-migrations";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

async function queryViaManagementApi(token: string, sql: string) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${UNIT311_CENTRAL_PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

async function applyMigrationFile(
  migration: string,
  token: string,
): Promise<MigrationApplyResult> {
  const sql = readMigrationSql(migration);

  if (token.length >= 20) {
    const result = await queryViaManagementApi(token, sql);
    if (result.ok) return { ok: true, method: "management-api" };

    const appliedViaDbAfterMgmtFailure = await withResolvedDatabaseClient(async (client) => {
      await applyMigrationSqlViaClient(client, sql);
      return true;
    });
    if (appliedViaDbAfterMgmtFailure) return { ok: true, method: "postgres" };
    return { ok: false, status: result.status, data: result.data, method: "management-api" };
  }

  const appliedViaDb = await withResolvedDatabaseClient(async (client) => {
    await applyMigrationSqlViaClient(client, sql);
    return true;
  });

  if (appliedViaDb) return { ok: true, method: "postgres" };
  return { ok: false, method: "postgres", data: "No database connection available." };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const readiness = getMigrationReadiness();
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";

  let plan: Awaited<ReturnType<typeof describePendingMigrationPlan>> | null = null;
  let queryBackend: string | null = null;
  let queryError: string | null = null;

  if (readiness.hasSupabaseDbUrl || readiness.hasSupabaseDbPassword || token.length >= 20) {
    try {
      const resolved = await withMigrationQueryClient(async (client) =>
        describePendingMigrationPlan(UNIT311_PENDING_MIGRATIONS, client),
      );
      if (resolved) {
        queryBackend = resolved.backend;
        plan = resolved.result;
      } else {
        queryError = "No PostgreSQL or Supabase Management API credentials are configured.";
      }
    } catch (error) {
      queryError =
        error instanceof MigrationQueryError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Migration plan query failed.";
    }
  }

  return NextResponse.json({
    targetProjectRef: UNIT311_CENTRAL_PROJECT_REF,
    readiness,
    migrations: UNIT311_PENDING_MIGRATIONS,
    queryBackend,
    plan,
    queryError,
  });
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
  const readiness = getMigrationReadiness();
  const canApplyViaDatabase =
    readiness.hasSupabaseDbUrl ||
    readiness.hasSupabaseDbPassword ||
    (readiness.hasSupabaseServiceRoleKey &&
      readiness.serviceRoleKeyLength >= 80 &&
      readiness.hasSupabaseProjectRef);
  if (token.length < 20 && !canApplyViaDatabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Database credentials are not configured. Add SUPABASE_ACCESS_TOKEN, SUPABASE_DB_URL, or SUPABASE_DB_PASSWORD on this deployment.",
        readiness,
      },
      { status: 503 },
    );
  }

  let runnerResult: Awaited<ReturnType<typeof runPendingMigrations>> | null = null;
  let queryBackend: string | null = null;

  try {
    const resolved = await withMigrationQueryClient(async (client) =>
      runPendingMigrations({
        migrations: UNIT311_PENDING_MIGRATIONS,
        client,
        applyMigrationFile: (migration) => applyMigrationFile(migration, token),
      }),
    );
    if (resolved) {
      queryBackend = resolved.backend;
      runnerResult = resolved.result;
    }
  } catch (error) {
    const message =
      error instanceof MigrationQueryError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Migration runner query failed.";
    return NextResponse.json({ ok: false, error: message, readiness }, { status: 503 });
  }

  if (!runnerResult) {
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection unavailable for migration runner.",
        readiness,
      },
      { status: 503 },
    );
  }

  const backfillSql = `update public.founder_session_bookings
    set meeting_slug = 'simon-4e92abae'
    where id = '4e92abae-4d94-430e-8888-c2ecb95d8552'
      and meeting_slug is null`;

  if (token.length >= 20) {
    await queryViaManagementApi(token, backfillSql);
    await queryViaManagementApi(token, `notify pgrst, 'reload schema'`);
  } else {
    await withResolvedDatabaseClient(async (client) => {
      await applyMigrationSqlViaClient(client, backfillSql);
      await applyMigrationSqlViaClient(client, `notify pgrst, 'reload schema'`);
    });
  }

  const verification = await queryScalarViaManagementApi<{
    founder_session_meeting_slug?: boolean;
    internal_action_items?: boolean;
    crm_discovery_notes?: boolean;
    executive_call_transcription?: boolean;
    executive_call_guest_admission?: boolean;
    crm_client_report_file_id?: boolean;
    crm_discovery_questionnaire?: boolean;
    company_details?: boolean;
    simon_meeting_slug?: string | null;
    marketing_contacts?: boolean;
    marketing_newsletters?: boolean;
    marketing_campaigns?: boolean;
    marketing_external_events?: boolean;
    marketing_managed_events?: boolean;
    marketing_media_assets?: boolean;
    marketing_stories?: boolean;
    marketing_abhi_extensions?: boolean;
    sales_quotes?: boolean;
    sales_quote_line_items?: boolean;
  }>(
    `select
      (select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'founder_session_bookings'
          and column_name = 'meeting_slug'
      )) as founder_session_meeting_slug,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public'
          and table_name = 'internal_action_items'
      )) as internal_action_items,
      (select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'crm_leads'
          and column_name = 'discovery_notes'
      )) as crm_discovery_notes,
      (select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'founder_session_bookings'
          and column_name = 'transcript_draft'
      )) as executive_call_transcription,
      (select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'founder_session_bookings'
          and column_name = 'guests_admitted_at'
      )) as executive_call_guest_admission,
      (select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'crm_leads'
          and column_name = 'client_report_file_id'
      )) as crm_client_report_file_id,
      (select exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'crm_leads'
          and column_name = 'discovery_questionnaire'
      )) as crm_discovery_questionnaire,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public'
          and table_name = 'company_details'
      )) as company_details,
      (select meeting_slug from public.founder_session_bookings
       where id = '4e92abae-4d94-430e-8888-c2ecb95d8552') as simon_meeting_slug,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_contacts'
      )) as marketing_contacts,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_newsletters'
      )) as marketing_newsletters,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_campaigns'
      )) as marketing_campaigns,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_external_events'
      )) as marketing_external_events,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_managed_events'
      )) as marketing_managed_events,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_media_assets'
      )) as marketing_media_assets,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_stories'
      )) as marketing_stories,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'marketing_abhi_extensions'
      )) as marketing_abhi_extensions,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'sales_quotes'
      )) as sales_quotes,
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'sales_quote_line_items'
      )) as sales_quote_line_items`,
  );

  let verificationViaDb: typeof verification = null;
  if (!verification) {
    verificationViaDb = await withResolvedDatabaseClient(async (client) => {
      const result = await client.query<{
        founder_session_meeting_slug: boolean;
        internal_action_items: boolean;
        crm_discovery_notes: boolean;
        executive_call_transcription: boolean;
        executive_call_guest_admission: boolean;
        crm_client_report_file_id: boolean;
        crm_discovery_questionnaire: boolean;
        company_details: boolean;
        simon_meeting_slug: string | null;
        marketing_contacts: boolean;
        marketing_newsletters: boolean;
        marketing_campaigns: boolean;
        marketing_external_events: boolean;
        marketing_managed_events: boolean;
        marketing_media_assets: boolean;
        marketing_stories: boolean;
        marketing_abhi_extensions: boolean;
        sales_quotes: boolean;
        sales_quote_line_items: boolean;
      }>(
        `select
          (select exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = 'founder_session_bookings'
              and column_name = 'meeting_slug'
          )) as founder_session_meeting_slug,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public'
              and table_name = 'internal_action_items'
          )) as internal_action_items,
          (select exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = 'crm_leads'
              and column_name = 'discovery_notes'
          )) as crm_discovery_notes,
          (select exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = 'founder_session_bookings'
              and column_name = 'transcript_draft'
          )) as executive_call_transcription,
          (select exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = 'founder_session_bookings'
              and column_name = 'guests_admitted_at'
          )) as executive_call_guest_admission,
          (select exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = 'crm_leads'
              and column_name = 'client_report_file_id'
          )) as crm_client_report_file_id,
          (select exists (
            select 1 from information_schema.columns
            where table_schema = 'public'
              and table_name = 'crm_leads'
              and column_name = 'discovery_questionnaire'
          )) as crm_discovery_questionnaire,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public'
              and table_name = 'company_details'
          )) as company_details,
          (select meeting_slug from public.founder_session_bookings
           where id = '4e92abae-4d94-430e-8888-c2ecb95d8552') as simon_meeting_slug,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_contacts'
          )) as marketing_contacts,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_newsletters'
          )) as marketing_newsletters,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_campaigns'
          )) as marketing_campaigns,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_external_events'
          )) as marketing_external_events,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_managed_events'
          )) as marketing_managed_events,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_media_assets'
          )) as marketing_media_assets,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_stories'
          )) as marketing_stories,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'marketing_abhi_extensions'
          )) as marketing_abhi_extensions,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'sales_quotes'
          )) as sales_quotes,
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'sales_quote_line_items'
          )) as sales_quote_line_items`,
      );
      return result.rows[0] ?? null;
    });
  }

  return NextResponse.json({
    ok: runnerResult.ok,
    targetProjectRef: UNIT311_CENTRAL_PROJECT_REF,
    queryBackend,
    applied: runnerResult.applied,
    skipped: runnerResult.skipped,
    pending: runnerResult.pending,
    errors: runnerResult.errors,
    readiness,
    verification: verification ?? verificationViaDb,
  });
}
