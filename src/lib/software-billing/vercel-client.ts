import {
  getVercelApiToken,
  getVercelTeamId,
  getVercelTeamSlug,
  VERCEL_API_BASE,
} from "@/lib/software-billing/vercel-config";
import type { VercelTeamBilling } from "@/lib/software-billing/types";

export class VercelBillingApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "VercelBillingApiError";
    this.status = status;
  }
}

function teamQuery() {
  const teamId = getVercelTeamId();
  return `teamId=${encodeURIComponent(teamId)}`;
}

async function vercelFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getVercelApiToken();
  if (!token) {
    throw new VercelBillingApiError("VERCEL_API_TOKEN is not configured.", 503);
  }

  const separator = path.includes("?") ? "&" : "?";
  const url = `${VERCEL_API_BASE}${path}${separator}${teamQuery()}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function fetchVercelTeamBilling(): Promise<VercelTeamBilling> {
  const slug = getVercelTeamSlug();
  const response = await vercelFetch(`/v2/teams/${encodeURIComponent(slug)}`, {
    method: "GET",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new VercelBillingApiError(
      `Vercel team API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }

  const payload = JSON.parse(text) as {
    id: string;
    slug: string;
    billing?: {
      plan?: string;
      planIteration?: string;
      currency?: string;
      period?: { start?: number; end?: number };
      invoiceItems?: {
        pro?: { price?: number; quantity?: number };
      };
      controls?: { analyticsSpendLimitInDollars?: number };
      enabledInvoiceItems?: { includedAllocationUsd?: { enabled?: boolean } };
    };
  };

  const billing = payload.billing ?? {};
  const pro = billing.invoiceItems?.pro;
  const periodStart = billing.period?.start
    ? new Date(billing.period.start).toISOString()
    : new Date().toISOString();
  const periodEnd = billing.period?.end
    ? new Date(billing.period.end).toISOString()
    : new Date().toISOString();

  return {
    plan: String(billing.plan ?? "unknown"),
    planIteration: billing.planIteration ? String(billing.planIteration) : null,
    currency: String(billing.currency ?? "usd").toUpperCase(),
    periodStart,
    periodEnd,
    baseSubscriptionMonthly: pro?.price ? Number(pro.price) / 100 : 0,
    seatCount: Number(pro?.quantity ?? 0),
    analyticsSpendLimitDollars:
      billing.controls?.analyticsSpendLimitInDollars != null
        ? Number(billing.controls.analyticsSpendLimitInDollars)
        : null,
    includedAllocationEnabled: Boolean(billing.enabledInvoiceItems?.includedAllocationUsd?.enabled),
    teamId: String(payload.id),
    teamSlug: String(payload.slug),
  };
}

export async function fetchVercelBillingCharges(fromIso: string, toIso: string): Promise<string> {
  const response = await vercelFetch(
    `/v1/billing/charges?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
    {
      method: "GET",
      headers: { Accept: "application/jsonl" },
    },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new VercelBillingApiError(
      `Vercel billing charges API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  return text;
}

export type VercelUsageSummary = {
  period: { from: string; to: string };
  totals: {
    pricingQuantity: number;
    effectiveCost: number;
    billedCost: number;
  };
  services: Array<{
    name: string;
    effectiveCost: number;
    billedCost: number;
    pricingQuantity: number;
  }>;
};

/** Official usage totals (same data as `vercel usage --json`). */
export async function fetchVercelUsageSummary(
  fromIso: string,
  toIso: string,
): Promise<VercelUsageSummary> {
  const response = await vercelFetch(
    `/v1/billing/usage?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
    { method: "GET" },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new VercelBillingApiError(
      `Vercel billing usage API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  return JSON.parse(text) as VercelUsageSummary;
}

export function previousBillingPeriod(currentStartIso: string, currentEndIso: string) {
  const start = new Date(currentStartIso).getTime();
  const end = new Date(currentEndIso).getTime();
  const duration = Math.max(end - start, 24 * 60 * 60 * 1000);
  return {
    from: new Date(start - duration).toISOString(),
    to: new Date(start).toISOString(),
  };
}
