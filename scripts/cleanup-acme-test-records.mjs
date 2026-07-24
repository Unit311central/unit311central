/**
 * Remove bad Acme / Site Survey test records from production (clients + projects).
 * Usage: node scripts/cleanup-acme-test-records.mjs [.env.vercel.pull]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(path) {
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    values[key] = val;
  }
  return values;
}

const envPath = process.argv[2] ?? join(process.cwd(), ".env.vercel.pull");
const env = loadEnvFile(envPath);
const supabaseUrl = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in", envPath);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CLIENT_NAMES = ["Acme Engineering Ltd", "Acme Engineering", "Site Survey"];
const PROJECT_NAMES = ["Site Survey"];

function matchesName(value, names) {
  const v = String(value || "").trim().toLowerCase();
  return names.some((n) => n.toLowerCase() === v);
}

const { data: clients, error: clientErr } = await supabase
  .from("internal_clients")
  .select("id, company_name, account_status, workspace_id");
if (clientErr) throw clientErr;

const targetClients = (clients ?? []).filter((c) =>
  matchesName(c.company_name, CLIENT_NAMES),
);
console.log(
  "Clients to remove:",
  targetClients.map((c) => `${c.company_name} (${c.id})`),
);

const { data: projects, error: projectErr } = await supabase
  .from("internal_projects")
  .select("id, name, client_name, client_id, workspace_id");
if (projectErr) throw projectErr;

const clientIds = new Set(targetClients.map((c) => c.id));
const targetProjects = (projects ?? []).filter(
  (p) =>
    matchesName(p.name, PROJECT_NAMES) ||
    matchesName(p.client_name, CLIENT_NAMES) ||
    (p.client_id && clientIds.has(p.client_id)),
);
console.log(
  "Projects to remove:",
  targetProjects.map((p) => `${p.name} / client=${p.client_name} (${p.id})`),
);

for (const project of targetProjects) {
  const { error } = await supabase.from("internal_projects").delete().eq("id", project.id);
  if (error) throw new Error(`project ${project.id}: ${error.message}`);
  console.log("Deleted project", project.id, project.name);
}

for (const client of targetClients) {
  // Clear open invoices if any (paid invoices block delete — archive instead).
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, status, invoice_number")
    .eq("client_id", client.id);
  const rows = invoices ?? [];
  const paid = rows.filter((r) => r.status === "paid");
  if (paid.length) {
    const { error } = await supabase
      .from("internal_clients")
      .update({ account_status: "Archived" })
      .eq("id", client.id);
    if (error) throw error;
    console.log("Archived client (paid invoices)", client.id, client.company_name);
    continue;
  }
  if (rows.length) {
    const { error: invErr } = await supabase
      .from("invoices")
      .delete()
      .in(
        "id",
        rows.map((r) => r.id),
      );
    if (invErr) console.warn("invoice cleanup:", invErr.message);
  }
  const { error } = await supabase.from("internal_clients").delete().eq("id", client.id);
  if (error) throw new Error(`client ${client.id}: ${error.message}`);
  console.log("Deleted client", client.id, client.company_name);
}

console.log("CLEANUP DONE");
