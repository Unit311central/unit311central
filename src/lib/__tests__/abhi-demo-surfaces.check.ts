import assert from "node:assert/strict";

import {
  abhiCompanyIntelligenceRecords,
  abhiMarketIntelligenceRecords,
} from "@/lib/abhi/intelligence-records";
import { searchIntelligenceRecords } from "@/lib/intelligence/provider";
import { isAbhiBankWorkspaceSlug, isWiseTreasuryWorkspaceSlug } from "@/lib/treasury/bank-provider";
import { getAbhiTreasuryCashGbp } from "@/lib/treasury/providers/abhi-bank-simulator";
import { ABHI_CASH_BALANCE_GBP } from "@/lib/abhi-financials";

assert.equal(isAbhiBankWorkspaceSlug("abhi"), true);
assert.equal(isWiseTreasuryWorkspaceSlug("abhi"), true);
assert.equal(getAbhiTreasuryCashGbp(), ABHI_CASH_BALANCE_GBP);

assert.ok(abhiCompanyIntelligenceRecords().length >= 3);
assert.ok(abhiMarketIntelligenceRecords().length >= 3);

async function run() {
  const companySearch = await searchIntelligenceRecords(
    {
      workspaceSlug: "abhi",
      filter: { domainIds: ["company-intelligence"] },
      limit: 50,
      offset: 0,
    },
    {
      access: { roleView: "c-suite", hostSurface: "abhi", isExternal: false, isAdmin: true },
    },
  );
  assert.ok(companySearch.total > 0, "ABHI company intelligence should return records");

  const marketSearch = await searchIntelligenceRecords(
    {
      workspaceSlug: "abhi",
      filter: { domainIds: ["market-intelligence"] },
      limit: 50,
      offset: 0,
    },
    {
      access: { roleView: "c-suite", hostSurface: "abhi", isExternal: false, isAdmin: true },
    },
  );
  assert.ok(marketSearch.total > 0, "ABHI market intelligence should return records");

  console.log("abhi-demo-surfaces.check.ts OK");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
