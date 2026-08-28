"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import {
  WOLF_AI_WILDLIFE_VISION_DURATION_SEC,
  WOLF_AI_WILDLIFE_VISION_VIDEO_SRC,
  getWildlifeVisionHudAt,
} from "@/lib/wolf/ai-wildlife-vision/config";
import { createWildlifeVisionDetectionProvider } from "@/lib/wolf/ai-wildlife-vision/detection-provider";
import { WildlifeSpeciesIcon } from "@/lib/wolf/ai-wildlife-vision/species-icons";
import type { WildlifeSpecies, WildlifeUniqueCounts } from "@/lib/wolf/ai-wildlife-vision/types";
import { WILDLIFE_SPECIES, WILDLIFE_SPECIES_LABELS } from "@/lib/wolf/ai-wildlife-vision/types";
import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { cn } from "@/lib/utils";

function formatElapsed(seconds: number): string {
  const clamped = Math.max(0, Math.min(WOLF_AI_WILDLIFE_VISION_DURATION_SEC, seconds));
  const whole = Math.floor(clamped);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function emptyCounts(): WildlifeUniqueCounts["bySpecies"] {
  return {
    zebra: 0,
    eland: 0,
    giraffe: 0,
    wildebeest: 0,
    impala: 0,
    buffalo: 0,
    rhino: 0,
  };
}

function lerpNumber(current: number, target: number, factor: number): number {
  if (Math.abs(target - current) < 0.05) return target;
  return current + (target - current) * factor;
}

function easeCounts(
  current: WildlifeUniqueCounts,
  target: WildlifeUniqueCounts,
  factor: number,
): WildlifeUniqueCounts {
  const bySpecies = { ...current.bySpecies };
  for (const species of WILDLIFE_SPECIES) {
    bySpecies[species] = Math.round(lerpNumber(current.bySpecies[species], target.bySpecies[species], factor));
  }
  const totalUnique = WILDLIFE_SPECIES.reduce((sum, species) => sum + bySpecies[species], 0);
  return { bySpecies, totalUnique };
}

export default function WolfAiWildlifeVisionDemo() {
  const detectionProvider = useMemo(() => createWildlifeVisionDetectionProvider("simulated"), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);

  const [sessionKey, setSessionKey] = useState(0);
  const [playbackTimeSec, setPlaybackTimeSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayCounts, setDisplayCounts] = useState<WildlifeUniqueCounts>({
    bySpecies: emptyCounts(),
    totalUnique: 0,
  });
  const [detections, setDetections] = useState(
    () => detectionProvider.getDetectionsAt(0),
  );

  const syncFromVideo = useCallback(
    (timeSec: number) => {
      const clamped = Math.min(WOLF_AI_WILDLIFE_VISION_DURATION_SEC, Math.max(0, timeSec));
      setPlaybackTimeSec(clamped);
      setDetections(detectionProvider.getDetectionsAt(clamped));
      const targetCounts = detectionProvider.getUniqueCountsAt(clamped);
      setDisplayCounts((current) => easeCounts(current, targetCounts, 0.22));
    },
    [detectionProvider],
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      syncFromVideo(video.currentTime);
      setIsPlaying(!video.paused && !video.ended);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [syncFromVideo]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [tick, sessionKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => {
      // Autoplay may require explicit start — START DEMO handles that.
    });
  }, [sessionKey]);

  const handleStart = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime >= WOLF_AI_WILDLIFE_VISION_DURATION_SEC) {
      video.currentTime = 0;
      syncFromVideo(0);
    }
    try {
      await video.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setDisplayCounts({ bySpecies: emptyCounts(), totalUnique: 0 });
    syncFromVideo(0);
    setSessionKey((value) => value + 1);
    void video.play().catch(() => setIsPlaying(false));
  };

  const elapsedLabel = formatElapsed(playbackTimeSec);
  const durationLabel = formatElapsed(WOLF_AI_WILDLIFE_VISION_DURATION_SEC);
  const hud = getWildlifeVisionHudAt(playbackTimeSec);

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={wolfEyebrowClass}>Tools · Demo</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">AI Wildlife Vision</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            High-altitude aerial survey demonstration — WOLF AI wildlife detection and unique-animal
            tracking over a game reserve.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
            Demo mode
          </span>
          <span className="rounded-full border border-emerald-400/35 bg-emerald-500/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
            Simulated AI detection
          </span>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className={`${wolfCardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                FPV Drone feed
              </p>
              <p className="text-sm font-medium text-white/80">
                African game reserve · high-altitude survey pass
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-300">
              <span className="live-video-pulse h-1.5 w-1.5 rounded-full bg-red-400" />
              Live
            </span>
          </div>

          <div className="relative aspect-video w-full overflow-hidden bg-[#020617]">
            <video
              ref={videoRef}
              key={sessionKey}
              src={WOLF_AI_WILDLIFE_VISION_VIDEO_SRC}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="WOLF AI wildlife vision demo drone feed"
              onTimeUpdate={(event) => syncFromVideo(event.currentTarget.currentTime)}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" aria-hidden />

            <div className="pointer-events-none absolute left-3 top-3 space-y-1 font-mono text-[10px] text-white/90 sm:left-4 sm:top-4 sm:text-[11px]">
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                <span className="text-red-300">●</span> LIVE
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                ALT {hud.altitudeM}m
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                SPD {hud.speedMps}m/s
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                HDG {hud.headingDeg}°
              </p>
            </div>

            <div className="pointer-events-none absolute right-3 top-3 space-y-1 text-right font-mono text-[10px] text-white/90 sm:right-4 sm:top-4 sm:text-[11px]">
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                FOV {hud.fov}
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                MODE {hud.mode}
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                {hud.resolution}
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                {hud.fps} FPS
              </p>
              <p className="rounded border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-sm">
                {elapsedLabel} / {durationLabel}
              </p>
            </div>

            {detections.map((detection) => (
              <div
                key={detection.trackId}
                className="pointer-events-none absolute border border-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.4)]"
                style={{
                  left: `${detection.box.x * 100}%`,
                  top: `${detection.box.y * 100}%`,
                  width: `${detection.box.width * 100}%`,
                  height: `${detection.box.height * 100}%`,
                }}
              >
                <span className="absolute -top-4 left-0 max-w-[9rem] truncate bg-[#39ff14] px-1 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.06em] text-black sm:text-[9px]">
                  {detection.label} {(detection.confidence * 100).toFixed(0)}%
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 border border-[#39ff14] bg-[#39ff14]/30" aria-hidden />
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-white/[0.06] px-4 py-4 sm:px-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleStart()}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-100 transition hover:bg-emerald-500/25"
              >
                <Play className="h-3.5 w-3.5" />
                Start demo
              </button>
              <button
                type="button"
                onClick={handlePause}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/80 transition hover:bg-white/[0.08]"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/80 transition hover:bg-white/[0.08]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["AI detection", "ON"],
                ["Tracking", "ON"],
                ["Video", "LIVE DEMO"],
                ["Model", "WOLF Wildlife Vision"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55 sm:text-[11px]"
                >
                  <span className="text-white/40">{label}:</span>{" "}
                  <span className="text-emerald-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className={`${wolfCardClass} flex flex-col p-4 sm:p-5`}>
          <p className={wolfEyebrowClass}>Live detection summary</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Unique animals</h2>
          <p className="mt-1 text-xs text-white/45">
            Counts accumulate as new individuals enter the frame — not repeated sightings.
          </p>

          <ul className="mt-5 flex-1 space-y-3">
            {WILDLIFE_SPECIES.map((species) => (
              <li key={species} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-sm text-white/70">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-emerald-200/90">
                    <WildlifeSpeciesIcon species={species} className="h-4 w-4" />
                  </span>
                  {WILDLIFE_SPECIES_LABELS[species]}
                </span>
                <CountValue value={displayCounts.bySpecies[species]} />
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-white/[0.08] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Total unique animals
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-emerald-300">
              <CountValue value={displayCounts.totalUnique} large />
            </p>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-white/35">
            Simulated detections for presentation only. Production will connect live drone ingest to the WOLF
            computer-vision pipeline.
          </p>
        </aside>
      </div>

      <p className="mt-4 text-center text-xs text-white/35">
        {isPlaying ? "Analysing demo feed…" : "Press Start demo to begin simulated wildlife vision analysis."}
      </p>
    </div>
  );
}

function CountValue({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums text-emerald-200 transition-all duration-300",
        large ? "text-4xl" : "text-lg",
        value > 0 && "scale-105",
      )}
    >
      {value}
    </span>
  );
}
