import "server-only";

import { listPortfolioCompanies } from "@/lib/talanton/portfolio-companies-service";
import {
  flattenGovernanceActions,
  withTalantonIntelligenceContextOverrideAsync,
  type TalantonIntelligenceContext,
} from "@/lib/talanton/talanton-intelligence-context";
import {
  withTalantonPortfolioCompaniesOverrideAsync,
} from "@/lib/talanton/portfolio-companies-runtime";
import {
  ensureGovernanceMeetings,
  ensureGovernanceRisks,
} from "@/lib/talanton/workspace-governance-service";

/** Load Supabase portfolio companies for a workspace, then run intelligence builders. */
export async function withTalantonPortfolioFromWorkspace<T>(
  workspaceId: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  return withTalantonIntelligenceFromWorkspace(workspaceId, "", fn);
}

/** Portfolio + governance risks/actions from Supabase for intelligence builders (server / EA only). */
export async function withTalantonIntelligenceFromWorkspace<T>(
  workspaceId: string,
  workspaceSlug: string,
  fn: () => T | Promise<T>,
): Promise<T> {
  const companies = await listPortfolioCompanies(workspaceId);
  const [risks, meetings] = await Promise.all([
    ensureGovernanceRisks({ workspaceId, workspaceSlug }),
    ensureGovernanceMeetings({ workspaceId, workspaceSlug }),
  ]);
  const ctx: TalantonIntelligenceContext = {
    governanceRisks: risks.filter((r) => !r.archived),
    governanceActions: flattenGovernanceActions(meetings),
    impactReportsByCompanyId: {},
  };
  return withTalantonPortfolioCompaniesOverrideAsync(companies, () =>
    withTalantonIntelligenceContextOverrideAsync(ctx, async () => fn()),
  );
}
