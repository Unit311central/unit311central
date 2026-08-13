import { existsSync, readFileSync } from "node:fs";

for (const file of [".env.unit311central.runtime", ".env.corporatecentre.runtime"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
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
    if (!process.env[key] && value && !value.includes("SENSITIVE")) {
      process.env[key] = value;
    }
  }
}

const { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } = await import(
  "../src/lib/supabase/server.ts"
);

console.log("service role configured", isSupabaseServiceRoleConfigured());
const sb = createSupabaseServiceRoleClient();
const { data, error } = await sb
  .from("financial_expenses")
  .select("id,record_status,reimbursable")
  .limit(1);
console.log("columns_check_error", error?.message || null);
console.log("sample_row", data?.[0] ?? null);
const ws = await sb.from("workspaces").select("id,slug,name").limit(5);
console.log("workspaces_error", ws.error?.message || null);
console.log("workspaces", ws.data);
