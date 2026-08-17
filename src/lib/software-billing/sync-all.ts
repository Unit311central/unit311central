import { syncCursorSoftwareBilling } from "@/lib/software-billing/cursor-sync";
import { isCursorBillingConfigured } from "@/lib/software-billing/cursor-config";
import { syncOpenAiSoftwareBilling } from "@/lib/software-billing/openai-sync";
import { isOpenAiBillingConfigured } from "@/lib/software-billing/openai-config";
import { syncSupabaseSoftwareBilling } from "@/lib/software-billing/supabase-sync";
import { isSupabaseBillingConfigured } from "@/lib/software-billing/supabase-config";
import { syncVercelSoftwareBilling } from "@/lib/software-billing/vercel-sync";
import { isVercelBillingConfigured } from "@/lib/software-billing/vercel-config";

export type ProviderSyncOutcome = {
  provider: string;
  ok: boolean;
  error?: string;
  recordsFetched: number;
  lastSuccessfulSyncAt: string | null;
};

export async function syncAllSoftwareBillingProviders(workspaceId: string) {
  const outcomes: ProviderSyncOutcome[] = [];

  if (isVercelBillingConfigured()) {
    const result = await syncVercelSoftwareBilling(workspaceId);
    outcomes.push({
      provider: "vercel",
      ok: result.ok,
      error: result.error,
      recordsFetched: result.recordsFetched,
      lastSuccessfulSyncAt: result.lastSuccessfulSyncAt,
    });
  }

  if (isOpenAiBillingConfigured()) {
    const result = await syncOpenAiSoftwareBilling(workspaceId);
    outcomes.push({
      provider: "openai",
      ok: result.ok,
      error: result.error,
      recordsFetched: result.recordsFetched,
      lastSuccessfulSyncAt: result.lastSuccessfulSyncAt,
    });
  }

  if (isCursorBillingConfigured()) {
    const result = await syncCursorSoftwareBilling(workspaceId);
    outcomes.push({
      provider: "cursor",
      ok: result.ok,
      error: result.error,
      recordsFetched: result.recordsFetched,
      lastSuccessfulSyncAt: result.lastSuccessfulSyncAt,
    });
  }

  if (isSupabaseBillingConfigured()) {
    const result = await syncSupabaseSoftwareBilling(workspaceId);
    outcomes.push({
      provider: "supabase",
      ok: result.ok,
      error: result.error,
      recordsFetched: result.recordsFetched,
      lastSuccessfulSyncAt: result.lastSuccessfulSyncAt,
    });
  }

  return outcomes;
}
