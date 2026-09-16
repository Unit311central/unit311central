/**
 * Idempotent: Talanton workspace owner is admin@talantonimpact.com only.
 * Clears is_owner on David Simms (seed incorrectly marked him owner).
 *
 *   node scripts/fix-talanton-workspace-owner.mjs
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
  ...loadEnvFile(path.join(root, ".env.unit311central.prod")),
  ...loadEnvFile(path.join(root, ".env.corporatecentre.runtime")),
  ...process.env,
};

const SUPABASE_URL = merged.SUPABASE_URL || merged.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = merged.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = merged.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = merged.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";

const TALANTON_WORKSPACE_ID = "12c0b62b-ce81-4e5d-93b4-f55f588f0b1d";
const ADMIN_EMAIL = "admin@talantonimpact.com";
const DAVID_EMAIL = "david-simms@talantonimpact.com";

async function mgmtQuery(sql) {
  if (!ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN required");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`mgmt SQL failed ${res.status}: ${JSON.stringify(data).slice(0, 800)}`);
  return data;
}

async function findUserId(admin, email) {
  const { data: byEmail } = await admin
    .from("platform_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (byEmail?.id) return byEmail.id;
  const { data: byUsername } = await admin
    .from("platform_users")
    .select("id")
    .eq("username", email)
    .maybeSingle();
  return byUsername?.id ?? null;
}

async function main() {
  const admin =
    SERVICE_KEY && SUPABASE_URL
      ? createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  const adminId = admin
    ? await findUserId(admin, ADMIN_EMAIL)
    : (
        await mgmtQuery(`
          select id from public.platform_users
          where lower(email) = lower('${ADMIN_EMAIL}') limit 1
        `)
      )[0]?.id;

  const davidId = admin
    ? await findUserId(admin, DAVID_EMAIL)
    : (
        await mgmtQuery(`
          select id from public.platform_users
          where lower(email) = lower('${DAVID_EMAIL}') limit 1
        `)
      )[0]?.id;

  if (!adminId) throw new Error(`Missing platform user: ${ADMIN_EMAIL}`);
  if (!davidId) throw new Error(`Missing platform user: ${DAVID_EMAIL}`);

  if (admin) {
    const { error: adminMemErr } = await admin
      .from("workspace_users")
      .update({ role: "admin", is_owner: true, updated_at: new Date().toISOString() })
      .eq("workspace_id", TALANTON_WORKSPACE_ID)
      .eq("user_id", adminId);
    if (adminMemErr) throw new Error(`admin membership: ${adminMemErr.message}`);

    const { error: davidMemErr } = await admin
      .from("workspace_users")
      .update({ role: "admin", is_owner: false, updated_at: new Date().toISOString() })
      .eq("workspace_id", TALANTON_WORKSPACE_ID)
      .eq("user_id", davidId);
    if (davidMemErr) throw new Error(`david membership: ${davidMemErr.message}`);
  } else {
    await mgmtQuery(`
      update public.workspace_users
      set role = 'admin', is_owner = true, updated_at = now()
      where workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid and user_id = '${adminId}'::uuid;

      update public.workspace_users
      set role = 'admin', is_owner = false, updated_at = now()
      where workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid and user_id = '${davidId}'::uuid;
    `);
  }

  const owners = admin
    ? (
        await admin
          .from("workspace_users")
          .select("user_id, role, is_owner, platform_users(email)")
          .eq("workspace_id", TALANTON_WORKSPACE_ID)
          .eq("is_owner", true)
      ).data
    : await mgmtQuery(`
        select pu.email, wu.role, wu.is_owner
        from public.workspace_users wu
        join public.platform_users pu on pu.id = wu.user_id
        where wu.workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid and wu.is_owner = true
        order by pu.email
      `);

  console.log(
    JSON.stringify(
      {
        ok: true,
        adminUserId: adminId,
        davidUserId: davidId,
        davidIsOwner: false,
        adminIsOwner: true,
        remainingOwners: owners,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
