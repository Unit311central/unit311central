/**
 * Import Tom's historical expenses into the legacy BCN / unit311 internal workspace.
 *
 * Preferred (production):
 *   curl -X POST https://unit311central.com/api/internal/seed-unit311-tom-expenses \
 *     -H "x-setup-secret: $INTERNAL_FILES_SETUP_SECRET"
 *
 * Direct Supabase (local/ops):
 *   SUPABASE_ACCESS_TOKEN=... node --require ./scripts/test-server-only-hook.cjs --import tsx scripts/seed-unit311-tom-expenses.ts
 */
import { seedUnit311TomExpenses } from "../src/lib/unit311/tom-expenses-seed";

async function seedViaProductionApi(): Promise<boolean> {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim() ?? "";
  if (!secret) return false;

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://unit311central.com";
  const response = await fetch(`${origin}/api/internal/seed-unit311-tom-expenses`, {
    method: "POST",
    headers: {
      "x-setup-secret": secret,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  console.log("production seed API", response.status, JSON.stringify(json, null, 2));
  return response.ok;
}

async function configureSupabaseFromAccessToken() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) return false;

  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || "kkxtvzxqmbacjatkiupq";
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!keysResponse.ok) {
    throw new Error(`Failed to fetch Supabase API keys: ${keysResponse.status}`);
  }
  const keys = (await keysResponse.json()) as Array<{ name: string; api_key: string }>;
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  if (!serviceRole) throw new Error("Supabase service_role API key not found.");

  process.env.SUPABASE_URL = `https://${projectRef}.supabase.co`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRole;
  if (!process.env.SUPABASE_ANON_KEY) {
    const anon = keys.find((key) => key.name === "anon")?.api_key;
    if (anon) process.env.SUPABASE_ANON_KEY = anon;
  }
  return true;
}

async function main() {
  if (await seedViaProductionApi()) return;

  const configured = await configureSupabaseFromAccessToken();
  if (!configured) {
    throw new Error(
      "Set INTERNAL_FILES_SETUP_SECRET (production API) or SUPABASE_ACCESS_TOKEN (direct Supabase).",
    );
  }

  const result = await seedUnit311TomExpenses();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
