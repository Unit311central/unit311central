/**
 * Read-only production audit for Stage 2 workspace identity isolation.
 * Does not mutate data. Requires SUPABASE_ACCESS_TOKEN or direct Postgres.
 */
import fs from "node:fs";
import path from "node:path";

import { withMigrationQueryClient } from "@/lib/migration-query-client";

const WORKSPACE_SLUGS = [
  "demo",
  "unit311",
  "interfaceworx",
  "abhi",
  "talanton",
  "mam",
  "greendesert",
] as const;

type Row = Record<string, unknown>;

async function main() {
  const run = await withMigrationQueryClient(async (client) => {
    const slugList = WORKSPACE_SLUGS.map((s) => `'${s.replace(/'/g, "''")}'`).join(", ");
    const { rows: workspaces } = await client.query<Row>(
      `select id, slug, name from public.workspaces where slug in (${slugList}) order by slug`,
    );

    const workspaceBySlug = new Map(workspaces.map((w) => [String(w.slug), w]));

    const perWorkspace: Record<string, unknown> = {};
    for (const slug of WORKSPACE_SLUGS) {
      const ws = workspaceBySlug.get(slug);
      if (!ws?.id) {
        perWorkspace[slug] = { error: "workspace not found" };
        continue;
      }
      const workspaceId = String(ws.id);

      const { rows: members } = await client.query<Row>(
        `select wu.user_id, pu.username, pu.email, pu.workspace_id as primary_workspace_id
         from public.workspace_users wu
         join public.platform_users pu on pu.id = wu.user_id
         where wu.workspace_id = $1
         order by pu.username`,
        [workspaceId],
      );

      const { rows: employees } = await client.query<Row>(
        `select id, full_name, email, platform_user_id, workspace_id
         from public.hr_employees
         where workspace_id = $1
         order by full_name
         limit 500`,
        [workspaceId],
      );

      perWorkspace[slug] = {
        workspaceId,
        memberCount: members.length,
        members: members.map((m) => ({
          userId: m.user_id,
          username: m.username,
          email: m.email,
          primaryWorkspaceId: m.primary_workspace_id,
        })),
        hrEmployeeCount: employees.length,
      };
    }

    const { rows: internalOperators } = await client.query<Row>(
      `select io.id, io.username, io.email, io.full_name, pu.workspace_id as platform_primary_workspace_id
       from public.internal_operators io
       left join public.platform_users pu on pu.id::text = io.id or pu.username = io.username
       order by io.username`,
    );

    const { rows: hrMismatch } = await client.query<Row>(
      `select e.id as employee_id, e.full_name, e.workspace_id as employee_workspace_id, w.slug as employee_workspace_slug,
              e.platform_user_id, pu.username, pu.workspace_id as user_primary_workspace_id,
              (select array_agg(wu.workspace_id::text)
               from public.workspace_users wu where wu.user_id::text = e.platform_user_id::text) as user_memberships
       from public.hr_employees e
       left join public.workspaces w on w.id = e.workspace_id
       left join public.platform_users pu on pu.id::text = e.platform_user_id::text
       where e.platform_user_id is not null and e.platform_user_id::text <> ''
         and (
           pu.workspace_id is distinct from e.workspace_id
           or not exists (
             select 1 from public.workspace_users wu
             where wu.user_id::text = e.platform_user_id::text and wu.workspace_id = e.workspace_id
           )
         )
       order by e.full_name
       limit 200`,
    );

    return {
      generatedAt: new Date().toISOString(),
      perWorkspace,
      internalOperators: internalOperators.map((row) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        fullName: row.full_name,
        platformPrimaryWorkspaceId: row.platform_primary_workspace_id,
      })),
      internalOperatorCount: internalOperators.length,
      hrPlatformUserRemediationCandidates: hrMismatch,
    };
  });

  const outDir = "/opt/cursor/artifacts/workspace-isolation-stage2";
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "readonly-audit.json");

  if (!run) {
    const stub = {
      generatedAt: new Date().toISOString(),
      skipped: true,
      reason: "No database credentials (SUPABASE_ACCESS_TOKEN or Postgres)",
    };
    fs.writeFileSync(outPath, JSON.stringify(stub, null, 2));
    console.log(JSON.stringify(stub, null, 2));
    process.exit(0);
  }

  fs.writeFileSync(outPath, JSON.stringify(run.result, null, 2));
  console.log(JSON.stringify({ backend: run.backend, outPath, ...run.result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
