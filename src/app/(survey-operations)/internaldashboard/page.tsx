import { Suspense } from "react";
import { headers } from "next/headers";

import InternalOperationsDashboard from "@/components/testflighthub/InternalOperationsDashboard";
import WorkspaceLoadingFallback from "@/components/testflighthub/WorkspaceLoadingFallback";
import { DEMO_WORKSPACE_SLUG, getRequestHost, isDemoDomainHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { resolveInternalOperationsBasePath } from "@/lib/internal-operations-data";
import { loadOperatorEntitlementsSnapshot } from "@/lib/operator-entitlements-server";
import { getCurrentWorkspace } from "@/lib/workspace-context";
import { WorkspaceReportingCurrencyProvider } from "@/lib/workspace-reporting-currency";
import {
  resolveExecutiveHomeReportingCurrency,
  resolveWorkspaceReportingCurrency,
} from "@/lib/workspace-reporting-currency-server";

export default async function InternalDashboardPage() {
  const requestHeaders = await headers();
  const host = getRequestHost({ headers: requestHeaders });
  const basePath = resolveInternalOperationsBasePath(host);
  const workspaceSlug =
    parseClientPlatformSubdomainSafe(host) ?? (isDemoDomainHost(host) ? DEMO_WORKSPACE_SLUG : "");
  const workspace = await getCurrentWorkspace().catch(() => null);
  const resolvedSlug = workspace?.slug ?? workspaceSlug;
  const reportingCurrency = await resolveWorkspaceReportingCurrency(workspace?.id, resolvedSlug);
  const executiveHomeReportingCurrency = await resolveExecutiveHomeReportingCurrency(
    workspace?.id,
    resolvedSlug,
  );
  const initialEntitlementsSnapshot = await loadOperatorEntitlementsSnapshot(host);

  return (
    <WorkspaceReportingCurrencyProvider currency={reportingCurrency}>
      <Suspense fallback={<WorkspaceLoadingFallback variant="page" label="Loading operations shell" />}>
        <InternalOperationsDashboard
          basePath={basePath}
          executiveHomeReportingCurrency={executiveHomeReportingCurrency}
          initialEntitlementsSnapshot={initialEntitlementsSnapshot}
        />
      </Suspense>
    </WorkspaceReportingCurrencyProvider>
  );
}
