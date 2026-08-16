/**
 * Production Phase 1 post-migration verification (loads .env.corporatecentre.runtime).
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

function loadProductionEnv() {
  const env = { ...process.env };
  for (const key of [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "SUPABASE_DB_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_PROJECT_REF",
  ]) {
    delete env[key];
  }
  Object.assign(env, loadEnvFile(".env.corporatecentre.runtime", {}));
  env.SUPABASE_PROJECT_REF = "kkxtvzxqmbacjatkiupq";
  if (!env.SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    env.SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY) {
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
  }
  for (const key of ["POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL"]) {
    if (env[key]?.includes("******")) delete env[key];
  }
  delete env.SUPABASE_ACCESS_TOKEN;
  return env;
}

const env = loadProductionEnv();
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

if (all || steps.includes("schema")) {
  run("phase1-staging-replay --verify", "node", ["scripts/phase1-staging-replay.mjs", "--verify"]);
}
if (all || steps.includes("tenancy")) {
  run("prove:workspace-tenancy", "npm", ["run", "prove:workspace-tenancy"]);
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

console.log("\nProduction Phase 1 verification completed.");
