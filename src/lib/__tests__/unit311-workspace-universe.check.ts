/**
 * Unit311 workspace universe — Living Architecture catalogue guardrails.
 * Run: npm run prove:unit311-workspace-universe
 */
import assert from "node:assert/strict";

import { buildWorkspaceArchitectureTaxonomy } from "@/lib/architecture-taxonomy";
import { WORKSPACE_ARCHITECTURE_OPTIONS } from "@/lib/architecture-taxonomy-types";
import { MAM_SLUG } from "@/lib/mam/mam-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import {
  TALANTON_HOST_ALIAS_SLUG,
  TALANTON_IMPACT_SLUG,
} from "@/lib/talanton-surface";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import {
  WORKSPACE_ARCHITECTURE_REGISTRY_COUNT,
  UNIT311_WORKSPACE_UNIVERSE,
  countWorkspaceArchitectureByLifecycle,
  getWorkspaceUniverseEntryByArchitectureId,
  getWorkspaceUniverseEntryBySlug,
  listWorkspaceUniverseSlugs,
} from "@/lib/platform-workspaces/unit311-workspace-universe";

assert.equal(WORKSPACE_ARCHITECTURE_REGISTRY_COUNT, 13);
assert.equal(UNIT311_WORKSPACE_UNIVERSE.length, 13);

const lifecycleCounts = countWorkspaceArchitectureByLifecycle();
assert.equal(lifecycleCounts.active, 4);
assert.equal(lifecycleCounts.potential, 7);
assert.equal(lifecycleCounts.archived, 2);

const slugs = new Set(listWorkspaceUniverseSlugs());
assert.ok(slugs.has(INTERNAL_WORKSPACE_SLUG), "Internal / Unit311 (unit311) required");
assert.ok(slugs.has(TALANTON_IMPACT_SLUG), "Talanton (talantonimpact) required");
assert.ok(slugs.has(WOLF_CENTRAL_SLUG), "WOLF Central required");
assert.ok(slugs.has(MAM_SLUG), "MAM workspace slug required");
assert.ok(slugs.has("demo"), "Northstar demo tenancy required");
assert.ok(slugs.has("abhi"));
assert.ok(slugs.has("saec"), "OmniTransit SAEC slug required");
assert.ok(slugs.has("greendesert"));
assert.ok(slugs.has("interfaceworx"));

const talantonByAlias = getWorkspaceUniverseEntryBySlug(TALANTON_HOST_ALIAS_SLUG);
assert.equal(talantonByAlias?.slug, TALANTON_IMPACT_SLUG, "talanton host alias maps to talantonimpact");

const mamEntry = getWorkspaceUniverseEntryBySlug(MAM_SLUG);
assert.equal(mamEntry?.lifecycle, "potential");
assert.equal(mamEntry?.architectureId, MAM_SLUG);

const tree = buildWorkspaceArchitectureTaxonomy("all");
const workspaceLabels = (tree.children ?? []).flatMap((group) =>
  (group.children ?? []).map((node) => node.label),
);
for (const entry of UNIT311_WORKSPACE_UNIVERSE) {
  assert.ok(
    workspaceLabels.includes(entry.label),
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
assert.ok(
  WORKSPACE_ARCHITECTURE_OPTIONS.some((opt) => opt.id === MAM_SLUG),
  "workspace selector must expose MAM",
);

const onlyTalanton = buildWorkspaceArchitectureTaxonomy(TALANTON_IMPACT_SLUG);
assert.equal(onlyTalanton.children?.length, 1);
assert.equal(onlyTalanton.children?.[0]?.label, "POTENTIAL");
assert.equal(onlyTalanton.children?.[0]?.children?.[0]?.label, "Talanton");

assert.ok(getWorkspaceUniverseEntryByArchitectureId("northstar")?.slug === "demo");
assert.ok(getWorkspaceUniverseEntryByArchitectureId("omnitransit")?.slug === "saec");

console.log(
  `prove:unit311-workspace-universe: OK — ${WORKSPACE_ARCHITECTURE_REGISTRY_COUNT} workspaces (4 Active / 7 Potential / 2 Archived); MAM + WOLF in registry.`,
);
