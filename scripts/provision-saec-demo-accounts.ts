/**
 * Provision SAEC client demonstration accounts on production Supabase.
 *
 *   SAEC_DEMO_PASSWORD='...' npx tsx scripts/provision-saec-demo-accounts.ts
 *
 * Or via production internal API (after deploy):
 *   INTERNAL_FILES_SETUP_SECRET + SAEC_DEMO_PASSWORD
 */
import { provisionSaecDemoAccounts } from "../src/lib/saec/provision-demo-accounts";

async function provisionViaProductionApi(password: string): Promise<boolean> {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim() ?? "";
  if (!secret) return false;

  const response = await fetch("https://unit311central.com/api/internal/provision-saec-demo-accounts", {
    method: "POST",
    headers: {
      "x-setup-secret": secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  console.log("production provision API", response.status, JSON.stringify(json, null, 2));
  return response.ok;
}

async function main() {
  const password = process.env.SAEC_DEMO_PASSWORD?.trim();
  if (!password) {
    throw new Error("SAEC_DEMO_PASSWORD is required (never commit this value).");
  }

  if (await provisionViaProductionApi(password)) {
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Set INTERNAL_FILES_SETUP_SECRET (production API) or SUPABASE_ACCESS_TOKEN (direct Supabase).",
    );
  }

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

  const result = await provisionSaecDemoAccounts(password);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
