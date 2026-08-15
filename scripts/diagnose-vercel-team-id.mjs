import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "https://api.vercel.com";

function resolveTeamId() {
  return process.env.VERCEL_TEAM_ID?.trim() || process.env.VERCEL_ORG_ID?.trim() || "";
}

function resolveTeamSlug() {
  return process.env.VERCEL_TEAM_SLUG?.trim() || "";
}

function loadCliToken() {
  const candidates = [
    join(homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json"),
    join(homedir(), "AppData", "Roaming", "xdg.data", "com.vercel.cli", "auth.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, "utf8"));
    const token = data?.token || data?.credentials?.[0]?.token;
    if (token) return String(token);
  }
  return null;
}

async function probe(token, label, path) {
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text.slice(0, 200);
  }
  return { label, path, status: response.status, body: parsed };
}

const cliToken = loadCliToken();
if (!cliToken) {
  console.error("No local Vercel CLI token found");
  process.exit(1);
}

const teamId = resolveTeamId();
const teamSlug = resolveTeamSlug();
if (!teamId || !teamSlug) {
  console.error("Set VERCEL_TEAM_ID (or VERCEL_ORG_ID) and VERCEL_TEAM_SLUG before running.");
  process.exit(1);
}

console.log("cli_token_length", cliToken.length, "prefix", cliToken.slice(0, 4));

const probes = [
  ["whoami", "/v2/user"],
  ["team slug only", `/v2/teams/${teamSlug}`],
  [
    "production sync endpoint (slug + teamId)",
    `/v2/teams/${teamSlug}?teamId=${encodeURIComponent(teamId)}`,
  ],
  ["list teams", "/v2/teams"],
];

for (const [label, path] of probes) {
  const result = await probe(cliToken, label, path);
  console.log(JSON.stringify(result, null, 2));
}

const teamOnly = await probe(cliToken, "team", `/v2/teams/${teamSlug}`);
if (teamOnly.status === 200 && teamOnly.body?.id) {
  console.log(
    JSON.stringify(
      {
        actualTeamIdFromApi: teamOnly.body.id,
        actualTeamSlugFromApi: teamOnly.body.slug,
        envTeamIdMatches: teamOnly.body.id === teamId,
        envSlugMatches: teamOnly.body.slug === teamSlug,
      },
      null,
      2,
    ),
  );
}
