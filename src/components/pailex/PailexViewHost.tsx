"use client";

import PailexDashboard from "@/components/pailex/PailexDashboard";
import PailexModuleWorkspace from "@/components/pailex/PailexModuleWorkspace";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { resolvePailexModulePage } from "@/lib/pailex/pailex-module-config";
import { isPailexOperationalView } from "@/lib/pailex/pailex-views";

export default function PailexViewHost({ view }: { view: InternalOperationsView }) {
  if (view === "pailex-dashboard") {
    return <PailexDashboard />;
  }

  if (!isPailexOperationalView(view)) {
    return null;
  }

  const config = resolvePailexModulePage(view);
  if (!config) return null;

  return <PailexModuleWorkspace config={config} />;
}
