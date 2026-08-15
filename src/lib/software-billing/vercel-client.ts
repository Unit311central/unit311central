import {
  getVercelApiToken,
  getVercelTeamId,
  getVercelTeamSlug,
  VERCEL_API_BASE,
} from "@/lib/software-billing/vercel-config";
import type { VercelTeamBilling } from "@/lib/software-billing/types";

export type VercelInvoiceItemState = {
  price?: number;
  quantity?: number;
  highestQuantity?: number;
  createdAt?: number;
  hidden?: boolean;
};

export type VercelTeamBillingDetails = VercelTeamBilling & {
  invoiceItems: {
    pro?: VercelInvoiceItemState;
    teamSeats?: VercelInvoiceItemState;
    analytics?: VercelInvoiceItemState;
    includedAllocationUsd?: VercelInvoiceItemState;
  };
};

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
  if (!teamId) {
    throw new VercelBillingApiError("VERCEL_TEAM_ID (or VERCEL_ORG_ID) is not configured.", 503);
  }
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
  if (!slug) {
    throw new VercelBillingApiError("VERCEL_TEAM_SLUG is not configured.", 503);
  }
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
    enabledInvoiceItems?: { includedAllocationUsd?: { enabled?: boolean } };
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

  return mapTeamBillingDetails(payload);
}

function mapTeamBillingDetails(payload: {
  id: string;
  slug: string;
  enabledInvoiceItems?: { includedAllocationUsd?: { enabled?: boolean } };
  billing?: {
    plan?: string;
    planIteration?: string;
    currency?: string;
    period?: { start?: number; end?: number };
    invoiceItems?: VercelTeamBillingDetails["invoiceItems"];
    controls?: { analyticsSpendLimitInDollars?: number };
    enabledInvoiceItems?: { includedAllocationUsd?: { enabled?: boolean } };
  };
}): VercelTeamBillingDetails {
  const billing = payload.billing ?? {};
  const pro = billing.invoiceItems?.pro;
  const periodStart = billing.period?.start
    ? new Date(billing.period.start).toISOString()
    : new Date().toISOString();
  const periodEnd = billing.period?.end
    ? new Date(billing.period.end).toISOString()
    : new Date().toISOString();
  const includedAllocationEnabled = Boolean(
    payload.enabledInvoiceItems?.includedAllocationUsd?.enabled ??
      billing.enabledInvoiceItems?.includedAllocationUsd?.enabled,
  );

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
    includedAllocationEnabled,
    teamId: String(payload.id),
    teamSlug: String(payload.slug),
    invoiceItems: billing.invoiceItems ?? {},
  };
}

export async function fetchVercelTeamBillingDetails(): Promise<VercelTeamBillingDetails> {
  const slug = getVercelTeamSlug();
  if (!slug) {
    throw new VercelBillingApiError("VERCEL_TEAM_SLUG is not configured.", 503);
  }
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
  return mapTeamBillingDetails(JSON.parse(text));
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
    if (response.status === 404) {
      try {
        const body = JSON.parse(text) as { error?: { code?: string } };
        if (body.error?.code === "costs_not_found") {
          console.warn(
            `[vercel-billing] costs_not_found for ${fromIso} → ${toIso}; treating as empty charges.`,
          );
          return "";
        }
      } catch {
        // fall through
      }
    }
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
