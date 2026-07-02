"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { RasterTileConfig } from "@/lib/webodm-deliverables";

import DsmGeotiffCanvas from "./DsmGeotiffCanvas";
import ElevationLegend from "./ElevationLegend";
import FullscreenOverlay, { FullscreenButton } from "./FullscreenOverlay";
import { useDsmElevationRange } from "./useDsmElevationRange";
import ViewerCard from "./ViewerCard";

const DsmElevationMap = dynamic(() => import("./DsmElevationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-white/40">
      Initialising elevation map…
    </div>
  ),
});

type DsmElevationViewerProps = {
  tileConfig: RasterTileConfig | null;
  geotiffUrl: string | null;
};

function DsmViewerPanel({
  tileConfig,
  geotiffUrl,
  className,
  onRange,
}: {
  tileConfig: RasterTileConfig | null;
  geotiffUrl: string | null;
  className?: string;
  onRange?: (range: { min: number; max: number }) => void;
}) {
  if (tileConfig) {
    return <DsmElevationMap config={tileConfig} className={className} />;
  }

  if (geotiffUrl) {
    return (
      <DsmGeotiffCanvas geotiffUrl={geotiffUrl} className={className} onRange={onRange} />
    );
  }

  return (
    <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-white/40">
      DSM elevation data is not available for this mission.
    </div>
  );
}

export default function DsmElevationViewer({ tileConfig, geotiffUrl }: DsmElevationViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [canvasRange, setCanvasRange] = useState<{ min: number; max: number } | null>(null);
  const { range: sampledRange } = useDsmElevationRange(geotiffUrl);
  const elevationRange = canvasRange ?? sampledRange;

  if (!tileConfig && !geotiffUrl) return null;

  return (
    <>
      <ViewerCard
        hero
        title="Digital Surface Model"
        description="Live elevation surface from the processed DSM with colour ramp visualisation."
        badge="Live"
        badgeClassName="border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
        actions={<FullscreenButton onClick={() => setFullscreen(true)} />}
      >
        <div className="flex h-full min-h-[360px] flex-col lg:flex-row">
          <div className="relative min-h-[360px] flex-1">
            <DsmViewerPanel
              tileConfig={tileConfig}
              geotiffUrl={geotiffUrl}
              onRange={setCanvasRange}
            />
          </div>
          <ElevationLegend range={elevationRange} />
        </div>
      </ViewerCard>

      <FullscreenOverlay
        open={fullscreen}
        title="Digital Surface Model"
        onClose={() => setFullscreen(false)}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] lg:flex-row">
          <div className="relative min-h-0 flex-1">
            <DsmViewerPanel
              tileConfig={tileConfig}
              geotiffUrl={geotiffUrl}
              className="h-full min-h-0"
              onRange={setCanvasRange}
            />
          </div>
          <ElevationLegend range={elevationRange} className="lg:max-w-[11rem]" />
        </div>
      </FullscreenOverlay>
    </>
  );
}
