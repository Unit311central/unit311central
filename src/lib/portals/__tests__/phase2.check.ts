import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  clearPortalRegistryForTests,
  getPortalPackBySlug,
  isPortalWorkspaceSlug,
  listPortalWorkspacePacks,
  matchPortalPathnameForSlug,
  registerPortalPack,
} from "@/lib/portals/registry";
import type { PortalWorkspacePack } from "@/lib/portals/types";
import { bootstrapPortalWorkspacePacks } from "@/lib/portals/workspace-packs";

function noopSanitize(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return { majorModules: [], customModules: [] };
  }
  const body = raw as { majorModules?: unknown; customModules?: unknown };
  return {
    majorModules: Array.isArray(body.majorModules) ? body.majorModules : [],
    customModules: Array.isArray(body.customModules) ? body.customModules : [],
  };
}

clearPortalRegistryForTests();
bootstrapPortalWorkspacePacks();

assert.equal(listPortalWorkspacePacks().length, 3);
assert.equal(getPortalPackBySlug("onward")?.slug, "onwardair");
assert.equal(getPortalPackBySlug("talanton")?.slug, "talantonimpact");
assert.equal(isPortalWorkspaceSlug("unit311"), false);
assert.equal(isPortalWorkspaceSlug("demo"), false);

const futurePack: PortalWorkspacePack = {
  slug: "futureworkspacex",
  slugAliases: ["future"],
  implBase: "/future-portal",
  publicPathPrefix: "",
  origin: "https://futureworkspacex.unit311central.com",
  routes: [
    {
      path: "acme",
      displayName: "Acme Portal",
      clientId: "fwx-cli-acme",
      username: "demo@acme.example",
      redirectPath: "/acme",
      portalKind: "client",
    },
  ],
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: false,
  },
  matcher: {
    matchPathname(pathname: string) {
      const normalized = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
      const route = futurePack.routes.find((entry) => entry.path === normalized);
      if (!route) return null;
      const rest = pathname.slice(normalized.length + 1);
      return { route, rest: rest ? `/${rest.replace(/^\/+/, "")}` : "" };
    },
    getRouteByPath(path) {
      const normalized = String(path ?? "")
        .replace(/^\/+/, "")
        .split("/")[0];
      return futurePack.routes.find((entry) => entry.path === normalized) ?? null;
    },
    getRouteByClientId(clientId) {
      return futurePack.routes.find((entry) => entry.clientId === clientId) ?? null;
    },
    absoluteUrl(route) {
      return `${futurePack.origin}/${route.path}`;
    },
  },
  briefing: {
    isAllowedUsername: (username) => username === "demo@futureworkspacex.com",
    isAdminUsername: (username) => username === "admin@futureworkspacex.com",
    loginPath: "/login?next=/portals",
    usesDedicatedPortalsLogin: false,
    contentTable: "futureworkspacex_portals_page_content",
    defaultContent: () => ({ majorModules: [], customModules: [] }),
    sanitizeContent: noopSanitize,
  },
};

registerPortalPack(futurePack);

assert.equal(listPortalWorkspacePacks().length, 4);
assert.equal(getPortalPackBySlug("future")?.slug, "futureworkspacex");
assert.equal(isPortalWorkspaceSlug("futureworkspacex"), true);

const futureMatch = matchPortalPathnameForSlug("futureworkspacex", "/acme/reports");
assert.ok(futureMatch);
assert.equal(futureMatch?.route.path, "acme");
assert.equal(futureMatch?.rest, "/reports");

const registrySource = readFileSync(
  join(process.cwd(), "src/lib/portals/registry.ts"),
  "utf8",
);
assert.ok(!registrySource.includes('workspaceSlug === "abhi"'));
assert.ok(!registrySource.includes('workspaceSlug === "onwardair"'));
assert.ok(!registrySource.includes("isOnwardAirSlug"));
assert.ok(!registrySource.includes("isTalantonImpactSlug"));
assert.ok(!registrySource.includes("ABHI_SLUG"));

console.log("portals/phase2.check.ts: all assertions passed");
