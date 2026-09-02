/**
 * Reset PAILEX administrator password on production.
 *
 *   PAILEX_ADMIN_PASSWORD='...' node scripts/reset-pailex-admin.mjs
 *
 * Uses INTERNAL_FILES_SETUP_SECRET against the production internal API when set,
 * or SUPABASE_ACCESS_TOKEN for a direct tenancy reset (local/ops).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const PASSWORD = process.env.PAILEX_ADMIN_PASSWORD?.trim() ?? "";
const SECRET = process.env.INTERNAL_FILES_SETUP_SECRET?.trim() ?? "";

if (!PASSWORD) {
  console.error("PAILEX_ADMIN_PASSWORD is required.");
  process.exit(1);
}

async function probeLogin() {
  const login = await fetch("https://pailex.unit311central.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin@pailex.unit311central.com",
      password: PASSWORD,
    }),
  });
  const loginBody = await login.json().catch(() => ({}));
  console.log(
    JSON.stringify(
      {
        loginProbe: {
          status: login.status,
          ok: login.ok,
          error: loginBody.error ?? null,
        },
      },
      null,
      2,
    ),
  );
  if (!login.ok) process.exit(1);
}

async function resetViaProductionApi() {
  if (!SECRET) return false;
  const response = await fetch("https://unit311central.com/api/internal/reset-pailex-admin", {
    method: "POST",
    headers: {
      "x-setup-secret": SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: PASSWORD }),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  console.log(JSON.stringify({ status: response.status, body: json }, null, 2));
  if (!response.ok) process.exit(1);
  await probeLogin();
  return true;
}

async function resetViaSupabaseDirect() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) return false;

  const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || "kkxtvzxqmbacjatkiupq";
  const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!keysResponse.ok) {
    throw new Error(`Failed to fetch Supabase API keys: ${keysResponse.status}`);
  }
  const keys = await keysResponse.json();
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  if (!serviceRole) throw new Error("Supabase service_role API key not found.");

  process.env.SUPABASE_URL = `https://${projectRef}.supabase.co`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRole;

  const { register } = require("tsx/esm/api");
  register();
  const { resetPailexAdminPassword } = await import("../src/lib/pailex/reset-pailex-admin-service.ts");
  const result = await resetPailexAdminPassword(PASSWORD);
  console.log(JSON.stringify(result, null, 2));
  await probeLogin();
  return true;
}

async function main() {
  if (await resetViaProductionApi()) return;
  if (await resetViaSupabaseDirect()) return;
  console.error(
    "Set INTERNAL_FILES_SETUP_SECRET (production API) or SUPABASE_ACCESS_TOKEN (direct Supabase).",
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
