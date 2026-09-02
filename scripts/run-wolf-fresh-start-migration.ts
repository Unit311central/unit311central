/**
 * Apply 198_wolf_central_fresh_start.sql to production.
 * SUPABASE_ACCESS_TOKEN=... npx tsx scripts/run-wolf-fresh-start-migration.ts
 */
import { readFileSync } from "node:fs";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";

async function runSql(query: string): Promise<unknown> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : JSON.stringify(body));
  }
  return body;
}

async function main() {
  const sql = readFileSync(
    new URL("../supabase/migrations/198_wolf_central_fresh_start.sql", import.meta.url),
    "utf8",
  );
  await runSql(sql);
  const counts = (await runSql(
    `select
      (select count(*) from public.internal_projects ip join public.workspaces w on w.id = ip.workspace_id where w.slug = 'wolf-central') as projects,
      (select count(*) from public.support_tickets st join public.workspaces w on w.id = st.workspace_id where w.slug = 'wolf-central') as tickets,
      (select count(*) from public.software_assets sa join public.workspaces w on w.id = sa.workspace_id where w.slug = 'wolf-central') as software_assets`,
  )) as Array<{ projects: number; tickets: number; software_assets: number }>;
  console.log(JSON.stringify({ ok: true, counts: counts[0] }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
