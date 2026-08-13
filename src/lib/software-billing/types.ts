export const VERCEL_PROVIDER_SLUG = "vercel" as const;
export const OPENAI_PROVIDER_SLUG = "openai" as const;
export const SUPABASE_PROVIDER_SLUG = "supabase" as const;
export const CURSOR_PROVIDER_SLUG = "cursor" as const;

export const SOFTWARE_BILLING_PROVIDER_SLUGS = [
  VERCEL_PROVIDER_SLUG,
  OPENAI_PROVIDER_SLUG,
  SUPABASE_PROVIDER_SLUG,
  CURSOR_PROVIDER_SLUG,
] as const;

export type SoftwareProviderSlug = (typeof SOFTWARE_BILLING_PROVIDER_SLUGS)[number];

export type PeriodKind = "completed" | "in_progress";

export type BillingDataQuality = "actual" | "estimated" | "mixed" | "unavailable";

export type FocusBillingCharge = {
  BilledCost: number;
  EffectiveCost: number;
  BillingCurrency?: string;
  ChargeCategory: "Adjustment" | "Credit" | "Purchase" | "Tax" | "Usage" | string;
  ChargePeriodStart: string;
  ChargePeriodEnd: string;
  ConsumedQuantity?: number | null;
  ConsumedUnit?: string | null;
  ServiceName: string;
  ServiceCategory?: string;
  ServiceProviderName?: string;
  Tags?: Record<string, string>;
  PricingCategory?: string;
  PricingQuantity?: number;
  PricingUnit?: string;
  PricingCurrency?: string;
  RegionId?: string;
  RegionName?: string;
};

export type ChargeAggregation = {
  lineCount: number;
  usageEffective: number;
  usageBilled: number;
  creditsApplied: number;
  additionalPurchases: number;
  taxAmount: number;
  adjustmentsAmount: number;
  baseSubscription: number;
  totalEffective: number;
  totalBilled: number;
  byService: Record<string, { effective: number; billed: number }>;
};

export type VercelTeamBilling = {
  plan: string;
  planIteration: string | null;
  currency: string;
  periodStart: string;
  periodEnd: string;
  baseSubscriptionMonthly: number;
  seatCount: number;
  analyticsSpendLimitDollars: number | null;
  includedAllocationEnabled: boolean;
  teamId: string;
  teamSlug: string;
};

export type ProviderPeriodSnapshot = {
  id: string;
  workspaceId: string;
  providerSlug: string;
  periodStart: string;
  periodEnd: string;
  periodKind: PeriodKind;
  currency: string;
  baseSubscriptionAmount: number;
  usageEffectiveAmount: number;
  usageBilledAmount: number;
  creditsAppliedAmount: number;
  additionalPurchasesAmount: number;
  taxAmount: number;
  adjustmentsAmount: number;
  billedAmount: number;
  projectedAmount: number | null;
  chargeLineCount: number;
  planName: string;
  planIteration: string;
  seatCount: number | null;
  rawSummary: Record<string, unknown>;
  source: string;
  updatedAt: string;
};

export type ProviderConnectionState = {
  providerSlug: string;
  softwareAssetId: string | null;
  externalTeamId: string;
  externalTeamSlug: string;
  currency: string;
  isEnabled: boolean;
  lastSuccessfulSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string;
};

export type ProviderBillingContext = {
  providerSlug: SoftwareProviderSlug;
  connection: ProviderConnectionState | null;
  completedSnapshots: ProviderPeriodSnapshot[];
  inProgressSnapshot: ProviderPeriodSnapshot | null;
  configured: boolean;
  configError: string | null;
};

export type SoftwareBillingSummary = {
  currency: string;
  lastSuccessfulSyncAt: string | null;
  syncStatus: "never" | "ok" | "stale" | "error";
  syncError: string | null;
  overall: {
    totalSoftwareCostMonthly: number;
    lastMonthSpend: number;
    upcoming: number;
    deltaAmount: number;
    deltaPercent: number | null;
    deltaDirection: "up" | "down" | "flat" | "unknown";
  };
  vercel: {
    lastMonth: number;
    upcomingProjected: number;
    currentSpend: number;
    isProjected: boolean;
    planName: string;
    planIteration: string;
    baseSubscriptionMonthly: number;
    seatCount: number | null;
    billingPeriodStart: string | null;
    billingPeriodEnd: string | null;
    creditsAppliedCurrent: number;
    usageEffectiveCurrent: number;
    analyticsSpendLimitDollars: number | null;
  };
  history: Array<{
    periodStart: string;
    periodEnd: string;
    billedAmount: number;
    usageEffectiveAmount: number;
    creditsAppliedAmount: number;
    deltaAmount: number | null;
    deltaPercent: number | null;
  }>;
  vercelAssetId: string | null;
};
