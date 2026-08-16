/**
 * Demo enterprise seed runner — Demo workspace only.
 *
 * Usage:
 *   node scripts/demo-enterprise/run.mjs
 *
 * Requires linked Supabase CLI (`npx supabase db query --linked`) OR
 * SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF for Management API.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnterpriseGraph } from "./build-graph.mjs";
import { emitSeedSql } from "./emit-sql.mjs";
import { resolveDemoWorkspace } from "./safety.mjs";
import { buildWipeSql } from "./wipe.mjs";
import { writeDemoFixtures } from "./fixtures/write-demo-fixtures.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const demoSlug = (process.env.DEMO_WORKSPACE_SLUG ?? "demo").trim().toLowerCase();
const seed = Number(process.env.DEMO_ENTERPRISE_SEED ?? 3112025);

function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (data?.rows) return data.rows;
  return [];
}

async function queryViaManagementApi(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? "kkxtvzxqmbacjatkiupq";
  if (!token) return null;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Management API query failed (${res.status}): ${JSON.stringify(data).slice(0, 800)}`,
    );
  }
  return data;
}

function queryViaCli(sql) {
  const tmp = join(__dirname, `.tmp-batch-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  writeFileSync(tmp, sql, "utf8");
  try {
    const piped = spawnSync("npx", ["supabase", "db", "query", "--linked"], {
      cwd: ROOT,
      encoding: "utf8",
      input: sql,
      maxBuffer: 20 * 1024 * 1024,
      shell: true,
    });
    const text = `${piped.stdout || ""}\n${piped.stderr || ""}`;
    const jsonStart = (piped.stdout || "").indexOf("{");
    const payload =
      jsonStart >= 0 ? JSON.parse((piped.stdout || "").slice(jsonStart)) : null;
    if (payload?._tag === "Error" || payload?.error) {
      throw new Error(payload?.error?.message || JSON.stringify(payload).slice(0, 800));
    }
    if (piped.status !== 0 && !payload) {
      throw new Error(piped.stderr || piped.stdout || "supabase db query failed");
    }
    return payload || {};
  } finally {
    try {
      unlinkSync(tmp);
    } catch {
      // ignore
    }
  }
}

async function query(sql) {
  const viaApi = await queryViaManagementApi(sql);
  if (viaApi) return viaApi;
  return queryViaCli(sql);
}

async function countRows(table, workspaceId) {
  const data = await query(
    `select count(*)::int as c from public.${table} where workspace_id = '${workspaceId}'::uuid`,
  );
  return normalizeRows(data)[0]?.c ?? 0;
}

async function countRowsText(table, workspaceId) {
  const data = await query(
    `select count(*)::int as c from public.${table} where workspace_id = '${workspaceId}'`,
  );
  return normalizeRows(data)[0]?.c ?? 0;
}

async function main() {
  console.log("Demo enterprise seed — resolving workspace…");
  const workspace = await resolveDemoWorkspace(
    async (sql) => normalizeRows(await query(sql)),
    demoSlug,
  );
  console.log(`Demo workspace: ${workspace.slug} (${workspace.id})`);
  if (workspace.internalId) {
    console.log(`Internal workspace id (must not change): ${workspace.internalId}`);
  }

  const beforeInternal = workspace.internalId
    ? {
        clients: await countRows("internal_clients", workspace.internalId),
        employees: await countRows("hr_employees", workspace.internalId),
        invoices: await countRows("invoices", workspace.internalId),
      }
    : null;
  if (beforeInternal) {
    console.log("Internal snapshot before:", beforeInternal);
  }

  const graph = buildEnterpriseGraph({ seed, employees: 25, clients: 100 });
  console.log(
    `Graph: ${graph.employees.length} employees, ${graph.clients.length} clients, ${graph.projects.length} projects, ${graph.invoices.length} invoices`,
  );

  const fixturesPath = writeDemoFixtures(ROOT, graph);
  console.log(`Wrote Demo fixtures → ${fixturesPath}`);

  console.log("Wiping Demo business data…");
  await query(buildWipeSql(workspace.id));

  const batches = emitSeedSql(workspace.id, graph);
  console.log(`Applying ${batches.length} SQL batches…`);
  for (let i = 0; i < batches.length; i += 1) {
    process.stdout.write(`  batch ${i + 1}/${batches.length}\r`);
    try {
      await query(batches[i]);
    } catch (error) {
      const preview = batches[i].slice(0, 240).replace(/\s+/g, " ");
      throw new Error(`Batch ${i + 1} failed: ${error.message}\nSQL preview: ${preview}`);
    }
  }
  console.log(`\nApplied ${batches.length} batches.`);

  const afterDemo = {
    clients: await countRows("internal_clients", workspace.id),
    employees: await countRows("hr_employees", workspace.id),
    projects: await countRows("internal_projects", workspace.id),
    invoices: await countRows("invoices", workspace.id),
    tickets: await countRows("support_tickets", workspace.id),
    expenses: await countRows("financial_expenses", workspace.id),
    payrollRuns: await countRowsText("payroll_runs", workspace.id),
  };
  console.log("Demo counts:", afterDemo);

  if (beforeInternal && workspace.internalId) {
    const afterInternal = {
      clients: await countRows("internal_clients", workspace.internalId),
      employees: await countRows("hr_employees", workspace.internalId),
      invoices: await countRows("invoices", workspace.internalId),
    };
    console.log("Internal snapshot after:", afterInternal);
    for (const key of Object.keys(beforeInternal)) {
      if (beforeInternal[key] !== afterInternal[key]) {
        throw new Error(
          `INTERNAL CHANGED: ${key} was ${beforeInternal[key]}, now ${afterInternal[key]}`,
        );
      }
    }
    console.log("Internal workspace unchanged ✓");
  }

  if (afterDemo.clients < 90 || afterDemo.employees < 20) {
    throw new Error(`Demo thresholds not met: ${JSON.stringify(afterDemo)}`);
  }

  const report = {
    ok: true,
    demoWorkspaceId: workspace.id,
    demoSlug: workspace.slug,
    counts: afterDemo,
    internalUnchanged: true,
    fixturesPath,
    seededAt: new Date().toISOString(),
  };
  mkdirSync(join(__dirname, "out"), { recursive: true });
  writeFileSync(join(__dirname, "out/last-seed-report.json"), JSON.stringify(report, null, 2));
  console.log("Demo enterprise seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
