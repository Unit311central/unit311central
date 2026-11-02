"use client";

import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";

import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { wolfTestGroundPlaybackPath } from "@/lib/wolf/live-stream-proxy";

type StreamStatus = "connecting" | "live" | "failed";

const RETRY_MS = 4000;

function statusLabel(status: StreamStatus): string {
  switch (status) {
    case "connecting":
      return "Connecting";
    case "live":
      return "Live";
    case "failed":
      return "Connection failed";
  }
}

export default function WolfTestGroundWorkspace() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<StreamStatus>("connecting");
  const [statusDetail, setStatusDetail] = useState<string | null>(null);
  const [needsGesture, setNeedsGesture] = useState(false);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const destroyPlayer = useCallback(() => {
    clearRetry();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.removeAttribute("src");
      video.load();
    }
  }, [clearRetry]);

  const attachStream = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    destroyPlayer();
    video.muted = true;
    video.defaultMuted = true;
    setStatus("connecting");
    setStatusDetail(null);
    setNeedsGesture(false);

    const markLive = () => {
      if (video.videoWidth > 0 && video.readyState >= 2) {
        setStatus("live");
        setStatusDetail(null);
        setNeedsGesture(false);
      }
    };

    const scheduleRetry = (detail: string) => {
      setStatus("failed");
      setStatusDetail(detail);
      setNeedsGesture(false);
      clearRetry();
      retryTimerRef.current = setTimeout(() => {
        attachStream();
      }, RETRY_MS);
    };

    const startPlayback = () => {
      const attempt = video.play();
      if (!attempt) return;
      attempt.catch((error: unknown) => {
        const name = error instanceof DOMException ? error.name : "";
        if (name === "NotAllowedError") {
          setNeedsGesture(true);
          setStatusDetail("Press Play to start the video.");
          return;
        }
        scheduleRetry("The stream could not start playback.");
      });
    };

    const streamUrl = wolfTestGroundPlaybackPath();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 8,
      });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startPlayback();
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try {
            hls.recoverMediaError();
            setStatus("connecting");
            return;
          } catch {
            /* retry below */
          }
        }
        const detail =
          data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? "Network error loading the stream."
            : "The stream could not be decoded.";
        scheduleRetry(detail);
      });
      video.addEventListener("loadeddata", markLive);
      video.addEventListener("playing", markLive);
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      return () => {
        video.removeEventListener("loadeddata", markLive);
        video.removeEventListener("playing", markLive);
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl") !== "") {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", markLive);
      video.addEventListener("error", () => {
        scheduleRetry("Native HLS playback error.");
      });
      startPlayback();
      return () => {
        video.removeEventListener("loadedmetadata", markLive);
      };
    }

    scheduleRetry("HLS is not supported in this browser.");
  }, [clearRetry, destroyPlayer]);

  useEffect(() => {
    const cleanup = attachStream();
    return () => {
      cleanup?.();
      destroyPlayer();
    };
  }, [attachStream, destroyPlayer]);

  const playFromGesture = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().then(() => {
      setNeedsGesture(false);
      if (video.videoWidth > 0) setStatus("live");
    });
  };

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>Tools</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">WOLF Test Ground</h1>
        <p className="mt-2 text-sm text-white/70">
          Live video streaming and camera testing environment.
        </p>
      </header>

      <section className={`${wolfCardClass} max-w-4xl overflow-hidden`} aria-label="Live video">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Live Video</h2>
          <span
            className={
              status === "live"
                ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-200"
                : status === "failed"
                  ? "rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-200"
                  : "rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-100"
            }
            role="status"
          >
            {statusLabel(status)}
          </span>
        </div>
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="h-full w-full bg-black object-contain"
            muted
            autoPlay
            playsInline
            controls
          />
          {needsGesture ? (
            <button
              type="button"
              onClick={playFromGesture}
              className="absolute inset-0 m-auto h-12 w-28 rounded-full bg-white text-sm font-semibold text-black"
            >
              Play
            </button>
          ) : null}
        </div>
        {statusDetail ? (
          <p className="px-4 py-3 text-sm text-white/65" role="alert">
            {statusDetail}
          </p>
        ) : null}
      </section>
    </div>
  );
}
