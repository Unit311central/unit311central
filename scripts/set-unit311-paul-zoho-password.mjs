#!/usr/bin/env node
/**
 * Set paul@unit311central.com Zoho app password on Vercel production + Supabase.
 *
 * Usage:
 *   ZOHO_PAUL_PASSWORD='your-app-password' node scripts/set-unit311-paul-zoho-password.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const PAUL_EMAIL = "paul@unit311central.com";

function loadEnv(file) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] && value && value !== "[SENSITIVE]") {
      process.env[key] = value;
    }
  }
}

loadEnv(".env.corporatecentre.runtime");

const password = process.env.ZOHO_PAUL_PASSWORD?.trim() ?? "";
if (!password || password === "[SENSITIVE]") {
  console.error("Set ZOHO_PAUL_PASSWORD to paul@unit311central.com's Zoho app-specific password.");
  process.exit(1);
}

function vercelEnvUpdate(name, value, environment = "production") {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "update", name, environment, "--yes"],
    {
      cwd: process.cwd(),
      input: value,
      encoding: "utf8",
      shell: true,
    },
  );
  if (result.status !== 0) {
    console.error(`Failed to update ${name}:`, `${result.stdout ?? ""}${result.stderr ?? ""}`);
    process.exit(1);
  }
  console.log(`${name}: updated on ${environment}`);
}

vercelEnvUpdate("ZOHO_PAUL_PASSWORD", password);
vercelEnvUpdate("ZOHO_PAUL_EMAIL", PAUL_EMAIL);

const { createSupabaseServiceRoleClient } = await import("../src/lib/supabase/server.ts");
const sb = createSupabaseServiceRoleClient();
const { data: workspace, error: workspaceError } = await sb
  .from("workspaces")
  .select("id")
  .eq("slug", "unit311")
  .maybeSingle();

if (workspaceError || !workspace?.id) {
  console.error("unit311 workspace not found:", workspaceError?.message ?? "missing");
  process.exit(1);
}

const { error: upsertError } = await sb.from("email_mailbox_credentials").upsert(
  {
    workspace_id: workspace.id,
    account_id: "paul",
    email: PAUL_EMAIL,
    password,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "workspace_id,account_id" },
);

if (upsertError) {
  console.error("Supabase upsert failed:", upsertError.message);
  process.exit(1);
}

console.log("Supabase email_mailbox_credentials updated for paul@");
console.log("Redeploy production (or wait for next deploy) so Vercel picks up the new secret.");
