"use client";

import { useEffect, useRef, useState } from "react";
import { fromUrl } from "geotiff";

import { elevationColor } from "@/lib/elevation-colormap";
import type { ElevationRange } from "@/lib/elevation-colormap";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const NODATA_THRESHOLD = -1000;
const MAX_RENDER_SIZE = 900;

function isValidElevation(value: number) {
  return Number.isFinite(value) && value > NODATA_THRESHOLD;
}

type DsmGeotiffCanvasProps = {
  geotiffUrl: string;
  className?: string;
  onRange?: (range: ElevationRange) => void;
};

export default function DsmGeotiffCanvas({
  geotiffUrl,
  className,
  onRange,
}: DsmGeotiffCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    async function renderGeotiff() {
      setLoading(true);
      setError(null);

      try {
        const tiff = await fromUrl(geotiffUrl);
        const image = await tiff.getImage();
        const sourceWidth = image.getWidth();
        const sourceHeight = image.getHeight();
        const scale = Math.min(1, MAX_RENDER_SIZE / Math.max(sourceWidth, sourceHeight));
        const renderWidth = Math.max(1, Math.round(sourceWidth * scale));
        const renderHeight = Math.max(1, Math.round(sourceHeight * scale));

        const rasters = await image.readRasters({
          samples: [0],
          width: renderWidth,
          height: renderHeight,
          resampleMethod: "bilinear",
        });

        const values = rasters[0] as ArrayLike<number>;
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        for (let index = 0; index < values.length; index += 1) {
          const value = values[index];
          if (!isValidElevation(value)) continue;
          min = Math.min(min, value);
          max = Math.max(max, value);
        }

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
          throw new Error("No valid elevation values found in DSM.");
        }

        if (!canvas) {
          throw new Error("Canvas unavailable.");
        }

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable.");

        canvas.width = renderWidth;
        canvas.height = renderHeight;

        const imageData = context.createImageData(renderWidth, renderHeight);
        const rangeSpan = max - min || 1;

        for (let index = 0; index < values.length; index += 1) {
          const value = values[index];
          const pixelIndex = index * 4;

          if (!isValidElevation(value)) {
            imageData.data[pixelIndex + 3] = 0;
            continue;
          }

          const [red, green, blue] = elevationColor((value - min) / rangeSpan);
          imageData.data[pixelIndex] = red;
          imageData.data[pixelIndex + 1] = green;
          imageData.data[pixelIndex + 2] = blue;
          imageData.data[pixelIndex + 3] = 255;
        }

        context.putImageData(imageData, 0, 0);

        if (!cancelled) {
          onRange?.({ min, max });
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Could not render DSM elevation map.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void renderGeotiff();

    return () => {
      cancelled = true;
    };
  }, [geotiffUrl, onRange]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[360px] items-center justify-center overflow-auto bg-[#08111f]",
        className,
      )}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rendering DSM elevation map…
        </div>
      ) : null}
      {error ? (
        <p className="px-6 text-center text-sm text-red-200">{error}</p>
      ) : (
        <canvas ref={canvasRef} className="max-h-full max-w-full object-contain" />
      )}
    </div>
  );
}
