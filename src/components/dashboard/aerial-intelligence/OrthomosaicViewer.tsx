"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { RasterTileConfig } from "@/lib/webodm-deliverables";
import { Ruler } from "lucide-react";

import FullscreenOverlay, { FullscreenButton } from "./FullscreenOverlay";
import ViewerCard from "./ViewerCard";

const OrthomosaicMap = dynamic(() => import("./OrthomosaicMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-white/40">
      Initialising orthomosaic viewer…
    </div>
  ),
});

type OrthomosaicViewerProps = {
  config: RasterTileConfig;
};

export default function OrthomosaicViewer({ config }: OrthomosaicViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const actions = (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 rounded-xl text-xs text-white/50"
        disabled
        title="Measurements coming soon"
      >
        <Ruler className="h-3.5 w-3.5" />
        Measurements (coming soon)
      </Button>
      <FullscreenButton onClick={() => setFullscreen(true)} />
    </>
  );

  return (
    <>
      <ViewerCard
        hero
        title="Orthomosaic"
        description="Georeferenced aerial mosaic with pan and zoom for site-wide visual intelligence."
        badge="Live"
        badgeClassName="border-sky-400/30 bg-sky-500/10 text-sky-300"
        actions={actions}
      >
        <OrthomosaicMap config={config} className="min-h-[420px]" />
      </ViewerCard>

      <FullscreenOverlay
        open={fullscreen}
        title="Orthomosaic"
        onClose={() => setFullscreen(false)}
      >
        <OrthomosaicMap config={config} className="h-full min-h-0 rounded-xl overflow-hidden border border-white/[0.08]" />
      </FullscreenOverlay>
    </>
  );
}
