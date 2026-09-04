"use client";

import { wolfCardClass, wolfEyebrowClass, wolfMetricLabelClass, wolfMetricValueClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { WOLF_EMPTY_FLEET_METRICS } from "@/lib/wolf/wolf-empty-dashboards";

export default function WolfFleetSummaryWorkspace() {
  const metrics = WOLF_EMPTY_FLEET_METRICS;

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>Fleet</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Fleet summary</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total aircraft", value: metrics.totalAircraft },
          { label: "Large", value: metrics.largeDrones },
          { label: "Small", value: metrics.smallDrones },
          { label: "Docks", value: metrics.docks },
          { label: "Batteries", value: metrics.batteries },
        ].map((item) => (
          <div key={item.label} className={`${wolfCardClass} px-4 py-4`}>
            <div className={wolfMetricValueClass}>{item.value}</div>
            <div className={wolfMetricLabelClass}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
