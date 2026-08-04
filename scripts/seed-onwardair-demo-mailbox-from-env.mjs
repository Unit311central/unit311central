/**
 * Seed OnwardAir demo@ mailbox from live Vercel production env (ZOHO_DEMO_PASSWORD).
 *
 *   npx vercel env run -e production -- node scripts/seed-onwardair-demo-mailbox-from-env.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const dbEnv = loadEnvFile(path.join(root, ".env.corporatecentre.runtime"));
const password = String(process.env.ZOHO_DEMO_PASSWORD || "").trim();
if (!password) {
  throw new Error("ZOHO_DEMO_PASSWORD missing — run via: npx vercel env run -e production -- node ...");
}

const admin = createClient(
  dbEnv.SUPABASE_URL || dbEnv.NEXT_PUBLIC_SUPABASE_URL,
  dbEnv.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const now = new Date().toISOString();
const { data, error } = await admin
  .from("email_mailbox_credentials")
  .upsert(
    {
      workspace_id: OA_ID,
      account_id: ACCOUNT_ID,
      email: EMAIL,
      password,
      updated_at: now,
    },
    { onConflict: "workspace_id,account_id" },
  )
  .select("account_id, email, workspace_id, updated_at")
  .single();

if (error) throw new Error(error.message);

console.log({
  ok: true,
  passwordLen: password.length,
  hasDash: password.includes("-"),
  row: data,
});
