import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing staging Supabase env");
  process.exit(2);
}

const anon = createClient(url, anonKey);
const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: workspaces, error } = await service
  .from("workspaces")
  .select("id, slug")
  .in("slug", ["unit311", "demo"]);
if (error) throw error;

const unit311 = workspaces?.find((w) => w.slug === "unit311");
const demo = workspaces?.find((w) => w.slug === "demo");
if (!unit311 || !demo) throw new Error("Need unit311 and demo workspaces");

const bucket = "internal-files";
const pathA = `${unit311.id}/objects/phase1-staging-test-${Date.now()}.txt`;
const pathB = `${demo.id}/objects/phase1-staging-test-${Date.now()}.txt`;
const body = new Blob(["phase1 staging storage probe"], { type: "text/plain" });

console.log("Storage probe on", new URL(url).host);

let failures = 0;
function fail(msg) {
  console.log("FAIL:", msg);
  failures += 1;
}
function pass(msg) {
  console.log("PASS:", msg);
}

// Service upload workspace-prefixed path
{
  const { error: upErr } = await service.storage.from(bucket).upload(pathA, body, { upsert: true });
  if (upErr) fail(`service upload ${pathA}: ${upErr.message}`);
  else pass(`service upload ${pathA}`);
}

// Signed URL download (service)
let signedUrl = "";
{
  const { data, error: signErr } = await service.storage.from(bucket).createSignedUrl(pathA, 120);
  if (signErr || !data?.signedUrl) fail(`signed url create: ${signErr?.message ?? "no url"}`);
  else {
    signedUrl = data.signedUrl;
    const res = await fetch(signedUrl);
    if (!res.ok) fail(`signed url fetch ${res.status}`);
    else pass("signed url download");
  }
}

// Anon cross-workspace list/read should be blocked or empty
{
  const list = await anon.storage.from(bucket).list(`${demo.id}/objects`, { limit: 5 });
  const status = list.error ? "blocked" : (list.data?.length ?? 0) === 0 ? "empty" : "LEAK";
  if (status === "LEAK") fail(`anon cross-workspace list demo: ${list.data?.length} items`);
  else pass(`anon cross-workspace list demo: ${status}`);
}

{
  const dl = await anon.storage.from(bucket).download(pathA);
  if (!dl.error && dl.data) fail("anon download other workspace path succeeded");
  else pass(`anon download other workspace: ${dl.error ? "blocked" : "empty"}`);
}

// Service delete
{
  const { error: delErr } = await service.storage.from(bucket).remove([pathA]);
  if (delErr) fail(`service delete: ${delErr.message}`);
  else pass("service delete workspace object");
}

// Legacy path without workspace prefix — signed URL should still work if object exists; probe upload legacy style
const legacyPath = `legacy-phase1-probe-${Date.now()}.txt`;
{
  const { error: legacyUp } = await service.storage.from(bucket).upload(legacyPath, body, { upsert: true });
  if (legacyUp) {
    pass(`legacy path upload skipped (${legacyUp.message})`);
  } else {
    const { data, error: signErr } = await service.storage.from(bucket).createSignedUrl(legacyPath, 60);
    if (signErr) fail(`legacy signed url: ${signErr.message}`);
    else pass("legacy signed url compatibility");
    await service.storage.from(bucket).remove([legacyPath]);
  }
}

console.log(`\nStorage failures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);
