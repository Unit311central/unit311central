/**
 * Unit311 workspace universe — Living Architecture catalogue guardrails.
 * Run: npm run prove:unit311-workspace-universe
 */
import assert from "node:assert/strict";

import { buildWorkspaceArchitectureTaxonomy } from "@/lib/architecture-taxonomy";
import { WORKSPACE_ARCHITECTURE_OPTIONS } from "@/lib/architecture-taxonomy-types";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import {
  TALANTON_HOST_ALIAS_SLUG,
  TALANTON_IMPACT_SLUG,
} from "@/lib/talanton-surface";
import {
  UNIT311_WORKSPACE_UNIVERSE,
  getWorkspaceUniverseEntryByArchitectureId,
  getWorkspaceUniverseEntryBySlug,
  listWorkspaceUniverseSlugs,
} from "@/lib/platform-workspaces/unit311-workspace-universe";

assert.ok(UNIT311_WORKSPACE_UNIVERSE.length >= 11, "universe must list all known tenants");
assert.ok(
  UNIT311_WORKSPACE_UNIVERSE.length > 6,
  "universe must not be limited to the legacy six-workspace catalogue",
);

const slugs = new Set(listWorkspaceUniverseSlugs());
assert.ok(slugs.has(INTERNAL_WORKSPACE_SLUG), "Internal / Unit311 (unit311) required");
assert.ok(slugs.has(TALANTON_IMPACT_SLUG), "Talanton (talantonimpact) required");
assert.ok(slugs.has("demo"), "Northstar demo tenancy required");
assert.ok(slugs.has("abhi"));
assert.ok(slugs.has("saec"), "OmniTransit SAEC slug required");
assert.ok(slugs.has("greendesert"));
assert.ok(slugs.has("interfaceworx"));

const talantonByAlias = getWorkspaceUniverseEntryBySlug(TALANTON_HOST_ALIAS_SLUG);
assert.equal(talantonByAlias?.slug, TALANTON_IMPACT_SLUG, "talanton host alias maps to talantonimpact");

assert.ok(
  !slugs.has("mam") && !getWorkspaceUniverseEntryBySlug("mam"),
  "MAM must not be invented — no runtime workspace evidence in repo",
);

const architectureLabels = buildWorkspaceArchitectureTaxonomy("all").children?.map((c) => c.label) ?? [];
for (const entry of UNIT311_WORKSPACE_UNIVERSE) {
  assert.ok(
    architectureLabels.includes(entry.label),
    `Living Architecture must include ${entry.label}`,
  );
}

assert.ok(
  WORKSPACE_ARCHITECTURE_OPTIONS.some((opt) => opt.id === TALANTON_IMPACT_SLUG),
  "workspace selector must expose Talanton",
);
assert.ok(
  WORKSPACE_ARCHITECTURE_OPTIONS.some((opt) => opt.id === INTERNAL_WORKSPACE_SLUG),
  "workspace selector must expose Unit311 Central",
);

const onlyTalanton = buildWorkspaceArchitectureTaxonomy(TALANTON_IMPACT_SLUG);
assert.equal(onlyTalanton.children?.length, 1);
assert.equal(onlyTalanton.children?.[0]?.label, "Talanton");

assert.ok(getWorkspaceUniverseEntryByArchitectureId("northstar")?.slug === "demo");
assert.ok(getWorkspaceUniverseEntryByArchitectureId("omnitransit")?.slug === "saec");

console.log(
  `prove:unit311-workspace-universe: OK — ${UNIT311_WORKSPACE_UNIVERSE.length} workspaces in universe; Talanton + Internal protected.`,
);
