/**
 * Read-only production host verification for Unit311 Central.
 *
 * Usage:
 *   node scripts/verify-production-hosts.mjs
 *   node scripts/verify-production-hosts.mjs --json
 */
import {
  CANONICAL_DEMO_ORIGIN,
  CANONICAL_INTERNAL_ORIGIN,
  CANONICAL_PUBLIC_ORIGIN,
  CANONICAL_SITE_HOST,
} from "./canonical-production-url.mjs";

const USER_AGENT = "unit311-verify-hosts/1";

/** Hosts that must respond on the single unit311central deployment. */
const HOST_CHECKS = [
  {
    id: "apex",
    host: CANONICAL_SITE_HOST,
    path: "/",
    allowedStatus: [200, 301, 302, 307, 308],
  },
  {
    id: "internal-dashboard",
    host: new URL(CANONICAL_INTERNAL_ORIGIN).host,
    path: "/",
    allowedStatus: [200, 302, 307, 308],
    note: "Internal apex rewrites to /internaldashboard",
  },
  {
    id: "internal-login",
    host: new URL(CANONICAL_INTERNAL_ORIGIN).host,
    path: "/login",
    allowedStatus: [200, 302, 307, 308],
    redirectHostIncludes: CANONICAL_SITE_HOST,
    note: "Internal /login canonicalises to apex /login",
  },
  {
    id: "demo",
    host: new URL(CANONICAL_DEMO_ORIGIN).host,
    path: "/login",
    allowedStatus: [200, 302, 307, 308],
    workspaceSlug: "demo",
  },
  {
    id: "onwardair",
    host: "onwardair.unit311central.com",
    path: "/login",
    allowedStatus: [200, 302, 307, 308],
    workspaceSlug: "onwardair",
  },
  {
    id: "talantonimpact",
    host: "talantonimpact.unit311central.com",
    path: "/login",
    allowedStatus: [200, 302, 307, 308],
    workspaceSlug: "talantonimpact",
  },
  {
    id: "talanton-alias",
    host: "talanton.unit311central.com",
    path: "/login",
    allowedStatus: [301, 302, 307, 308],
    redirectHostIncludes: "talantonimpact.unit311central.com",
  },
  {
    id: "abhi",
    host: "abhi.unit311central.com",
    path: "/login",
    allowedStatus: [200, 302, 307, 308],
    workspaceSlug: "abhi",
  },
  {
    id: "wildcard-inheritance",
    host: "futureworkspacex.unit311central.com",
    path: "/login",
    allowedStatus: [200, 302, 307, 308, 404],
    workspaceSlug: "futureworkspacex",
    note: "Wildcard host — same deployment; workspace may not exist in DB yet",
  },
];

async function probe(check) {
  const url = `https://${check.host}${check.path}`;
  const started = Date.now();
  const response = await fetch(url, {
    redirect: "manual",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(25_000),
  });
  const elapsedMs = Date.now() - started;
  const location = response.headers.get("location") ?? "";
  const workspaceSlug = response.headers.get("x-unit311-workspace-slug") ?? "";

  const statusOk = check.allowedStatus.includes(response.status);
  const redirectOk = check.redirectHostIncludes
    ? location.includes(check.redirectHostIncludes)
    : true;
  const slugOk = check.workspaceSlug ? workspaceSlug === check.workspaceSlug : true;

  return {
    id: check.id,
    url,
    status: response.status,
    elapsedMs,
    location: location || null,
    workspaceSlug: workspaceSlug || null,
    ok: statusOk && redirectOk && slugOk,
    errors: [
      !statusOk ? `status ${response.status} not in ${check.allowedStatus.join(",")}` : null,
      !redirectOk ? `location ${location || "(missing)"} missing ${check.redirectHostIncludes}` : null,
      !slugOk
        ? `x-unit311-workspace-slug ${workspaceSlug || "(missing)"} !== ${check.workspaceSlug}`
        : null,
    ].filter(Boolean),
    note: check.note ?? null,
  };
}

const results = [];
for (const check of HOST_CHECKS) {
  try {
    results.push(await probe(check));
  } catch (error) {
    results.push({
      id: check.id,
      url: `https://${check.host}${check.path}`,
      ok: false,
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
}

const json = process.argv.includes("--json");
if (json) {
  console.log(JSON.stringify({ origin: CANONICAL_PUBLIC_ORIGIN, results }, null, 2));
} else {
  console.log(`Unit311 production host verification (${CANONICAL_PUBLIC_ORIGIN})`);
  for (const row of results) {
    const mark = row.ok ? "OK" : "FAIL";
    console.log(`[${mark}] ${row.id}: ${row.url}`);
    if (row.status != null) console.log(`       status=${row.status} slug=${row.workspaceSlug ?? "-"} ${row.location ? `location=${row.location}` : ""}`);
    if (row.note) console.log(`       note: ${row.note}`);
    for (const err of row.errors ?? []) console.log(`       ! ${err}`);
  }
}

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  process.exit(1);
}

console.log(`All ${results.length} host checks passed.`);
