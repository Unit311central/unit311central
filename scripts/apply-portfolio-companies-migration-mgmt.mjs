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
const sql = readFileSync(path.join(root, "supabase/migrations/130_portfolio_companies.sql"), "utf8");

if (!token || token.length < 20) {
  console.error("No SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);

const text = await response.text();
console.log("status", response.status);
console.log(text.slice(0, 2000));
if (!response.ok) process.exit(1);

const verify = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query:
        "select table_name from information_schema.tables where table_schema='public' and table_name='portfolio_companies'",
    }),
  },
);
console.log("verify", await verify.text());
