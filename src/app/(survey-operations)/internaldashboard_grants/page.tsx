import { Suspense } from "react";

import InternalOperationsDashboard from "@/components/testflighthub/InternalOperationsDashboard";
import { INTERNAL_GRANTS_OPERATIONS_BASE_PATH } from "@/lib/internal-operations-data";

export default function InternalDashboardGrantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[50vh] items-center justify-center bg-[#020617] text-sm text-white/50">
          Loading grants operations workspace...
        </div>
      }
    >
      <InternalOperationsDashboard basePath={INTERNAL_GRANTS_OPERATIONS_BASE_PATH} />
    </Suspense>
  );
}
