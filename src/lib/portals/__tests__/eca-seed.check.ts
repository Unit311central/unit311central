import assert from "node:assert/strict";

import { buildEcaPortalConfigsForWorkspace } from "@/lib/portals/eca-seed";

const abhi = buildEcaPortalConfigsForWorkspace("abhi");
assert.ok(abhi.length > 0);
assert.ok(abhi.every((row) => row.portalUrl?.includes("abhi.unit311central.com")));
assert.ok(abhi.every((row) => !row.portalUrl?.includes("/board")));

const onward = buildEcaPortalConfigsForWorkspace("onwardair");
assert.equal(onward.length, 1);
assert.ok(onward[0].portalUrl?.includes("coastalfreightpartners.com"));

const talanton = buildEcaPortalConfigsForWorkspace("talantonimpact");
assert.ok(talanton.length >= 10);
assert.ok(talanton.every((row) => row.portalUrl?.includes("talantonimpact.unit311central.com")));

assert.equal(buildEcaPortalConfigsForWorkspace("demo").length, 0);
assert.equal(buildEcaPortalConfigsForWorkspace("unit311").length, 0);

console.log("portals/eca-seed.check.ts: all assertions passed");
