import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(filePath) {
  try {
    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* */
  }
}

loadEnv(path.join(root, ".env.vercel.lms"));
loadEnv(path.join(root, ".env.corporatecentre.runtime"));
loadEnv(path.join(root, ".env.unit311central.prod"));
loadEnv(path.join(root, ".env.deploy.pull"));

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = process.env.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";
const sql = readFileSync(
  path.join(root, "supabase/migrations/135_board_directors_compensation.sql"),
  "utf8",
);

async function runQuery(query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

if (!token || token.length < 20) {
  console.error("No SUPABASE_ACCESS_TOKEN — trying supabase CLI linked query");
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-f", "supabase/migrations/135_board_directors_compensation.sql"],
    { cwd: root, encoding: "utf8", shell: true },
  );
  console.log(result.stdout || "");
  console.error(result.stderr || "");
  process.exit(result.status === 0 ? 0 : 1);
}

const applied = await runQuery(sql);
console.log("apply", applied.status, applied.text.slice(0, 800));
if (!applied.ok) process.exit(1);

const verify = await runQuery(`
  select column_name, data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'board_directors'
    and column_name = 'compensation_usd_per_year'
`);
console.log("verify", verify.text);
