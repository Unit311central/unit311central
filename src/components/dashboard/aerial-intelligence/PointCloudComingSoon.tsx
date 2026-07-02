"use client";

import { Cloud } from "lucide-react";

import ViewerCard from "./ViewerCard";

type PointCloudComingSoonProps = {
  pointCount?: number | null;
};

function formatPointCount(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return value.toLocaleString("en-GB");
}

export default function PointCloudComingSoon({ pointCount }: PointCloudComingSoonProps) {
  const formattedCount = formatPointCount(pointCount ?? null);

  return (
    <ViewerCard
      title="Point Cloud"
      description="Dense georeferenced point cloud for measurement-ready spatial analysis."
      badge="Coming soon"
      badgeClassName="border-violet-400/30 bg-violet-500/10 text-violet-300"
    >
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
        <div className="scan-point-cloud relative flex h-36 w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border border-violet-400/15 bg-[#08111f]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.12),transparent_65%)]" />
          <Cloud className="relative h-12 w-12 text-violet-300/80" strokeWidth={1.25} />
        </div>

        <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/55">
          LAZ point cloud visualisation is coming soon with an integrated Potree viewer for on-portal
          measurement and classification.
        </p>

        {formattedCount ? (
          <p className="mt-3 text-xs text-white/35">
            {formattedCount} points processed in this survey.
          </p>
        ) : null}
      </div>
    </ViewerCard>
  );
}
