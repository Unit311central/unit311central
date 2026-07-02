/**
 * Run from Drone Catalyst project with live Zoho env vars:
 *   cd ../dronecatalyst && npx vercel env run -- node ../barcelonadronecenter/scripts/provision-bcn-zoho-from-env.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bcnRoot = join(__dirname, "..");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const password =
  process.env.ZOHO_INFO_PASSWORD?.trim() ||
  process.env.ZOHO_PAUL_PASSWORD?.trim() ||
  process.env.ZOHO_PASSWORD?.trim() ||
  process.env.ZOHO_APP_PASSWORD?.trim();

if (!password) {
  console.error("ZOHO_INFO_PASSWORD not available in environment.");
  process.exit(1);
}

const pulled = parseEnvFile(join(bcnRoot, ".env.bcn.pull"));
const token = pulled.SUPABASE_ACCESS_TOKEN?.trim();
let projectRef = pulled.SUPABASE_PROJECT_REF?.trim();

if (!projectRef && pulled.SUPABASE_URL) {
  try {
    projectRef = new URL(pulled.SUPABASE_URL).hostname.split(".")[0];
  } catch {
    // ignore
  }
}

if (!token || !projectRef) {
  console.error("Pull BCN env first: cd barcelonadronecenter && npx vercel env pull .env.bcn.pull --environment=production");
  process.exit(1);
}

const rows = [
  { account_id: "info", email: "info@barcelonadronecenter.com" },
  { account_id: "paul", email: "paul.fotheringham@barcelonadronecenter.com" },
];

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  return { status: res.status, data: await res.json() };
}

for (const row of rows) {
  const escaped = password.replace(/'/g, "''");
  const result = await query(`
    insert into public.email_mailbox_credentials (account_id, email, password, updated_at)
    values ('${row.account_id}', '${row.email}', '${escaped}', now())
    on conflict (account_id) do update
      set email = excluded.email,
          password = excluded.password,
          updated_at = now();
  `);
  console.log("supabase", row.account_id, result.status);
}

console.log("BCN Supabase mailbox credentials saved.");
