import {
  getProviderConnection,
  listPeriodSnapshots,
} from "@/lib/software-billing/provider-db";
import { isVercelBillingConfigured } from "@/lib/software-billing/vercel-config";
import type { ProviderBillingContext, SoftwareProviderSlug } from "@/lib/software-billing/types";
import {
  SOFTWARE_BILLING_PROVIDER_SLUGS,
  VERCEL_PROVIDER_SLUG,
} from "@/lib/software-billing/types";

function providerConfig(slug: SoftwareProviderSlug): {
  configured: boolean;
  configError: string | null;
} {
  if (slug === VERCEL_PROVIDER_SLUG) {
    const configured = isVercelBillingConfigured();
    return {
      configured,
      configError: configured ? null : "VERCEL_API_TOKEN is not configured on the server.",
    };
  }

  return { configured: false, configError: null };
}

export async function buildProviderBillingContext(
  workspaceId: string,
  providerSlug: SoftwareProviderSlug,
): Promise<ProviderBillingContext> {
  const { configured, configError } = providerConfig(providerSlug);

  const [connection, snapshots] = await Promise.all([
    getProviderConnection(workspaceId, providerSlug),
    listPeriodSnapshots(workspaceId, providerSlug),
  ]);

  const completedSnapshots = snapshots
    .filter((row) => row.periodKind === "completed")
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
  const inProgressSnapshot = snapshots.find((row) => row.periodKind === "in_progress") ?? null;

  return {
    providerSlug,
    connection,
    completedSnapshots,
    inProgressSnapshot,
    configured,
    configError,
  };
}

export async function buildAllProviderBillingContexts(workspaceId: string) {
  const contexts = await Promise.all(
    SOFTWARE_BILLING_PROVIDER_SLUGS.map((slug) => buildProviderBillingContext(workspaceId, slug)),
  );
  return Object.fromEntries(contexts.map((context) => [context.providerSlug, context])) as Record<
    SoftwareProviderSlug,
    ProviderBillingContext
  >;
}
