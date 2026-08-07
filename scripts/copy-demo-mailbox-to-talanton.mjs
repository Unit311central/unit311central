/**
 * Copy demo@unit311central.com Zoho credentials from OnwardAir onto Talanton Impact.
 *
 *   node scripts/copy-demo-mailbox-to-talanton.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

const merged = {
  ...loadEnvFile(path.join(root, ".env.deploy.pull")),
  ...loadEnvFile(path.join(root, ".env.unit311central.prod")),
  ...loadEnvFile(path.join(root, ".env.corporatecentre.runtime")),
};

const SUPABASE_URL = merged.SUPABASE_URL || merged.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = merged.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SOURCE_SLUGS = ["onwardair", "demo", "abhi"];
const TARGET_SLUG = "talantonimpact";
const ACCOUNT_ID = "demo";

async function workspaceBySlug(slug) {
  const { data, error } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`${slug}: ${error.message}`);
  return data;
}

async function main() {
  const target = await workspaceBySlug(TARGET_SLUG);
  if (!target?.id) throw new Error(`Missing workspace ${TARGET_SLUG}`);
  console.log("Target", target.slug, target.id);

  let sourceCred = null;
  let sourceSlug = null;
  for (const slug of SOURCE_SLUGS) {
    const ws = await workspaceBySlug(slug);
    if (!ws?.id) {
      console.log(`Skip ${slug}: workspace not found`);
      continue;
    }
    const { data, error } = await admin
      .from("email_mailbox_credentials")
      .select("account_id, email, password, workspace_id")
      .eq("workspace_id", ws.id)
      .eq("account_id", ACCOUNT_ID)
      .maybeSingle();
    if (error) {
      console.warn(`${slug} creds error:`, error.message);
      continue;
    }
    if (data?.password) {
      sourceCred = data;
      sourceSlug = slug;
      break;
    }
    console.log(`No demo mailbox creds on ${slug}`);
  }

  const envPassword =
    merged.ZOHO_DEMO_PASSWORD ||
    merged.ZOHO_PASSWORD ||
    merged.ZOHO_APP_PASSWORD ||
    "";

  const email = sourceCred?.email || "demo@unit311central.com";
  const password = sourceCred?.password || envPassword.trim();
  if (!password) {
    throw new Error("No demo mailbox password found in OnwardAir/Demo/ABHI DB or ZOHO_* env");
  }

  console.log(
    sourceCred
      ? `Using password from ${sourceSlug} DB row (${email}, len=${password.length})`
      : `Using ZOHO env password for ${email} (len=${password.length})`,
  );

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("email_mailbox_credentials")
    .upsert(
      {
        workspace_id: target.id,
        account_id: ACCOUNT_ID,
        email,
        password,
        updated_at: now,
      },
      { onConflict: "workspace_id,account_id" },
    )
    .select("account_id, email, workspace_id, updated_at")
    .single();

  if (error) throw new Error(`upsert: ${error.message}`);
  console.log("Upserted Talanton demo mailbox credentials:", data);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
