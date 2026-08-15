/**
 * Static audit: server modules still using anon client on Phase-1 hardened tables.
 * Run: node --import tsx src/lib/supabase/tenancy-compatibility-audit.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src");
const HARDENED_TABLES = [
  "financial_expenses",
  "accounts",
  "journal_entries",
  "journal_lines",
  "invoices",
  "treasury_settings",
  "wise_payment_matches",
  "internal_clients",
  "internal_projects",
  "internal_project_tasks",
  "hr_employees",
  "hr_employee_compensation_history",
  "file_objects",
  "file_folders",
  "file_categories",
  "crm_leads",
  "crm_activities",
  "crm_connections",
  "crm_contact_history",
  "platform_users",
  "workspaces",
  "workspace_settings",
  "workspace_modules",
  "workspace_users",
  "workspace_audit_log",
  "software_provider_connections",
  "software_provider_sync_runs",
  "software_provider_period_snapshots",
  "software_provider_charge_facts",
  "software_provider_invoices",
  "partners",
  "partner_jobs",
  "partner_commission_rates",
  "partner_invoices",
];

const SKIP_PATHS = [
  "supabase/__tests__/workspace-tenancy-security.check.ts",
  "supabase/tenancy-compatibility-audit.ts",
  "supabase/tenancy-server.ts",
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const findings: string[] = [];

  for (const file of walk(ROOT)) {
    const rel = relative(join(process.cwd(), "src"), file).replace(/\\/g, "/");
    if (SKIP_PATHS.some((skip) => rel.includes(skip))) continue;

    const source = readFileSync(file, "utf8");
    if (!source.includes("createSupabaseServerClient")) continue;

    const usesHardenedTable = HARDENED_TABLES.some((table) => source.includes(`"${table}"`));
    if (!usesHardenedTable) continue;

    const usesTenancy = source.includes("createTenancyServerClient");
    const usesServiceRole = source.includes("createSupabaseServiceRoleClient");

    if (!usesTenancy && !usesServiceRole) {
      findings.push(rel);
    }
  }

  console.log("Phase 1 server compatibility audit — anon client on hardened tables:\n");
  if (!findings.length) {
    console.log("No unresolved findings in scanned paths.");
    return;
  }

  for (const path of findings.sort()) {
    console.log(`  - src/${path}`);
  }

  console.log(`\n${findings.length} file(s) may need createTenancyServerClient() before migration 144.`);
  process.exitCode = 0;
}

main();
