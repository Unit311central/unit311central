"use client";

import { useEffect, useRef, useState } from "react";

import {
  MISSION_REPLAY_HUD,
  MISSION_REPLAY_SCENE_MS,
  MISSION_REPLAY_SCENES,
  MISSION_REPLAY_VIDEO,
} from "@/lib/mission-replay";
import { cn } from "@/lib/utils";
import { PlayCircle } from "lucide-react";

function VideoGrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frameId = 0;
    let seed = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      seed += 1;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(255,255,255,0.022)";
      for (let index = 0; index < 90; index += 1) {
        const x = ((index * 83 + seed * 11) % width) | 0;
        const y = ((index * 47 + seed * 17) % height) | 0;
        context.fillRect(x, y, 1, 1);
      }
      frameId = window.requestAnimationFrame(draw);
    };

    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40 mix-blend-overlay"
      aria-hidden
    />
  );
}

const hudItems = [
  { label: "Mission", value: MISSION_REPLAY_HUD.mission },
  { label: "Drone", value: MISSION_REPLAY_HUD.drone },
  { label: "Flight time", value: MISSION_REPLAY_HUD.flightTime },
  { label: "Images captured", value: MISSION_REPLAY_HUD.imagesCaptured },
  { label: "Processing", value: MISSION_REPLAY_HUD.processing },
  { label: "Resolution", value: MISSION_REPLAY_HUD.resolution },
];

export default function MissionReplayPlayer() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scene = MISSION_REPLAY_SCENES[sceneIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % MISSION_REPLAY_SCENES.length);
    }, MISSION_REPLAY_SCENE_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {
      /* autoplay blocked until interaction */
    });
  }, []);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1B2A] shadow-[0_24px_56px_rgba(0,0,0,0.35)]"
      aria-label="Mission replay demonstration"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            Mission replay
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Aerial survey demonstration</h2>
          <p className="mt-1 text-xs text-white/45">
            Simulated industrial mission workflow — not a live survey recording.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-200">
          <PlayCircle className="h-3 w-3" />
          Demo replay
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-[#020617]">
        <video
          ref={videoRef}
          className={cn(
            "mission-replay-video h-full w-full object-cover transition-[filter,transform] duration-700",
            `mission-replay-scene-${scene.id}`,
          )}
          src={MISSION_REPLAY_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Demonstration aerial survey replay"
        />

        <div className="mission-replay-scene-overlay pointer-events-none absolute inset-0" data-scene={scene.id} />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050816]/55 via-transparent to-[#050816]/75" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
        <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/10 sm:inset-5" />
        <VideoGrainOverlay />

        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[min(100%,20rem)] rounded-xl border border-white/10 bg-[#050816]/72 px-3 py-2.5 backdrop-blur-md sm:left-5 sm:top-5 sm:px-4 sm:py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#60a5fa]">
            Mission HUD
          </p>
          <dl className="mt-2 space-y-1.5">
            {hudItems.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-3 text-[11px]">
                <dt className="text-white/40">{item.label}</dt>
                <dd className="text-right font-medium text-white/85">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 sm:bottom-5 sm:left-5 sm:right-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="rounded-xl border border-white/10 bg-[#050816]/72 px-4 py-3 backdrop-blur-md">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/90">
                Scene {sceneIndex + 1} / {MISSION_REPLAY_SCENES.length}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{scene.label}</p>
              <p className="mt-0.5 text-xs text-white/50">{scene.caption}</p>
            </div>

            <div className="hidden gap-1 sm:flex">
              {MISSION_REPLAY_SCENES.map((item, index) => (
                <span
                  key={item.id}
                  className={cn(
                    "h-1 w-5 rounded-full transition-colors",
                    index === sceneIndex ? "bg-sky-400" : "bg-white/15",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {scene.id === "measure" ? (
          <>
            <div className="pointer-events-none absolute left-[20%] top-[28%] z-10 rounded-md border border-red-400/40 bg-red-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-200">
              Cut 1,240 m³
            </div>
            <div className="pointer-events-none absolute right-[22%] bottom-[30%] z-10 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
              Fill 860 m³
            </div>
          </>
        ) : null}

        {scene.id === "complete" ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#050816]/35 backdrop-blur-[1px]">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-4 text-center shadow-[0_0_48px_rgba(16,185,129,0.15)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Survey complete
              </p>
              <p className="mt-1 text-xl font-semibold text-white">Deliverables ready</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
