"use client";

import { getLatestImpactReportForIntelligence } from "@/lib/talanton/company-stories-impact";
import { getTalantonGovernanceSnapshot, subscribeTalantonGovernanceStore } from "@/lib/talanton/governance-store";
import { getTiRiskRegisterState, subscribeTiRiskRegister } from "@/lib/talanton/risk-register-store";
import {
  flattenGovernanceActions,
  openGovernanceActions,
  openGovernanceRisks,
  setTalantonIntelligenceContext,
  type TalantonIntelligenceContext,
} from "@/lib/talanton/talanton-intelligence-context";
import {
  getTalantonPortfolioCompaniesClientSnapshot,
  subscribeTalantonPortfolioCompanies,
} from "@/lib/talanton/portfolio-companies-client-store";

type Listener = () => void;

const listeners = new Set<Listener>();

function buildImpactReportsMap(): Record<string, ReturnType<typeof getLatestImpactReportForIntelligence>> {
  const { companies } = getTalantonPortfolioCompaniesClientSnapshot();
  const map: Record<string, ReturnType<typeof getLatestImpactReportForIntelligence>> = {};
  for (const c of companies) {
    map[c.id] = getLatestImpactReportForIntelligence(c.id);
  }
  return map;
}

function syncContextFromStores(): TalantonIntelligenceContext {
  const governance = getTalantonGovernanceSnapshot();
  const risksState = getTiRiskRegisterState();
  const actions = openGovernanceActions(flattenGovernanceActions(governance.meetings));
  const ctx: TalantonIntelligenceContext = {
    governanceRisks: openGovernanceRisks(risksState.risks),
    governanceActions: actions,
    impactReportsByCompanyId: buildImpactReportsMap(),
  };
  setTalantonIntelligenceContext(ctx);
  return ctx;
}

function emit() {
  syncContextFromStores();
  for (const l of listeners) l();
}

export function subscribeTalantonIntelligenceContext(listener: Listener): () => void {
  listeners.add(listener);
  syncContextFromStores();
  const unsubGov = subscribeTalantonGovernanceStore(() => emit());
  const unsubRisk = subscribeTiRiskRegister(() => emit());
  const unsubCo = subscribeTalantonPortfolioCompanies(() => emit());
  return () => {
    listeners.delete(listener);
    unsubGov();
    unsubRisk();
    unsubCo();
  };
}

export function getTalantonIntelligenceContextClientSnapshot(): TalantonIntelligenceContext {
  return syncContextFromStores();
}

export function getTalantonIntelligenceContextServerSnapshot(): TalantonIntelligenceContext {
  return {
    governanceRisks: [],
    governanceActions: [],
    impactReportsByCompanyId: {},
  };
}

export function useTalantonIntelligenceContextKey(): string {
  const ctx = getTalantonIntelligenceContextClientSnapshot();
  const riskIds = ctx.governanceRisks.map((r) => r.id).join(",");
  const actionIds = ctx.governanceActions.map((a) => a.id).join(",");
  const impactIds = Object.entries(ctx.impactReportsByCompanyId)
    .map(([id, r]) => `${id}:${r?.id ?? "none"}`)
    .join(",");
  return `${riskIds}|${actionIds}|${impactIds}`;
}
