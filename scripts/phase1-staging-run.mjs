/**
 * Staging Phase 1 validation runner (loads .env.staging-validation.tmp).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function loadEnvFile(path, base = process.env) {
  const env = { ...base };
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[t.slice(0, i).trim()] = v;
  }
  return env;
}

function loadStagingEnv() {
  const env = loadEnvFile(".env.staging-validation.tmp");
  if (env.SUPABASE_ANON_KEY && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
  }
  env.SUPABASE_PROJECT_REF = "jbcyewdsoerdiiokhpin";
  for (const key of ["POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL"]) {
    if (env[key]?.includes("******")) delete env[key];
  }
  try {
    const corp = loadEnvFile(".env.corporatecentre.runtime", {});
    if (!env.SUPABASE_ACCESS_TOKEN?.trim() && corp.SUPABASE_ACCESS_TOKEN?.trim()) {
      env.SUPABASE_ACCESS_TOKEN = corp.SUPABASE_ACCESS_TOKEN;
    }
  } catch {
    /* optional */
  }
  // Stale management tokens break `supabase db query --linked`; prefer linked CLI login for schema checks.
  if (!env.DATABASE_URL?.trim() && !env.POSTGRES_URL?.trim()) {
    delete env.SUPABASE_ACCESS_TOKEN;
  }
  return env;
}

const env = loadStagingEnv();
const steps = process.argv.slice(2);
const all = steps.length === 0;

function run(label, cmd, args) {
  console.log(`\n========== ${label} ==========\n`);
  const result = spawnSync(cmd, args, { stdio: "inherit", env, shell: true });
  if ((result.status ?? 1) !== 0) {
    console.error(`FAILED: ${label}`);
    process.exit(result.status ?? 1);
  }
}

if (all || steps.includes("tenancy")) {
  run("prove:workspace-tenancy", "npm", ["run", "prove:workspace-tenancy"]);
}
if (all || steps.includes("audit")) {
  run("audit:tenancy-compat", "npm", ["run", "audit:tenancy-compat"]);
}
if (all || steps.includes("matrix")) {
  run("phase1-staging-matrix", "node", ["scripts/phase1-staging-matrix.mjs"]);
}
if (all || steps.includes("storage")) {
  run("phase1-staging-storage", "node", ["scripts/phase1-staging-storage.mjs"]);
}
if (all || steps.includes("auth")) {
  run("phase1-staging-auth", "node", ["scripts/phase1-staging-auth.mjs"]);
}
if (all || steps.includes("marketing")) {
  run("marketing-probe", "node", ["scripts/phase1-marketing-probe.mjs"]);
}
if (all || steps.includes("portals")) {
  run("test:portals", "npm", ["run", "test:portals"]);
}
if (all || steps.includes("ea")) {
  run("prove:ea-all", "npm", ["run", "prove:ea-all"]);
}
if (all || steps.includes("intelligence")) {
  run("test:intelligence", "npm", ["run", "test:intelligence"]);
}
if (all || steps.includes("tsc")) {
  run("tsc", "npx", ["tsc", "--noEmit"]);
}
if (all || steps.includes("build")) {
  run("build", "npm", ["run", "build"]);
}

console.log("\nStaging validation steps completed.");
