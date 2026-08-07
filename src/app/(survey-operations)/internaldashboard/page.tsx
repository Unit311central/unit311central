import { Suspense } from "react";
import { headers } from "next/headers";

import InternalOperationsDashboard from "@/components/testflighthub/InternalOperationsDashboard";
import WorkspaceLoadingFallback from "@/components/testflighthub/WorkspaceLoadingFallback";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { resolveInternalOperationsBasePath } from "@/lib/internal-operations-data";
import { WorkspaceReportingCurrencyProvider } from "@/lib/workspace-reporting-currency";

export default async function InternalDashboardPage() {
  const requestHeaders = await headers();
  const host = getRequestHost({ headers: requestHeaders });
  const basePath = resolveInternalOperationsBasePath(host);
  const workspaceSlug = parseClientPlatformSubdomainSafe(host) ?? "";
  const reportingCurrency = resolveSlugReportingCurrency(workspaceSlug);

  return (
    <WorkspaceReportingCurrencyProvider currency={reportingCurrency}>
      <Suspense fallback={<WorkspaceLoadingFallback variant="page" label="Loading operations shell" />}>
        <InternalOperationsDashboard basePath={basePath} />
      </Suspense>
    </WorkspaceReportingCurrencyProvider>
  );
}
