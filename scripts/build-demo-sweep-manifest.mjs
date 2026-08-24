/**
 * Build sweep manifest from central module catalogue + Demo whoami enablement.
 * Usage: node --import tsx scripts/build-demo-sweep-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { resolveWorkspaceNavEnablement } from "../src/lib/platform-workspaces/workspace-product-nav.ts";
import {
  getWorkspaceModuleEntry,
  parseSubModuleKey,
} from "../src/lib/platform-workspaces/module-catalogue.ts";

const ORIGIN = (process.argv[2] ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const OUT = "/opt/cursor/artifacts/demo-browser-sweep/sweep-manifest.json";

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];
  return list.map((raw) => raw.split(";")[0]).filter(Boolean).join("; ");
}

/** Demo-released leaves reachable in nav but absent from workspace submodule metadata. */
const DEMO_SUPPLEMENTAL_VIEWS = [
  {
    module: "TECH MGMT",
    moduleId: "technology-management",
    subModule: "Telecommunications",
    subModuleId: "technology-telecommunications",
    view: "technology-telecommunications",
  },
];

function appendSupplemental(rows, enablement) {
  const seen = new Set(rows.map((row) => row.view));
  for (const extra of DEMO_SUPPLEMENTAL_VIEWS) {
    if (!enablement.enabledModules.includes(extra.moduleId)) continue;
    if (seen.has(extra.view)) continue;
    rows.push({
      ...extra,
      url: `${ORIGIN}/dashboard?view=${encodeURIComponent(extra.view)}`,
    });
    seen.add(extra.view);
  }
}

async function main() {
  const login = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const cookie = cookieHeader(login.headers.getSetCookie?.() ?? []);
  const whoami = await fetch(`${ORIGIN}/api/auth/whoami`, { headers: { Cookie: cookie } }).then(
    (r) => r.json(),
  );

  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: whoami.workspaceSlug,
    workspaceType: "demo",
    enabledModules: whoami.enabledModules,
    enabledSubModules: whoami.enabledSubModules,
  });

  const rows = [];
  for (const key of enablement.enabledSubModules) {
    const parsed = parseSubModuleKey(key);
    if (!parsed) continue;
    const entry = getWorkspaceModuleEntry(parsed.moduleId);
    const sub = entry?.subModules.find((s) => s.id === parsed.subModuleId);
    const view = sub?.viewId ?? parsed.subModuleId;
    rows.push({
      module: entry?.label ?? parsed.moduleId,
      moduleId: parsed.moduleId,
      subModule: sub?.label ?? parsed.subModuleId,
      subModuleId: parsed.subModuleId,
      view,
      url: `${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`,
    });
  }

  appendSupplemental(rows, enablement);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} sweep rows to ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
