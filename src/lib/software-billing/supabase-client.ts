import {
  getSupabaseAccessToken,
  getSupabaseOrgSlug,
  SUPABASE_MGMT_API_BASE,
} from "@/lib/software-billing/supabase-config";
import { round2 } from "@/lib/software-billing/period-utils";

export class SupabaseBillingApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseBillingApiError";
    this.status = status;
  }
}

export type SupabaseOrganizationInfo = {
  id: string;
  slug: string;
  name: string;
  plan: string;
};

export type SupabaseProjectInfo = {
  ref: string;
  name: string;
  region: string;
  status: string;
};

export type SupabaseProjectAddon = {
  type: string;
  name: string;
  priceDescription: string;
  hourlyUsd: number | null;
};

async function supabaseMgmtFetch(path: string) {
  const token = getSupabaseAccessToken();
  const orgSlug = getSupabaseOrgSlug();
  if (!token || !orgSlug) {
    throw new SupabaseBillingApiError(
      "SUPABASE_ACCESS_TOKEN and SUPABASE_ORG_SLUG must be configured.",
      503,
    );
  }
  const response = await fetch(`${SUPABASE_MGMT_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  return { response, orgSlug };
}

function parseHourlyUsd(description: string): number | null {
  const match = description.match(/\$([0-9.]+)\s*\/\s*hour/i);
  return match ? Number(match[1]) : null;
}

export async function fetchSupabaseOrganization(): Promise<SupabaseOrganizationInfo> {
  const orgSlug = getSupabaseOrgSlug();
  if (!orgSlug) {
    throw new SupabaseBillingApiError("SUPABASE_ORG_SLUG must be configured.", 503);
  }
  const { response } = await supabaseMgmtFetch(`/organizations/${encodeURIComponent(orgSlug)}`);
  const text = await response.text();
  if (!response.ok) {
    throw new SupabaseBillingApiError(
      `Supabase organization API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  const payload = JSON.parse(text) as Record<string, unknown>;
  return {
    id: String(payload.id ?? ""),
    slug: orgSlug,
    name: String(payload.name ?? orgSlug),
    plan: String(payload.plan ?? "unknown"),
  };
}

export async function fetchSupabaseProjects(): Promise<SupabaseProjectInfo[]> {
  const orgSlug = getSupabaseOrgSlug();
  if (!orgSlug) {
    throw new SupabaseBillingApiError("SUPABASE_ORG_SLUG must be configured.", 503);
  }
  const { response } = await supabaseMgmtFetch(
    `/organizations/${encodeURIComponent(orgSlug)}/projects`,
  );
  const text = await response.text();
  if (!response.ok) {
    throw new SupabaseBillingApiError(
      `Supabase projects API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  const payload = JSON.parse(text) as Array<Record<string, unknown>>;
  return (payload ?? []).map((project) => ({
    ref: String(project.ref ?? project.id ?? ""),
    name: String(project.name ?? ""),
    region: String(project.region ?? ""),
    status: String(project.status ?? ""),
  }));
}

export async function fetchSupabaseProjectAddons(projectRef: string): Promise<SupabaseProjectAddon[]> {
  const token = getSupabaseAccessToken();
  if (!token) {
    throw new SupabaseBillingApiError("SUPABASE_ACCESS_TOKEN is not configured.", 503);
  }
  const response = await fetch(
    `${SUPABASE_MGMT_API_BASE}/projects/${encodeURIComponent(projectRef)}/billing/addons`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new SupabaseBillingApiError(
      `Supabase billing addons API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  const payload = JSON.parse(text) as {
    selected_addons?: Array<Record<string, unknown>>;
  };
  return (payload.selected_addons ?? []).map((addon) => {
    const variant = (addon.variant ?? {}) as Record<string, unknown>;
    const price = (variant.price ?? {}) as Record<string, unknown>;
    const priceDescription = String(price.description ?? "");
    return {
      type: String(addon.type ?? ""),
      name: String(variant.name ?? addon.type ?? "addon"),
      priceDescription,
      hourlyUsd: parseHourlyUsd(priceDescription),
    };
  });
}

const PLAN_BASE_MONTHLY_USD: Record<string, number> = {
  free: 0,
  pro: 25,
  team: 599,
};

export function estimateSupabaseMonthlySpend(input: {
  plan: string;
  projectCount: number;
  addons: Array<{ hourlyUsd: number | null }>;
}) {
  const planKey = input.plan.toLowerCase();
  const base = PLAN_BASE_MONTHLY_USD[planKey] ?? 0;
  const hoursPerMonth = 730;
  const compute = input.addons.reduce(
    (sum, addon) => sum + (addon.hourlyUsd ? addon.hourlyUsd * hoursPerMonth : 0),
    0,
  );
  const credit = planKey === "pro" || planKey === "team" ? 10 : 0;
  return {
    baseSubscriptionMonthly: round2(base),
    estimatedComputeMonthly: round2(Math.max(compute - credit, 0)),
    estimatedTotalMonthly: round2(base + Math.max(compute - credit, 0)),
    projectCount: input.projectCount,
    dataQuality: "estimated" as const,
  };
}
