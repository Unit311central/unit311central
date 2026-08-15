const VERCEL_API_BASE = "https://api.vercel.com";

function getVercelApiToken() {
  return process.env.VERCEL_API_TOKEN?.trim() || null;
}
function getVercelTeamId() {
  return (
    process.env.VERCEL_TEAM_ID?.trim() ||
    process.env.VERCEL_ORG_ID?.trim() ||
    null
  );
}
function getVercelTeamSlug() {
  return process.env.VERCEL_TEAM_SLUG?.trim() || null;
}

const token = getVercelApiToken();
const teamId = getVercelTeamId();
const teamSlug = getVercelTeamSlug();

function redact(value) {
  if (!value) return { present: false, length: 0, prefix: "" };
  return { present: true, length: value.length, prefix: value.slice(0, 4) };
}

console.log("=== Resolved production config (no secrets) ===");
console.log(
  JSON.stringify(
    {
      VERCEL_API_TOKEN: redact(token),
      VERCEL_TEAM_ID_env: redact(process.env.VERCEL_TEAM_ID?.trim()),
      VERCEL_ORG_ID_env: redact(process.env.VERCEL_ORG_ID?.trim()),
      VERCEL_TEAM_SLUG_env: redact(process.env.VERCEL_TEAM_SLUG?.trim()),
      resolvedTeamId: teamId,
      resolvedTeamSlug: teamSlug,
      teamConfigured: Boolean(teamId && teamSlug),
    },
    null,
    2,
  ),
);

if (!token) {
  console.error("VERCEL_API_TOKEN missing in process env");
  process.exit(1);
}

async function probe(label, path) {
  const url = `${VERCEL_API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await response.text();
  console.log(
    JSON.stringify({
      label,
      method: "GET",
      url,
      status: response.status,
      bodyPreview: text.slice(0, 300),
    }),
  );
}

console.log("\n=== API probes ===");
await probe(
  "sync-first-call team billing",
  `/v2/teams/${encodeURIComponent(teamSlug)}?teamId=${encodeURIComponent(teamId)}`,
);
await probe(
  "team billing without teamId query",
  `/v2/teams/${encodeURIComponent(teamSlug)}`,
);
await probe("list teams", "/v2/teams");
await probe("auth whoami", "/v2/user");
