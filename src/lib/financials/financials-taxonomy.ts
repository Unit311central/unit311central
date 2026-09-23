/**
 * Finances (canonical module id `financials`) — agreed product taxonomy.
 *
 * Verification-only formalisation aligned with buildFinancesNavSection() — no new routes.
 *
 *   1 Core Module · 8 Core Features · 28 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { FINANCES_CANONICAL_MODULE_ID, FINANCES_MODULE_LABEL } from "@/lib/finances-nav";

export const FINANCIALS_MODULE_ID = FINANCES_CANONICAL_MODULE_ID;

export const FINANCIALS_MODULE_LABEL = FINANCES_MODULE_LABEL;

export type FinancialsSubFeature = {
  label: string;
  viewId: InternalOperationsView;
  query?: Record<string, string>;
};

export type FinancialsCoreFeature = {
  label: string;
  viewId?: InternalOperationsView;
  subFeatures?: readonly FinancialsSubFeature[];
};

/** Eight Core Features in central Finances nav order. */
export const FINANCIALS_CORE_FEATURES: readonly FinancialsCoreFeature[] = [
  { label: "Dashboard", viewId: "financials" },
  {
    label: "General Ledger",
    subFeatures: [
      { label: "Chart of Accounts", viewId: "general-ledger", query: { tab: "accounts" } },
      { label: "Trial Balance", viewId: "general-ledger", query: { tab: "trial" } },
      { label: "Journals", viewId: "general-ledger", query: { tab: "journal" } },
    ],
  },
  {
    label: "Accounts Receivable",
    subFeatures: [
      { label: "Invoices", viewId: "accounts-receivable" },
      { label: "Outstanding", viewId: "accounts-receivable", query: { filter: "outstanding" } },
      { label: "Overdue", viewId: "accounts-receivable", query: { filter: "overdue" } },
      { label: "Collections", viewId: "finances-ar-collections" },
      { label: "AR Reporting", viewId: "finances-ar-reporting" },
    ],
  },
  {
    label: "Accounts Payable",
    subFeatures: [
      { label: "Supplier Invoices", viewId: "accounts-payable", query: { section: "invoices" } },
      { label: "Approvals", viewId: "accounts-payable", query: { section: "approvals" } },
      { label: "Outstanding", viewId: "accounts-payable", query: { section: "outstanding" } },
      { label: "Due Dates", viewId: "accounts-payable", query: { section: "due-dates" } },
      { label: "Payments", viewId: "finances-ap-payments" },
    ],
  },
  {
    label: "Expenses",
    subFeatures: [
      { label: "My Expenses", viewId: "expenses" },
      { label: "Add Expense", viewId: "expenses", query: { section: "add" } },
      { label: "All Expenses", viewId: "expenses", query: { section: "all" } },
      { label: "Approvals", viewId: "expenses", query: { section: "approvals" } },
      { label: "Expense Runs", viewId: "expenses", query: { section: "runs" } },
      { label: "Configuration", viewId: "expenses", query: { section: "config" } },
    ],
  },
  {
    label: "Banking & Cash",
    subFeatures: [
      { label: "Bank", viewId: "wise" },
      { label: "Cash Position", viewId: "finances-banking-cash-position" },
      { label: "Reconciliation", viewId: "finances-banking-reconciliation" },
    ],
  },
  {
    label: "Planning & Management",
    subFeatures: [
      { label: "Budget", viewId: "finances-planning-budget" },
      { label: "Actual vs Budget", viewId: "finances-planning-actual-vs-budget" },
      { label: "Cash Flow", viewId: "finances-planning-cash-flow" },
      { label: "Forecast", viewId: "finances-planning-forecast" },
      { label: "KPIs", viewId: "finances-planning-kpis" },
      { label: "Management Accounts", viewId: "finances-planning-management-accounts" },
    ],
  },
  { label: "Financial Reports", viewId: "financial-reports" },
] as const;

export const FINANCIALS_CUSTOM_FEATURES: readonly string[] = [];

export const FINANCIALS_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function financialsCoreFeatureCount(): number {
  return FINANCIALS_CORE_FEATURES.length;
}

export function financialsCoreSubFeatureCount(): number {
  return FINANCIALS_CORE_FEATURES.reduce(
    (total, feature) => total + (feature.subFeatures?.length ?? 0),
    0,
  );
}
