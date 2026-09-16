/**
 * Idempotent production provisioning for admin@talantonimpact.com on Talanton Impact.
 * Creates platform_users + workspace_users only — no workspace reseed or unrelated data changes.
 *
 *   node scripts/provision-talanton-admin-user.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { scryptSync } from "node:crypto";
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

const TALANTON_SLUG = "talantonimpact";
const TALANTON_WORKSPACE_ID = "12c0b62b-ce81-4e5d-93b4-f55f588f0b1d";
const EMAIL = "admin@talantonimpact.com";
const DISPLAY_NAME = "Talanton Portals Admin";
const COMPANY = "Talanton Impact";
/** Same shared Talanton portals/platform password convention as provision-talantonimpact.mjs */
const PLATFORM_PASSWORD = merged.TALANTON_ADMIN_PLATFORM_PASSWORD || "Africa1999$";
const MEMBERSHIP_ROLE = "admin";
const MEMBERSHIP_IS_OWNER = true;

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function mgmtQuery(sql) {
  if (!ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN required for management API fallback");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`mgmt SQL failed ${res.status}: ${JSON.stringify(data).slice(0, 800)}`);
  }
  return data;
}

async function readExistingAdmin() {
  const sql = `
    select id, username, email, user_type, workspace_id, is_active
    from public.platform_users
    where lower(username) = lower('${EMAIL}') or lower(email) = lower('${EMAIL}')
    order by created_at
  `;
  if (SERVICE_KEY && SUPABASE_URL) {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: byEmail } = await admin
      .from("platform_users")
      .select("id, username, email, user_type, workspace_id, is_active")
      .eq("email", EMAIL)
      .maybeSingle();
    const { data: byUsername } = await admin
      .from("platform_users")
      .select("id, username, email, user_type, workspace_id, is_active")
      .eq("username", normalizeUsername(EMAIL))
      .maybeSingle();
    const rows = [byEmail, byUsername].filter(Boolean);
    return { rows, adminClient: admin };
  }
  const rows = await mgmtQuery(sql);
  return { rows, adminClient: null };
}

async function ensureMembership(adminClient, userId) {
  if (adminClient) {
    const { data: mem } = await adminClient
      .from("workspace_users")
      .select("id, role, is_owner")
      .eq("workspace_id", TALANTON_WORKSPACE_ID)
      .eq("user_id", userId)
      .maybeSingle();
    if (!mem) {
      const { error } = await adminClient.from("workspace_users").insert({
        workspace_id: TALANTON_WORKSPACE_ID,
        user_id: userId,
        role: MEMBERSHIP_ROLE,
        is_owner: MEMBERSHIP_IS_OWNER,
      });
      if (error) throw new Error(`workspace_users insert: ${error.message}`);
      return "inserted";
    }
    if (mem.role !== MEMBERSHIP_ROLE || mem.is_owner !== MEMBERSHIP_IS_OWNER) {
      const { error } = await adminClient
        .from("workspace_users")
        .update({ role: MEMBERSHIP_ROLE, is_owner: MEMBERSHIP_IS_OWNER })
        .eq("id", mem.id);
      if (error) throw new Error(`workspace_users update: ${error.message}`);
      return "updated";
    }
    return "present";
  }

  const sql = `
    insert into public.workspace_users (workspace_id, user_id, role, is_owner)
    select '${TALANTON_WORKSPACE_ID}'::uuid, '${userId}'::uuid, '${MEMBERSHIP_ROLE}', ${MEMBERSHIP_IS_OWNER}
    where not exists (
      select 1 from public.workspace_users
      where workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid and user_id = '${userId}'::uuid
    );
    update public.workspace_users
    set role = '${MEMBERSHIP_ROLE}', is_owner = ${MEMBERSHIP_IS_OWNER}, updated_at = now()
    where workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid and user_id = '${userId}'::uuid;
  `;
  await mgmtQuery(sql);
  return "ensured";
}

async function main() {
  const username = normalizeUsername(EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, PLATFORM_PASSWORD);
  const now = new Date().toISOString();

  const { rows, adminClient } = await readExistingAdmin();
  const uniqueIds = [...new Set(rows.map((r) => String(r.id)))];
  if (uniqueIds.length > 1) {
    throw new Error(`Refusing: multiple platform_users identities for ${EMAIL}`);
  }

  let userId = uniqueIds[0] ?? null;
  let action = "unchanged";

  const patch = {
    username,
    display_name: DISPLAY_NAME,
    password_hash: passwordHash,
    user_type: "internal",
    redirect_path: "/dashboard",
    client_name: COMPANY,
    is_active: true,
    email: EMAIL,
    email_verified_at: now,
    workspace_id: TALANTON_WORKSPACE_ID,
    updated_at: now,
  };

  if (adminClient) {
    if (userId) {
      const { error } = await adminClient.from("platform_users").update(patch).eq("id", userId);
      if (error) throw new Error(`platform_users update: ${error.message}`);
      action = "updated";
    } else {
      const { data: user, error } = await adminClient
        .from("platform_users")
        .insert(patch)
        .select("id")
        .single();
      if (error) throw new Error(`platform_users insert: ${error.message}`);
      userId = user.id;
      action = "inserted";
    }
  } else if (userId) {
    await mgmtQuery(`
      update public.platform_users set
        username = '${username}',
        display_name = '${DISPLAY_NAME.replace(/'/g, "''")}',
        password_hash = '${passwordHash}',
        user_type = 'internal',
        redirect_path = '/dashboard',
        client_name = '${COMPANY.replace(/'/g, "''")}',
        is_active = true,
        email = '${EMAIL}',
        email_verified_at = '${now}',
        workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid,
        updated_at = '${now}'
      where id = '${userId}'::uuid
    `);
    action = "updated";
  } else {
    const inserted = await mgmtQuery(`
      insert into public.platform_users (
        username, display_name, password_hash, user_type, redirect_path,
        client_name, is_active, email, email_verified_at, workspace_id, created_at, updated_at
      ) values (
        '${username}',
        '${DISPLAY_NAME.replace(/'/g, "''")}',
        '${passwordHash}',
        'internal',
        '/dashboard',
        '${COMPANY.replace(/'/g, "''")}',
        true,
        '${EMAIL}',
        '${now}',
        '${TALANTON_WORKSPACE_ID}'::uuid,
        '${now}',
        '${now}'
      )
      returning id
    `);
    userId = String(inserted[0]?.id ?? "");
    if (!userId) throw new Error("platform_users insert returned no id");
    action = "inserted";
  }

  const membershipAction = await ensureMembership(adminClient, userId);

  const verifyRows = adminClient
    ? (
        await adminClient
          .from("workspace_users")
          .select("role, is_owner, workspace_id, user_id")
          .eq("workspace_id", TALANTON_WORKSPACE_ID)
          .eq("user_id", userId)
          .maybeSingle()
      ).data
    : (
        await mgmtQuery(`
          select wu.role, wu.is_owner, w.slug
          from public.workspace_users wu
          join public.workspaces w on w.id = wu.workspace_id
          where wu.user_id = '${userId}'::uuid and wu.workspace_id = '${TALANTON_WORKSPACE_ID}'::uuid
        `)
      )[0];

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: EMAIL,
        platformUserAction: action,
        userId,
        membershipAction,
        membership: verifyRows,
        talantonWorkspaceId: TALANTON_WORKSPACE_ID,
        talantonSlug: TALANTON_SLUG,
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
