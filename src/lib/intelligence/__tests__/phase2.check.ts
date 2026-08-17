import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildIntelligenceBriefing,
  searchIntelligenceRecords,
} from "@/lib/intelligence/provider";
import {
  clearIntelligenceRegistryForTests,
  getIntelligencePackBySlug,
  listIntelligenceDomainsForWorkspace,
  listIntelligencePacks,
  matchIntelligenceDomainByView,
  registerIntelligencePack,
} from "@/lib/intelligence/registry";
import type {
  IntelligenceDomainProvider,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";

async function runPhase2Checks() {
  clearIntelligenceRegistryForTests();
  bootstrapIntelligenceWorkspacePacks();

  assert.equal(listIntelligencePacks().length, 4);

  const onward = getIntelligencePackBySlug("onwardair");
  const talanton = getIntelligencePackBySlug("talanton");
  const abhi = getIntelligencePackBySlug("abhi");
  const demo = getIntelligencePackBySlug("demo");

  assert.ok(onward);
  assert.ok(talanton);
  assert.ok(abhi);
  assert.ok(demo);
  assert.equal(listIntelligenceDomainsForWorkspace("demo").length, 3);
  assert.equal(getIntelligencePackBySlug("onward")?.id, "onwardair-intelligence");
  assert.equal(talanton?.slug, "talantonimpact");

  assert.equal(matchIntelligenceDomainByView("onwardair", "oa-competitor-intelligence")?.id, "competitor");
  assert.equal(matchIntelligenceDomainByView("demo", "demo-company-intelligence")?.id, "company-intelligence");

  const competitorSearch = await searchIntelligenceRecords({
    workspaceSlug: "onwardair",
    filter: { domainIds: ["competitor"], search: "joby" },
    limit: 5,
  });
  assert.ok(competitorSearch.total >= 1);
  assert.equal(competitorSearch.records[0]?.workspaceSlug, "onwardair");
  assert.equal(competitorSearch.records[0]?.domainId, "competitor");

  const demoBriefing = await buildIntelligenceBriefing("demo", "company-intelligence");
  assert.equal(demoBriefing.workspaceSlug, "demo");
  assert.equal(demoBriefing.domainId, "company-intelligence");

  clearIntelligenceRegistryForTests();

  const futureProvider: IntelligenceDomainProvider = {
    domainId: "future-domain",
    async searchRecords(ctx) {
      return {
        records: [
          {
            id: "future-1",
            workspaceSlug: ctx.workspaceSlug,
            domainId: "future-domain",
            title: "Future workspace signal",
            summary: "Registered only via pack.",
            severity: "info",
            categories: [],
            tags: [],
          },
        ],
        total: 1,
      };
    },
  };

  const futurePack: IntelligenceWorkspacePackRegistration = {
    id: "futureworkspacex-intelligence",
    slug: "futureworkspacex",
    label: "FutureWorkspaceX Intelligence",
    hostSurface: "internal",
    domains: [{ id: "future-domain", label: "Future Domain" }],
    accessPolicy: {},
    providers: [futureProvider],
  };

  registerIntelligencePack(futurePack);

  const futureResult = await searchIntelligenceRecords({
    workspaceSlug: "futureworkspacex",
    filter: { domainIds: ["future-domain"] },
  });
  assert.equal(futureResult.total, 1);
  assert.equal(futureResult.records[0]?.workspaceSlug, "futureworkspacex");

  const l1Files = ["registry.ts", "provider.ts", "access.ts", "isolation.ts", "types.ts"];
  const forbidden = [
    'workspace === "abhi"',
    'workspace === "talanton"',
    'workspace === "onwardair"',
    'workspaceSlug === "abhi"',
    'workspaceSlug === "talanton"',
    'workspaceSlug === "onwardair"',
  ];
  for (const file of l1Files) {
    const source = readFileSync(join(process.cwd(), "src/lib/intelligence", file), "utf8");
    for (const pattern of forbidden) {
      assert.equal(
        source.includes(pattern),
        false,
        `${file} must not contain workspace branch: ${pattern}`,
      );
    }
  }

  clearIntelligenceRegistryForTests();
}

runPhase2Checks()
  .then(() => {
    console.log("intelligence/phase2.check.ts: all assertions passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
