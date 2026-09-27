"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { WOLF_AI_WILDLIFE_VISION_VIDEO_SRC } from "@/lib/wolf/ai-wildlife-vision/config";
import { createWildlifeVisionDetectionProvider } from "@/lib/wolf/ai-wildlife-vision/detection-provider";
import { wolfCardClass, wolfEyebrowClass } from "@/components/wolf/wolf-ui";
import { cn } from "@/lib/utils";

/** Compact AI Wildlife Vision player for the public marketing site (simulated detections). */
export default function WolfRealtimeAiVisionCompact() {
  const detectionProvider = useMemo(() => createWildlifeVisionDetectionProvider("simulated"), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detections, setDetections] = useState(() => detectionProvider.getDetectionsAt(0));
  const [totalUnique, setTotalUnique] = useState(0);

  const syncFromVideo = useCallback(
    (timeSec: number) => {
      setDetections(detectionProvider.getDetectionsAt(timeSec));
      setTotalUnique(detectionProvider.getUniqueCountsAt(timeSec).totalUnique);
    },
    [detectionProvider],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => syncFromVideo(video.currentTime);
    video.addEventListener("timeupdate", onTime);
    void video.play().catch(() => undefined);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [syncFromVideo]);

  return (
    <div className={cn(wolfCardClass, "overflow-hidden bg-[#080c0a]")}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className={wolfEyebrowClass}>WOLF Central · AI Wildlife Vision</p>
          <p className="text-xs text-white/45">Tools demo — aerial survey detection UI</p>
        </div>
        <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-200">
          Simulated · demonstration
        </span>
      </div>
      <div className="relative aspect-video w-full bg-[#020617]">
        <video
          ref={videoRef}
          src={WOLF_AI_WILDLIFE_VISION_VIDEO_SRC}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="WOLF AI wildlife vision demonstration video with simulated detections"
        />
        {detections.map((detection) => (
          <div
            key={detection.trackId}
            className="pointer-events-none absolute rounded border border-emerald-400/70 bg-emerald-500/10"
            style={{
              left: `${detection.box.x * 100}%`,
              top: `${detection.box.y * 100}%`,
              width: `${detection.box.width * 100}%`,
              height: `${detection.box.height * 100}%`,
            }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-200">
              {detection.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
        <span>Unique animals (simulated count)</span>
        <span className="font-semibold text-emerald-200/90">{totalUnique}</span>
      </div>
    </div>
  );
}
