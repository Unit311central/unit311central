/**
 * Talanton Executive Briefing + impact alignment (model vs portal).
 * Run: node --import tsx src/lib/__tests__/talanton-intelligence-briefing.check.ts
 */
import assert from "node:assert/strict";

import { buildImpactTrendSeries } from "@/lib/talanton/board-impact-intelligence";
import {
  buildCompanyImpactProfile,
  buildPortfolioImpactBriefing,
  resolveCompanyImpactId,
} from "@/lib/talanton/impact-intelligence";
import { buildPortfolioExecutiveBriefing } from "@/lib/talanton/portfolio-intelligence";
import { withTalantonPortfolioCompaniesOverride } from "@/lib/talanton/portfolio-companies-runtime";
import { UNAVAILABLE_LABEL } from "@/lib/talanton/intelligence-metric-types";

const impact = buildPortfolioImpactBriefing();
assert.ok((impact.summary.jobsCreated ?? 0) > 0, "portfolio impact must expose jobs total");
assert.ok((impact.summary.peopleServed ?? 0) > 0, "portfolio impact must expose people served total");

const trends = buildImpactTrendSeries(impact);
assert.equal(trends.length, 1, "board impact trends must include current snapshot when totals exist");
assert.ok(trends[0]!.jobsCreated > 0);
assert.ok(trends[0]!.peopleServed > 0);

const companyId = resolveCompanyImpactId(null);
const profile = buildCompanyImpactProfile(companyId);
assert.notEqual(profile.companyName, UNAVAILABLE_LABEL, "default company profile must resolve");
assert.ok(profile.jobsCreated > 0, "company impact UI must receive modelled jobs when no portal submission");
assert.equal(profile.impactMetricsFromSubmission, false);

assert.doesNotThrow(() => buildPortfolioExecutiveBriefing());
const executive = buildPortfolioExecutiveBriefing();
assert.ok(executive.health.portfolioHealthScore > 0, "executive briefing health must be computable");

withTalantonPortfolioCompaniesOverride([], () => {
  const emptyImpact = buildPortfolioImpactBriefing();
  assert.equal(buildImpactTrendSeries(emptyImpact).length, 0);
  assert.doesNotThrow(() => buildPortfolioExecutiveBriefing());
});

console.log("talanton-intelligence-briefing.check.ts ok");
