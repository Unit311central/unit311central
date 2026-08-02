/**
 * ABHI-only: mark 5 member clients as Onboarding with varied progress.
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/seed-abhi-member-onboarding-status.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SEED_TAG = "ABHI onboarding status seed";
const SLUG = "abhi";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    const weak =
      !value ||
      value === "[]" ||
      value.includes("SENSITIVE") ||
      value.startsWith("env_");
    if (!process.env[key] || (!weak && process.env[key]?.includes("SENSITIVE"))) {
      if (!weak) process.env[key] = value;
    }
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));
loadEnv(resolve(process.cwd(), ".env.corporatecentre.runtime"));

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ONBOARDING_PROFILES = [
  {
    provisioningStatus: "provisioning_pending",
    onboardingStage: "payment_received",
    note: "Awaiting membership payment confirmation",
  },
  {
    provisioningStatus: "provisioning",
    onboardingStage: "questionnaire_complete",
    note: "Membership questionnaire complete — provisioning workspace",
  },
  {
    provisioningStatus: "provisioning",
    onboardingStage: "platform_clone_complete",
    note: "Member portal clone in progress",
  },
  {
    provisioningStatus: "provisioning_pending",
    onboardingStage: "review_complete",
    note: "Final review before go-live",
  },
  {
    provisioningStatus: "provisioning",
    onboardingStage: "signed_up",
    note: "New member signup — welcome pack pending",
  },
];

async function main() {
  if (FORBIDDEN.has(SLUG)) throw new Error(`Refusing forbidden slug ${SLUG}`);

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) throw new Error(`ABHI workspace missing: ${wsErr?.message || "not found"}`);
  if (FORBIDDEN.has(ws.slug)) throw new Error(`Refusing protected workspace ${ws.slug}`);

  const workspaceId = ws.id;

  const { data: clients, error: clientErr } = await admin
    .from("internal_clients")
    .select("id, company_name, account_status, notes")
    .eq("workspace_id", workspaceId)
    .neq("account_status", "Archived")
    .order("company_name")
    .limit(5);
  if (clientErr) throw new Error(`internal_clients: ${clientErr.message}`);
  if (!clients?.length) throw new Error("No ABHI internal_clients found to mark Onboarding");

  const updates = clients.map((client, index) => {
    const profile = ONBOARDING_PROFILES[index % ONBOARDING_PROFILES.length];
    const baseNotes = String(client.notes || "").replace(/\s*· ABHI onboarding status seed$/i, "");
    return {
      id: client.id,
      account_status: "Onboarding",
      provisioning_status: profile.provisioningStatus,
      onboarding_stage: profile.onboardingStage,
      notes: `${baseNotes}${baseNotes ? " · " : ""}${profile.note} · ${SEED_TAG}`.trim(),
      updated_at: new Date().toISOString(),
    };
  });

  for (const row of updates) {
    const { error } = await admin
      .from("internal_clients")
      .update({
        account_status: row.account_status,
        provisioning_status: row.provisioning_status,
        onboarding_stage: row.onboarding_stage,
        notes: row.notes,
        updated_at: row.updated_at,
      })
      .eq("id", row.id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(`update ${row.id}: ${error.message}`);
  }

  const { count: onboardingCount } = await admin
    .from("internal_clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("account_status", "Onboarding");

  const { count: activeCount } = await admin
    .from("internal_clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("account_status", "Active");

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        markedOnboarding: updates.length,
        members: updates.map((row) => ({
          id: row.id,
          accountStatus: row.account_status,
          provisioningStatus: row.provisioning_status,
          onboardingStage: row.onboarding_stage,
        })),
        totals: {
          onboarding: onboardingCount,
          active: activeCount,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
