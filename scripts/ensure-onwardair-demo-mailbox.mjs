/**
 * Permanently ensure OnwardAir demo@ Zoho mailbox credentials in Supabase.
 * Uses corporatecentre runtime for DB access; Zoho password from Vercel when available.
 *
 *   node scripts/ensure-onwardair-demo-mailbox.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EMAIL = "demo@unit311central.com";
const ACCOUNT_ID = "demo";
const OA_ID = "3b479f90-d063-421b-ae93-542a508129f5";

function loadEnvFile(filePath) {
  const out = {};
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v && !v.startsWith("[SENSITI")) out[k] = v;
    }
  } catch {
    /* optional */
  }
  return out;
}

function passwordMeta(password) {
  const p = String(password || "");
  return {
    len: p.length,
    hasDash: p.includes("-"),
    hasLetter: /[A-Za-z]/.test(p),
    hasDigit: /\d/.test(p),
  };
}

function readVercelEnv(name) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "get", name, "production"],
    { cwd: root, encoding: "utf8", shell: true },
  );
  const text = `${result.stdout || ""}${result.stderr || ""}`.trim();
  // CLI may print value alone, or with banners — take last non-empty line that looks like a secret.
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^vercel|retrieving|downloading|created|\$/i.test(line));
  const candidate = lines[lines.length - 1] || "";
  if (!candidate || candidate.startsWith("[SENSITI") || candidate.includes("Error")) return "";
  return candidate.replace(/^["']|["']$/g, "");
}

const dbEnv = loadEnvFile(path.join(root, ".env.corporatecentre.runtime"));
const SUPABASE_URL = dbEnv.SUPABASE_URL || dbEnv.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = dbEnv.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing Supabase service credentials in .env.corporatecentre.runtime");
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: workspaces, error: wsErr } = await admin.from("workspaces").select("id, slug");
if (wsErr) throw new Error(wsErr.message);
const bySlug = Object.fromEntries((workspaces || []).map((w) => [w.slug, w.id]));
const unit311Id = bySlug.unit311;

const { data: allCreds, error: credErr } = await admin
  .from("email_mailbox_credentials")
  .select("account_id, email, workspace_id, password, updated_at")
  .eq("account_id", ACCOUNT_ID);
if (credErr) throw new Error(credErr.message);

const byWs = Object.fromEntries(
  (allCreds || []).map((row) => [
    row.workspace_id,
    { email: row.email, password: row.password, updated_at: row.updated_at },
  ]),
);

console.log(
  "existing demo rows",
  (allCreds || []).map((row) => ({
    workspace_id: row.workspace_id,
    slug: (workspaces || []).find((w) => w.id === row.workspace_id)?.slug,
    ...passwordMeta(row.password),
    updated_at: row.updated_at,
  })),
);

const vercelPassword = readVercelEnv("ZOHO_DEMO_PASSWORD");
const unit311Password = byWs[unit311Id]?.password || "";
const oaPassword = byWs[OA_ID]?.password || "";

console.log({
  vercelPassword: passwordMeta(vercelPassword),
  unit311Password: passwordMeta(unit311Password),
  oaPassword: passwordMeta(oaPassword),
});

// Prefer the longest plausible app password (Zoho app passwords are usually 12+ chars).
const candidates = [
  { source: "vercel-env", password: vercelPassword },
  { source: "unit311-db", password: unit311Password },
  { source: "onwardair-db", password: oaPassword },
]
  .map((entry) => ({ ...entry, password: String(entry.password || "").trim() }))
  .filter((entry) => entry.password.length > 0)
  .sort((a, b) => b.password.length - a.password.length);

if (candidates.length === 0) {
  throw new Error("No Zoho demo password found in Vercel or Supabase");
}

const chosen = candidates[0];
const now = new Date().toISOString();
const { data, error } = await admin
  .from("email_mailbox_credentials")
  .upsert(
    {
      workspace_id: OA_ID,
      account_id: ACCOUNT_ID,
      email: EMAIL,
      password: chosen.password,
      updated_at: now,
    },
    { onConflict: "workspace_id,account_id" },
  )
  .select("account_id, email, workspace_id, updated_at")
  .single();

if (error) throw new Error(error.message);

console.log({
  upserted: true,
  source: chosen.source,
  password: passwordMeta(chosen.password),
  row: data,
});
