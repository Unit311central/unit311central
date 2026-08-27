"use client";

import type { WolfEstateMetrics } from "@/lib/wolf/central/types";
import { wolfCardClass, wolfMetricLabelClass, wolfMetricValueClass } from "@/components/wolf/wolf-ui";

type WolfEstateMetricsProps = {
  metrics: WolfEstateMetrics;
};

export default function WolfEstateMetricsPanel({ metrics }: WolfEstateMetricsProps) {
  const items = [
    { label: "Demo reserves", value: metrics.reserveCount },
    { label: "Large drones", value: metrics.largeDrones },
    { label: "Small drones", value: metrics.smallDrones },
    { label: "Total aircraft", value: metrics.totalAircraft },
    { label: "Docks", value: metrics.docks },
    { label: "Batteries", value: metrics.batteries },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className={`${wolfCardClass} px-4 py-4`}>
          <div className={wolfMetricValueClass}>{item.value}</div>
          <div className={wolfMetricLabelClass}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}
