/**
 * Provision OmniTransit portal internal_clients + verify env password is configured.
 *
 * Portal login uses demo@omnitransit.com with OMNITRANSIT_PORTALS_SHARED_PASSWORD
 * (set in Vercel / runtime env — never commit the password).
 *
 *   node scripts/provision-omnitransit-portals.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnvPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(runtimeEnvPath)
  ? fs.readFileSync(runtimeEnvPath, "utf8")
  : fs.existsSync(path.join(root, ".env.unit311central.prod"))
    ? fs.readFileSync(path.join(root, ".env.unit311central.prod"), "utf8")
    : "";

function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const PORTAL_PASSWORD = env("OMNITRANSIT_PORTALS_SHARED_PASSWORD");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!PORTAL_PASSWORD) {
  console.error(
    "Missing OMNITRANSIT_PORTALS_SHARED_PASSWORD — set in Vercel env or .env.corporatecentre.runtime",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "saec";
const BOARD_CLIENT_ID = "saec-cli-board-portal";
const HYPROP_CLIENT_ID = "saec-cli-hyprop";
const BOARD_URL = "https://omnitransit.unit311.com/board";
const HYPROP_URL = "https://omnitransit.unit311central.com/hyprop";

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("SAEC workspace not found", wsErr?.message);
    process.exit(1);
  }

  const now = new Date().toISOString();

  const upsertClient = async (row) => {
    const { error } = await admin.from("internal_clients").upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
  };

  await upsertClient({
    id: BOARD_CLIENT_ID,
    workspace_id: ws.id,
    company_name: "OmniTransit Board",
    account_status: "Active",
    industry: "Governance",
    region: "Gauteng, South Africa",
    company_country: "South Africa",
    company_city: "Centurion",
    contract_type: "Board Access",
    notes: "OmniTransit Board Portal — external board access (demo)",
    platform_url: BOARD_URL,
    email: "demo@omnitransit.com",
    primary_contact: "OmniTransit Board Member",
    subscription_status: "active",
    created_at: now,
    updated_at: now,
  });

  await upsertClient({
    id: HYPROP_CLIENT_ID,
    workspace_id: ws.id,
    company_name: "Hyprop Investments",
    account_status: "Active",
    industry: "Property & Heritage",
    region: "Gauteng, South Africa",
    company_country: "South Africa",
    company_city: "Johannesburg",
    contract_type: "Retainer",
    notes: "Hyprop client portal — demo customer service access",
    platform_url: HYPROP_URL,
    email: "technical@hyprop.co.za",
    primary_contact: "Pieter van der Merwe",
    subscription_status: "active",
    created_at: now,
    updated_at: now,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        boardPortal: BOARD_URL,
        clientPortal: HYPROP_URL,
        clientName: "Hyprop Investments",
        portalUsername: "demo@omnitransit.com",
        portalPasswordConfigured: true,
        workspaceId: ws.id,
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
