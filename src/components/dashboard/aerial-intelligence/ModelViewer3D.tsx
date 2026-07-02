"use client";

import Script from "next/script";
import { useState } from "react";

import FullscreenOverlay, { FullscreenButton } from "./FullscreenOverlay";
import ViewerCard from "./ViewerCard";

type ModelViewerPanelProps = {
  src: string;
  className?: string;
};

function ModelViewerPanel({ src, className }: ModelViewerPanelProps) {
  return (
    <div className={className}>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        strategy="afterInteractive"
      />
      {/* model-viewer custom element loaded from CDN */}
      <model-viewer
        src={src}
        alt="Textured 3D survey mesh"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="0.85"
        exposure="1"
        auto-rotate
        style={{
          width: "100%",
          height: "100%",
          minHeight: "320px",
          background:
            "radial-gradient(circle at 50% 35%, rgba(37, 99, 235, 0.12), rgba(5, 8, 22, 0.95))",
        }}
      />
    </div>
  );
}

type ModelViewer3DProps = {
  modelUrl: string;
};

export default function ModelViewer3D({ modelUrl }: ModelViewer3DProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <ViewerCard
        title="3D Model"
        description="Textured mesh for orbit, rotate, and zoom review of structures and terrain."
        badge="Live"
        badgeClassName="border-amber-400/30 bg-amber-500/10 text-amber-300"
        actions={<FullscreenButton onClick={() => setFullscreen(true)} />}
      >
        <ModelViewerPanel src={modelUrl} className="h-full min-h-[320px]" />
      </ViewerCard>

      <FullscreenOverlay open={fullscreen} title="3D Model" onClose={() => setFullscreen(false)}>
        <ModelViewerPanel
          src={modelUrl}
          className="h-full min-h-0 overflow-hidden rounded-xl border border-white/[0.08]"
        />
      </FullscreenOverlay>
    </>
  );
}
