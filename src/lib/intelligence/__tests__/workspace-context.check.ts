/**
 * Intelligence workspace host resolution — central tenancy alignment.
 * Run: node --import tsx src/lib/intelligence/__tests__/workspace-context.check.ts
 */
import assert from "node:assert/strict";

import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";
import { getIntelligencePackBySlug } from "@/lib/intelligence/registry";
import {
  resolveIntelligencePackSlugForWorkspace,
  resolveIntelligenceWorkspaceSlugFromHost,
  resolveWorkspaceSlugFromHost,
} from "@/lib/intelligence/workspace-context";
import { SAEC_SLUG } from "@/lib/saec-surface";

bootstrapIntelligenceWorkspacePacks();

assert.equal(resolveWorkspaceSlugFromHost("internal.unit311central.com"), "unit311");
assert.equal(resolveWorkspaceSlugFromHost("demo.unit311central.com"), "demo");
assert.equal(resolveWorkspaceSlugFromHost("onwardair.unit311central.com"), "onwardair");
assert.equal(resolveWorkspaceSlugFromHost("talanton.unit311central.com"), "talanton");
assert.equal(resolveWorkspaceSlugFromHost("talantonimpact.unit311central.com"), "talantonimpact");
assert.equal(resolveWorkspaceSlugFromHost("abhi.unit311central.com"), "abhi");
assert.equal(resolveWorkspaceSlugFromHost("omnitransit.unit311central.com"), SAEC_SLUG);
assert.equal(resolveWorkspaceSlugFromHost("saec.unit311central.com"), SAEC_SLUG);

assert.equal(resolveIntelligenceWorkspaceSlugFromHost("internal.unit311central.com"), null);
assert.equal(resolveIntelligenceWorkspaceSlugFromHost("demo.unit311central.com"), "demo");
assert.equal(resolveIntelligenceWorkspaceSlugFromHost("onwardair.unit311central.com"), "onwardair");
assert.equal(resolveIntelligenceWorkspaceSlugFromHost("talantonimpact.unit311central.com"), "talantonimpact");
assert.equal(resolveIntelligenceWorkspaceSlugFromHost("abhi.unit311central.com"), "abhi");
assert.equal(resolveIntelligenceWorkspaceSlugFromHost("omnitransit.unit311central.com"), SAEC_SLUG);

assert.equal(resolveIntelligencePackSlugForWorkspace("unit311"), null);
assert.equal(resolveIntelligencePackSlugForWorkspace("demo"), "demo");
assert.equal(resolveIntelligencePackSlugForWorkspace("onwardair"), "onwardair");
assert.equal(resolveIntelligencePackSlugForWorkspace("talantonimpact"), "talantonimpact");
assert.equal(resolveIntelligencePackSlugForWorkspace("abhi"), "abhi");
assert.equal(resolveIntelligencePackSlugForWorkspace("onwardair"), "onwardair");
assert.equal(resolveIntelligencePackSlugForWorkspace("talanton"), "talantonimpact");
assert.equal(resolveIntelligencePackSlugForWorkspace("omnitransit"), SAEC_SLUG);
assert.equal(resolveIntelligencePackSlugForWorkspace(SAEC_SLUG), SAEC_SLUG);

const omnitransitPack = getIntelligencePackBySlug(SAEC_SLUG);
assert.equal(omnitransitPack?.id, "saec-intelligence");

console.log("intelligence/workspace-context.check.ts: all assertions passed");
