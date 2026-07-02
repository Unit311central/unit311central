import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectName = process.env.SUPABASE_PROJECT_NAME ?? "barcelonadronecenter";

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

async function api(path, options = {}) {
  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

async function waitForHealthy(ref, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    const health = await api(`/projects/${ref}/health?services=db`);
    const db = Array.isArray(health)
      ? health.find((entry) => entry.name === "db")
      : null;
    if (db?.status === "ACTIVE_HEALTHY") return;
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  throw new Error(`Project ${ref} did not become healthy in time`);
}

async function query(ref, sql) {
  return api(`/projects/${ref}/database/query`, {
    method: "POST",
    body: JSON.stringify({ query: sql }),
  });
}

function migrationFiles() {
  return readdirSync(join(process.cwd(), "supabase/migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function main() {
  const orgs = await api("/organizations");
  const org = orgs[0];
  if (!org?.id) throw new Error("No Supabase organization found");

  const dbPass = process.env.SUPABASE_DB_PASS ?? randomBytes(18).toString("base64url");

  let project;
  const existing = await api("/projects");
  project = existing.find((entry) => entry.name === projectName);

  if (!project) {
    project = await api("/projects", {
      method: "POST",
      body: JSON.stringify({
        organization_id: org.id,
        name: projectName,
        db_pass: dbPass,
        region: "eu-west-2",
      }),
    });
    console.log(`Created Supabase project: ${project.id}`);
  } else {
    console.log(`Using existing Supabase project: ${project.id}`);
  }

  await waitForHealthy(project.id);

  const keys = await api(`/projects/${project.id}/api-keys?reveal=true`);
  const anonKey =
    keys.find((entry) => entry.name === "anon")?.api_key ??
    keys.find((entry) => entry.type === "legacy" && entry.name === "anon")?.api_key;
  if (!anonKey) throw new Error("Could not resolve anon API key");

  for (const file of migrationFiles()) {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations", file), "utf8");
    await query(project.id, sql);
    await query(project.id, "notify pgrst, 'reload schema'");
    console.log(`Applied migration: ${file}`);
  }

  const output = {
    SUPABASE_URL: `https://${project.id}.supabase.co`,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_PROJECT_REF: project.id,
    SUPABASE_DB_PASS: dbPass,
  };

  console.log(JSON.stringify(output));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
