import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "https://api.vercel.com";
const TEAM_ID =
  process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim() || "";
const TEAM_SLUG = process.env.VERCEL_TEAM_SLUG?.trim() || "";

if (!TEAM_ID || !TEAM_SLUG) {
  console.error("Set VERCEL_TEAM_ID (or VERCEL_ORG_ID) and VERCEL_TEAM_SLUG before running.");
  process.exit(1);
}

function loadCliToken() {
  const candidates = [
    join(homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, "utf8"));
    const token = data?.token || data?.credentials?.[0]?.token;
    if (token) return String(token);
  }
  return process.env.VERCEL_API_TOKEN?.trim() || null;
}

function previousBillingPeriod(currentStartIso, currentEndIso) {
  const start = new Date(currentStartIso).getTime();
  const end = new Date(currentEndIso).getTime();
  const duration = Math.max(end - start, 24 * 60 * 60 * 1000);
  return {
    from: new Date(start - duration).toISOString(),
    to: new Date(start).toISOString(),
  };
}

async function probe(token, label, path, headers = {}) {
  const url = `${API}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  return {
    label,
    url,
    status: response.status,
    contentType: response.headers.get("content-type"),
    lineCount: text.trim() ? text.trim().split("\n").length : 0,
    bodyPreview: text.slice(0, 400),
  };
}

const token = loadCliToken();
if (!token) {
  console.error("No token available");
  process.exit(1);
}

console.log("token_prefix", token.slice(0, 4), "len", token.length);

const teamRes = await probe(
  token,
  "team billing",
  `/v2/teams/${TEAM_SLUG}?teamId=${encodeURIComponent(TEAM_ID)}`,
);
console.log(JSON.stringify(teamRes, null, 2));

let teamPayload;
try {
  teamPayload = JSON.parse(teamRes.bodyPreview.startsWith("{") ? teamRes.bodyPreview : "{}");
} catch {
  teamPayload = {};
}

if (teamRes.status !== 200) {
  const full = await fetch(`${API}/v2/teams/${TEAM_SLUG}?teamId=${encodeURIComponent(TEAM_ID)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  teamPayload = await full.json();
}

const billing = teamPayload.billing ?? {};
const periodStart = billing.period?.start
  ? new Date(billing.period.start).toISOString()
  : null;
const periodEnd = billing.period?.end ? new Date(billing.period.end).toISOString() : null;
const nowIso = new Date().toISOString();
const previous = periodStart && periodEnd ? previousBillingPeriod(periodStart, periodEnd) : null;

console.log(
  JSON.stringify(
    {
      plan: billing.plan,
      periodStartRaw: billing.period?.start,
      periodEndRaw: billing.period?.end,
      periodStart,
      periodEnd,
      nowIso,
      previous,
    },
    null,
    2,
  ),
);

const ranges = [];
if (previous) {
  ranges.push(["sync-previous-period", previous.from, previous.to]);
}
if (periodStart) {
  ranges.push(["sync-current-period", periodStart, nowIso]);
}
ranges.push(["last-7-days", new Date(Date.now() - 7 * 86400000).toISOString(), nowIso]);
ranges.push(["last-30-days", new Date(Date.now() - 30 * 86400000).toISOString(), nowIso]);
ranges.push(["aug-2026-month", "2026-08-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z"]);

for (const [label, from, to] of ranges) {
  const withTeamId = await probe(
    token,
    `${label} (with teamId)`,
    `/v1/billing/charges?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&teamId=${encodeURIComponent(TEAM_ID)}`,
    { Accept: "application/jsonl" },
  );
  console.log(JSON.stringify(withTeamId, null, 2));

  const noTeamId = await probe(
    token,
    `${label} (no teamId)`,
    `/v1/billing/charges?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { Accept: "application/jsonl" },
  );
  console.log(JSON.stringify(noTeamId, null, 2));
}
