/**
 * Configure Vercel Preview env for Demo EA live verification (PR #16).
 *
 * Scope: Unit311 Central Demo database only (kkxtvzxqmbacjatkiupq).
 * Does NOT touch SAEC or other workspaces.
 *
 * Usage:
 *   VERCEL_API_TOKEN=... SUPABASE_ACCESS_TOKEN=... node scripts/provision-demo-ea-preview-env.mjs
 *   VERCEL_API_TOKEN=... node scripts/provision-demo-ea-preview-env.mjs --redeploy-pr=16
 *
 * After running, redeploy the PR preview (or push an empty commit) so runtime picks up env.
 */
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";

import {
  refuseObsoleteVercelProject,
  UNIT311_VERCEL_PROJECT_ID,
  UNIT311_VERCEL_PROJECT_NAME,
} from "./assert-canonical-unit311-repo.mjs";

const DEMO_SUPABASE_PROJECT_REF = "kkxtvzxqmbacjatkiupq";
const DEMO_SUPABASE_URL = `https://${DEMO_SUPABASE_PROJECT_REF}.supabase.co`;
const TARGET = "preview";

/** Demo EA minimum — same Unit311 Central DB as production Demo host. */
const REQUIRED_KEYS = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_REF",
  "AUTH_SECRET",
];

/** Optional but needed for GPT-Terra live verification. */
const OPTIONAL_KEYS = ["OPENAI_API_KEY", "OPENAI_ASSISTANT_MODEL"];

function parseArgs(argv) {
  const out = { redeployPr: null, dryRun: false };
  for (const arg of argv) {
    if (arg.startsWith("--redeploy-pr=")) out.redeployPr = arg.slice("--redeploy-pr=".length);
    if (arg === "--dry-run") out.dryRun = true;
  }
  return out;
}

function vercelToken() {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  if (!token) {
    console.error("VERCEL_API_TOKEN is required.");
    process.exit(1);
  }
  return token;
}

function api(token, path, method = "GET", body) {
  const url = `https://api.vercel.com${path}`;
  const inputFile = body ? ".preview-env-payload.json" : null;
  if (body) writeFileSync(inputFile, JSON.stringify(body));
  try {
    const args = [
      "curl",
      "-sS",
      "-X",
      method,
      url,
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "Content-Type: application/json",
    ];
    if (body) args.push("-d", `@${inputFile}`);
    const out = execSync(args.join(" "), { encoding: "utf8" });
    const start = Math.min(...["{", "["].map((c) => out.indexOf(c)).filter((i) => i >= 0));
    return JSON.parse(out.slice(start));
  } finally {
    if (inputFile && existsSync(inputFile)) unlinkSync(inputFile);
  }
}

function resolveSupabaseKeys() {
  const raw = execSync(`npx supabase projects api-keys --project-ref ${DEMO_SUPABASE_PROJECT_REF}`, {
    encoding: "utf8",
    shell: true,
  });
  const parsed = JSON.parse(raw);
  const keys = parsed.keys || parsed;
  const anon = keys.find((k) => k.id === "anon" || k.name === "anon");
  const service = keys.find((k) => k.id === "service_role" || k.name === "service_role");
  if (!anon?.api_key?.startsWith("eyJ")) throw new Error("Could not resolve anon key");
  if (!service?.api_key?.startsWith("eyJ")) throw new Error("Could not resolve service_role key");
  return {
    SUPABASE_URL: DEMO_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: DEMO_SUPABASE_URL,
    SUPABASE_ANON_KEY: anon.api_key,
    SUPABASE_SERVICE_ROLE_KEY: service.api_key,
    SUPABASE_PROJECT_REF: DEMO_SUPABASE_PROJECT_REF,
  };
}

function listProjectEnv(token) {
  return api(token, `/v9/projects/${UNIT311_VERCEL_PROJECT_NAME}/env`);
}

function upsertEnv(token, key, value, target = TARGET) {
  const list = listProjectEnv(token);
  const existing = (list.envs ?? []).find(
    (entry) => entry.key === key && (entry.target ?? []).includes(target),
  );
  const payload = {
    key,
    value,
    type: "encrypted",
    target: [target],
  };
  if (existing) {
    api(token, `/v1/projects/${UNIT311_VERCEL_PROJECT_ID}/env/${existing.id}`, "PATCH", payload);
    console.log(`updated ${key} on ${target}`);
    return;
  }
  api(token, `/v10/projects/${UNIT311_VERCEL_PROJECT_ID}/env`, "POST", payload);
  console.log(`created ${key} on ${target}`);
}

function copyProductionValue(token, key) {
  const list = listProjectEnv(token);
  const prod = (list.envs ?? []).find(
    (entry) => entry.key === key && (entry.target ?? []).includes("production"),
  );
  if (!prod) {
    console.warn(`skip copy: production ${key} not found`);
    return null;
  }
  const detail = api(token, `/v1/projects/${UNIT311_VERCEL_PROJECT_ID}/env/${prod.id}`);
  const value = detail.value ?? "";
  if (!value || value.startsWith("env_") || value === "[SENSITIVE]") {
    console.warn(`skip copy: production ${key} is linked/empty`);
    return null;
  }
  return value;
}

function triggerPrRedeploy(token, prNumber) {
  const pr = api(
    token,
    `/v6/deployments?projectId=${UNIT311_VERCEL_PROJECT_ID}&limit=20&target=preview`,
  );
  const deployments = pr.deployments ?? [];
  const match = deployments.find((d) =>
    String(d.meta?.githubCommitRef ?? "").includes("demo-ea-restore"),
  );
  if (!match?.url) {
    console.warn("No recent preview deployment found to redeploy; push a commit or redeploy in Vercel UI.");
    return;
  }
  console.log("Latest preview deployment:", match.url, match.meta?.githubCommitSha?.slice(0, 7));
  if (prNumber) {
    console.log(`Redeploy PR #${prNumber} from Vercel dashboard or push an empty commit after env sync.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = vercelToken();
  refuseObsoleteVercelProject(UNIT311_VERCEL_PROJECT_NAME, "provision-demo-ea-preview-env.mjs");

  console.log("Resolving Unit311 Central Demo Supabase keys (NOT SAEC)…");
  const supabaseValues = resolveSupabaseKeys();

  const values = { ...supabaseValues };
  for (const key of ["AUTH_SECRET", ...OPTIONAL_KEYS]) {
    const copied = copyProductionValue(token, key);
    if (copied) values[key] = copied;
  }

  console.log("\nPreview env plan:");
  for (const key of [...REQUIRED_KEYS, ...OPTIONAL_KEYS]) {
    const present = Boolean(values[key]);
    console.log(`  ${key}: ${present ? "set" : "MISSING"}`);
  }

  const missingRequired = REQUIRED_KEYS.filter((k) => !values[k]);
  if (missingRequired.length) {
    console.error("\nMissing required values:", missingRequired.join(", "));
    console.error("Ensure production has AUTH_SECRET, or pass it manually before re-run.");
    process.exit(1);
  }

  if (args.dryRun) {
    console.log("\nDry run complete — no Vercel changes written.");
    return;
  }

  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    upsertEnv(token, key, value, TARGET);
  }

  console.log("\nPreview env synced for Demo EA verification.");
  triggerPrRedeploy(token, args.redeployPr);
  console.log("\nNext: redeploy PR preview, then verify login and run:");
  console.log("  node scripts/demo-ea-production-verification.mjs https://<preview-url>");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
