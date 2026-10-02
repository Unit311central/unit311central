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

const EMPTY_SNAPSHOT: TalantonIntelligenceContext = {
  governanceRisks: [],
  governanceActions: [],
  impactReportsByCompanyId: {},
};

/** Stable reference for useSyncExternalStore — only replaced when underlying stores change. */
let clientSnapshot: TalantonIntelligenceContext = EMPTY_SNAPSHOT;

let upstreamUnsubs: Array<() => void> | null = null;

function buildImpactReportsMap(): Record<string, ReturnType<typeof getLatestImpactReportForIntelligence>> {
  const { companies } = getTalantonPortfolioCompaniesClientSnapshot();
  const map: Record<string, ReturnType<typeof getLatestImpactReportForIntelligence>> = {};
  for (const c of companies) {
    map[c.id] = getLatestImpactReportForIntelligence(c.id);
  }
  return map;
}

function snapshotSignature(ctx: TalantonIntelligenceContext): string {
  const riskIds = ctx.governanceRisks.map((r) => r.id).join(",");
  const actionIds = ctx.governanceActions.map((a) => a.id).join(",");
  const impactIds = Object.entries(ctx.impactReportsByCompanyId)
    .map(([id, r]) => `${id}:${r?.id ?? "none"}`)
    .join(",");
  return `${riskIds}|${actionIds}|${impactIds}`;
}

function rebuildClientSnapshot(): void {
  const governance = getTalantonGovernanceSnapshot();
  const risksState = getTiRiskRegisterState();
  const actions = openGovernanceActions(flattenGovernanceActions(governance.meetings));
  const next: TalantonIntelligenceContext = {
    governanceRisks: openGovernanceRisks(risksState.risks),
    governanceActions: actions,
    impactReportsByCompanyId: buildImpactReportsMap(),
  };
  setTalantonIntelligenceContext(next);
  const prevSig = snapshotSignature(clientSnapshot);
  const nextSig = snapshotSignature(next);
  if (prevSig === nextSig) return;
  clientSnapshot = next;
}

function emit() {
  rebuildClientSnapshot();
  for (const l of listeners) l();
}

function ensureUpstreamSubscriptions(): void {
  if (upstreamUnsubs) return;
  rebuildClientSnapshot();
  upstreamUnsubs = [
    subscribeTalantonGovernanceStore(() => emit()),
    subscribeTiRiskRegister(() => emit()),
    subscribeTalantonPortfolioCompanies(() => emit()),
  ];
}

function teardownUpstreamSubscriptions(): void {
  if (listeners.size > 0 || !upstreamUnsubs) return;
  for (const unsub of upstreamUnsubs) unsub();
  upstreamUnsubs = null;
}

export function subscribeTalantonIntelligenceContext(listener: Listener): () => void {
  listeners.add(listener);
  ensureUpstreamSubscriptions();
  return () => {
    listeners.delete(listener);
    teardownUpstreamSubscriptions();
  };
}

export function getTalantonIntelligenceContextClientSnapshot(): TalantonIntelligenceContext {
  return clientSnapshot;
}

export function getTalantonIntelligenceContextServerSnapshot(): TalantonIntelligenceContext {
  return EMPTY_SNAPSHOT;
}

export function useTalantonIntelligenceContextKey(): string {
  const ctx = getTalantonIntelligenceContextClientSnapshot();
  return snapshotSignature(ctx);
}
