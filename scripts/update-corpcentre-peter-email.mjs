/**
 * Rename Peter CorpCentre login to peter@corpcentre.com.au and rehash password.
 * Password remains 12345678$ (hash is salted by username).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scryptSync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

const OLD_EMAIL = "peter-corpcentre@unit311central.com";
const NEW_EMAIL = "peter@corpcentre.com.au";
const PASSWORD = "12345678$";
const WORKSPACE_ID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const username = normalizeUsername(NEW_EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, PASSWORD);

  const { data: existing } = await admin
    .from("platform_users")
    .select("id,email,username,workspace_id")
    .or(`email.eq.${OLD_EMAIL},username.eq.${OLD_EMAIL},email.eq.${NEW_EMAIL},username.eq.${NEW_EMAIL}`)
    .limit(5);

  const peter =
    (existing || []).find((u) => u.email === OLD_EMAIL || u.username === OLD_EMAIL) ||
    (existing || []).find((u) => u.email === NEW_EMAIL || u.username === NEW_EMAIL);

  if (!peter?.id) throw new Error("Peter user not found");

  const { error } = await admin
    .from("platform_users")
    .update({
      email: NEW_EMAIL,
      username,
      password_hash: passwordHash,
      display_name: "Peter Durning",
      is_active: true,
      workspace_id: WORKSPACE_ID,
      redirect_path: "/dashboard",
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", peter.id);

  if (error) throw new Error(error.message);

  // Keep organisation primary email aligned when it still points at the old address.
  await admin
    .from("platform_organisations")
    .update({ primary_email: NEW_EMAIL, updated_at: new Date().toISOString() })
    .eq("primary_email", OLD_EMAIL);

  // Smoke login against production host path (local API shape).
  const res = await fetch("https://corpcentre.unit311central.com/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: NEW_EMAIL,
      password: PASSWORD,
      returnTo: "https://corpcentre.unit311central.com",
    }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(
    JSON.stringify(
      {
        updatedUserId: peter.id,
        email: NEW_EMAIL,
        loginStatus: res.status,
        redirectPath: body.redirectPath,
        error: body.error || null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
