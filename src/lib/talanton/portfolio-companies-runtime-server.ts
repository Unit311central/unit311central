import "server-only";

import { loadPortfolioCompaniesForEa } from "@/lib/talanton/portfolio-companies-service";
import { TALANTON_GOVERNANCE_MEETING_SEED } from "@/lib/talanton/governance-seed-data";
import { getTiRiskRegisterServerSnapshot } from "@/lib/talanton/risk-register-store";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import {
  flattenGovernanceActions,
  withTalantonIntelligenceContextOverrideAsync,
  type TalantonIntelligenceContext,
} from "@/lib/talanton/talanton-intelligence-context";
import {
  withTalantonPortfolioCompaniesOverrideAsync,
} from "@/lib/talanton/portfolio-companies-runtime";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import {
  ensureGovernanceMeetings,
  ensureGovernanceRisks,
} from "@/lib/talanton/workspace-governance-service";

function talantonEaOfflineIntelligenceContext(): TalantonIntelligenceContext {
  const riskSnap = getTiRiskRegisterServerSnapshot();
  return {
    governanceRisks: riskSnap.risks.filter((risk) => !risk.archived),
    governanceActions: flattenGovernanceActions(TALANTON_GOVERNANCE_MEETING_SEED),
    impactReportsByCompanyId: {},
  };
}

function shouldUseTalantonEaOfflineIntelligence(workspaceSlug: string): boolean {
  return (
    process.env.TALANTON_EA_SUITE === "1" &&
    isTalantonImpactSlug(workspaceSlug) &&
    !isSupabaseServiceRoleConfigured()
  );
}

async function loadTalantonIntelligenceContext(
  workspaceId: string,
  workspaceSlug: string,
): Promise<TalantonIntelligenceContext> {
  if (shouldUseTalantonEaOfflineIntelligence(workspaceSlug)) {
    return talantonEaOfflineIntelligenceContext();
  }

  try {
    const [risks, meetings] = await Promise.all([
      ensureGovernanceRisks({ workspaceId, workspaceSlug }),
      ensureGovernanceMeetings({ workspaceId, workspaceSlug }),
    ]);
    return {
      governanceRisks: risks.filter((risk) => !risk.archived),
      governanceActions: flattenGovernanceActions(meetings),
      impactReportsByCompanyId: {},
    };
  } catch (error) {
    if (process.env.TALANTON_EA_SUITE === "1" && isTalantonImpactSlug(workspaceSlug)) {
      return talantonEaOfflineIntelligenceContext();
    }
    throw error;
  }
}

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
  const companies = await loadPortfolioCompaniesForEa(workspaceId, workspaceSlug);
  const ctx = await loadTalantonIntelligenceContext(workspaceId, workspaceSlug);
  return withTalantonPortfolioCompaniesOverrideAsync(companies, () =>
    withTalantonIntelligenceContextOverrideAsync(ctx, async () => fn()),
  );
}
