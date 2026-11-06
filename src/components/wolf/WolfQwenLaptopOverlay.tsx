"use client";

import { useEffect, useState, type RefObject } from "react";

import {
  laptopOverlayPixels,
  type LaptopBox,
  type SceneObject,
  type SceneOverlay,
} from "@/lib/wolf/qwen-laptop-overlay";

const SAMPLE_MS = 4_000;
const SAMPLE_WIDTH = 640;

type Placement = {
  left: number;
  top: number;
  width: number;
  height: number;
  labelTop: number;
};

type DrawnObject = SceneObject & { placement: Placement | null };

function captureJpeg(video: HTMLVideoElement): Promise<Blob | null> {
  const scale = Math.min(1, SAMPLE_WIDTH / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(2, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
  });
}

function placeBox(video: HTMLVideoElement, box: LaptopBox): Placement | null {
  const parent = video.parentElement;
  if (!parent) return null;
  return laptopOverlayPixels(
    { width: parent.clientWidth, height: parent.clientHeight },
    { width: video.videoWidth, height: video.videoHeight },
    box,
  );
}

function drawObjects(video: HTMLVideoElement | null, objects: SceneObject[]): DrawnObject[] {
  return objects.map((object) => ({
    ...object,
    placement: video && object.box ? placeBox(video, object.box) : null,
  }));
}

export default function WolfQwenLaptopOverlay({
  videoRef,
  preview,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  preview?: { reading: SceneOverlay; drawn?: DrawnObject[]; note?: string | null };
}) {
  const [drawn, setDrawn] = useState<DrawnObject[]>(preview?.drawn ?? []);
  const [note, setNote] = useState<string | null>(preview?.note ?? null);

  useEffect(() => {
    if (preview) return undefined;
    let stopped = false;
    let busy = false;
    let latest: SceneObject[] = [];

    const position = () => {
      setDrawn(drawObjects(videoRef.current, latest));
    };

    const tick = async () => {
      if (stopped || busy) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth < 2) return;
      busy = true;
      try {
        const jpeg = await captureJpeg(video);
        if (!jpeg || stopped) return;
        const response = await fetch("/api/wolf/live/qwen-overlay", {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: jpeg,
        });
        const data = (await response.json().catch(() => null)) as
          | (SceneOverlay & { error?: string | null })
          | null;
        if (stopped) return;
        if (!response.ok || !data) {
          setNote(data?.error || "Qwen could not read this frame.");
          if (response.status === 401 || response.status === 403 || response.status === 503) stopped = true;
          return;
        }
        setNote(null);
        latest = Array.isArray(data.objects) ? data.objects : [];
        position();
      } catch {
        if (!stopped) setNote("Qwen could not read this frame.");
      } finally {
        busy = false;
      }
    };

    const timer = window.setInterval(() => {
      void tick();
    }, SAMPLE_MS);
    void tick();
    window.addEventListener("resize", position);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("resize", position);
    };
  }, [preview, videoRef]);

  const unplaced = drawn.filter((object) => !object.placement);

  return (
    <div className="pointer-events-none absolute inset-0" aria-live="polite">
      {drawn.map((object, index) =>
        object.placement ? (
          <div
            key={`${object.label}-${index}`}
            className="absolute border-2 border-emerald-300"
            style={{
              left: object.placement.left,
              top: object.placement.top,
              width: object.placement.width,
              height: object.placement.height,
            }}
          >
            <span
              className="absolute left-0 whitespace-nowrap rounded bg-emerald-400 px-2 py-0.5 text-xs font-semibold text-black"
              style={{ top: object.placement.labelTop }}
            >
              {object.label}
            </span>
          </div>
        ) : null,
      )}
      {unplaced.length > 0 ? (
        <span className="absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-emerald-400 px-2 py-0.5 text-xs font-semibold text-black">
          {unplaced.map((object) => object.label).join(", ")}
        </span>
      ) : null}
      {note ? <p className="absolute inset-x-3 bottom-12 text-xs text-white/80">{note}</p> : null}
    </div>
  );
}
