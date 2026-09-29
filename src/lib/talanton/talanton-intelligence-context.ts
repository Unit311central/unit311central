import type { GovernanceAction } from "@/lib/talanton/governance-types";
import type { ImpactReport } from "@/lib/talanton/company-stories-impact";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";

export type TalantonIntelligenceContext = {
  governanceRisks: TiRiskRegisterEntry[];
  governanceActions: GovernanceAction[];
  /** Latest non-seed impact report per company (client submissions). */
  impactReportsByCompanyId: Record<string, ImpactReport | null>;
};

const EMPTY: TalantonIntelligenceContext = {
  governanceRisks: [],
  governanceActions: [],
  impactReportsByCompanyId: {},
};

let runtimeContext: TalantonIntelligenceContext = EMPTY;

export function resolveTalantonIntelligenceContext(): TalantonIntelligenceContext {
  return runtimeContext;
}

export function setTalantonIntelligenceContext(partial: Partial<TalantonIntelligenceContext>): void {
  runtimeContext = {
    governanceRisks: partial.governanceRisks ?? runtimeContext.governanceRisks,
    governanceActions: partial.governanceActions ?? runtimeContext.governanceActions,
    impactReportsByCompanyId:
      partial.impactReportsByCompanyId ?? runtimeContext.impactReportsByCompanyId,
  };
}

export function withTalantonIntelligenceContextOverride<T>(
  ctx: TalantonIntelligenceContext,
  fn: () => T,
): T {
  const prev = runtimeContext;
  runtimeContext = ctx;
  try {
    return fn();
  } finally {
    runtimeContext = prev;
  }
}

export async function withTalantonIntelligenceContextOverrideAsync<T>(
  ctx: TalantonIntelligenceContext,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = runtimeContext;
  runtimeContext = ctx;
  try {
    return await fn();
  } finally {
    runtimeContext = prev;
  }
}

export function flattenGovernanceActions(
  meetings: Array<{ actions: GovernanceAction[]; archived?: boolean }>,
): GovernanceAction[] {
  return meetings
    .filter((m) => !m.archived)
    .flatMap((m) => m.actions);
}

export function openGovernanceActions(actions: GovernanceAction[]): GovernanceAction[] {
  return actions.filter((a) => a.status !== "Completed");
}

export function openGovernanceRisks(risks: TiRiskRegisterEntry[]): TiRiskRegisterEntry[] {
  return risks.filter((r) => !r.archived && r.status.toLowerCase() !== "closed");
}
