import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) process.exit(2);

const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUGS = ["unit311", "demo", "onwardair", "talantonimpact", "abhi"];

console.log("Auth / workspace resolution probe (service role, post-143 foundation RLS)\n");

let failures = 0;
const { data: workspaces, error } = await service.from("workspaces").select("id, slug, name").in("slug", SLUGS);
if (error) {
  console.log("FAIL workspaces:", error.message);
  process.exit(1);
}

for (const slug of SLUGS) {
  const ws = workspaces?.find((w) => w.slug === slug);
  if (!ws) {
    console.log(`FAIL missing workspace ${slug}`);
    failures += 1;
    continue;
  }

  const users = await service.from("platform_users").select("id, username").eq("workspace_id", ws.id).limit(3);
  const modules = await service.from("workspace_modules").select("module_key").eq("workspace_id", ws.id).limit(3);
  const settings = await service
    .from("workspace_settings")
    .select("workspace_id")
    .eq("workspace_id", ws.id)
    .limit(1);

  const uOk = !users.error;
  const mOk = !modules.error;
  const sOk = !settings.error;
  console.log(
    `${slug}: users=${uOk ? users.data?.length ?? 0 : "ERR"} modules=${mOk ? modules.data?.length ?? 0 : "ERR"} settings=${sOk ? settings.data?.length ?? 0 : "ERR"}`,
  );
  if (!uOk || !mOk || !sOk) failures += 1;
}

console.log(`\nAuth probe failures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
