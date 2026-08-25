import "server-only";

import {
  DEFAULT_REPORTING_CURRENCY,
  resolveSlugReportingCurrency,
  type ReportingCurrency,
} from "@/lib/financial-reporting-currency";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

function normalizeReportingCurrency(value: string | null | undefined): ReportingCurrency | null {
  const code = String(value ?? "")
    .trim()
    .toUpperCase();
  if (code === "USD" || code === "GBP" || code === "EUR" || code === "AUD") {
    return code;
  }
  return null;
}

/**
 * Resolve workspace display/reporting currency from settings, then slug specialists, then platform default.
 */
export async function resolveWorkspaceReportingCurrency(
  workspaceId?: string | null,
  workspaceSlug?: string | null,
): Promise<ReportingCurrency> {
  const slug = String(workspaceSlug ?? "").trim().toLowerCase();

  const slugCurrency = resolveSlugReportingCurrency(slug);
  if (slugCurrency !== DEFAULT_REPORTING_CURRENCY) {
    return slugCurrency;
  }

  const id = String(workspaceId ?? "").trim();
  if (!id || !isSupabaseConfigured()) {
    return DEFAULT_REPORTING_CURRENCY;
  }

  try {
    const supabase = createTenancyServerClient();
    const { data } = await supabase
      .from("workspace_settings")
      .select("currency")
      .eq("workspace_id", id)
      .maybeSingle();
    const fromSettings = normalizeReportingCurrency(data?.currency);
    if (fromSettings) return fromSettings;
  } catch {
    /* optional */
  }

  return DEFAULT_REPORTING_CURRENCY;
}

/**
 * Executive Home / Command Centre display currency — workspace settings first,
 * then slug specialists. Does not apply Finances-only demo USD override.
 */
export async function resolveExecutiveHomeReportingCurrency(
  workspaceId?: string | null,
  workspaceSlug?: string | null,
): Promise<ReportingCurrency> {
  const slug = String(workspaceSlug ?? "").trim().toLowerCase();
  let id = String(workspaceId ?? "").trim();

  if (!id && slug && isSupabaseConfigured()) {
    try {
      const record = await findWorkspaceBySlug(slug);
      if (record?.id) id = record.id;
    } catch {
      /* optional */
    }
  }

  if (id && isSupabaseConfigured()) {
    try {
      const supabase = createTenancyServerClient();
      const { data } = await supabase
        .from("workspace_settings")
        .select("currency")
        .eq("workspace_id", id)
        .maybeSingle();
      const fromSettings = normalizeReportingCurrency(data?.currency);
      if (fromSettings) return fromSettings;
    } catch {
      /* optional */
    }
  }

  const slugCurrency = resolveSlugReportingCurrency(slug);
  if (slugCurrency !== DEFAULT_REPORTING_CURRENCY) {
    return slugCurrency;
  }

  return DEFAULT_REPORTING_CURRENCY;
}
