import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const env = {};
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

const env = process.env.SUPABASE_URL
  ? process.env
  : loadEnv(".env.corporatecentre.runtime");
const url = env.SUPABASE_URL;
const anon = env.SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(url, anon);
const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const marketingTables = [
  "marketing_contacts",
  "marketing_campaigns",
  "marketing_newsletters",
];

console.log("Marketing 141 deny-all compatibility probe\n");

for (const table of marketingTables) {
  const anonRead = await anonClient.from(table).select("id").limit(1);
  const serviceRead = await serviceClient.from(table).select("id").limit(1);
  console.log(
    table,
    "anon:",
    anonRead.error ? `blocked (${anonRead.error.code})` : `rows=${anonRead.data?.length ?? 0}`,
    "| service:",
    serviceRead.error ? `error (${serviceRead.error.message})` : `rows=${serviceRead.data?.length ?? 0}`,
  );
}
