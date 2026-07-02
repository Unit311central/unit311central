import { existsSync, readFileSync } from "node:fs";

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

const password = process.argv[2]?.trim();
if (!password) {
  console.error("Usage: node scripts/save-bcn-zoho-credentials.mjs <app-password>");
  process.exit(1);
}

const pulled = parseEnvFile(".env.bcn.pull");
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() || pulled.SUPABASE_ACCESS_TOKEN?.trim();
let projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() || pulled.SUPABASE_PROJECT_REF?.trim();

if (!projectRef && (process.env.SUPABASE_URL || pulled.SUPABASE_URL)) {
  try {
    projectRef = new URL(process.env.SUPABASE_URL || pulled.SUPABASE_URL).hostname.split(".")[0];
  } catch {
    // ignore
  }
}

if (!token || !projectRef) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF");
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
  console.log(row.account_id, result.status, JSON.stringify(result.data));
}
