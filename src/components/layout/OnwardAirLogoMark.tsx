"use client";

import {
  ONWARDAIR_LOGO_INTRINSIC_HEIGHT,
  ONWARDAIR_LOGO_INTRINSIC_WIDTH,
  ONWARDAIR_LOGO_SRC,
  isOnwardAirSlug,
} from "@/lib/onwardair-surface";
import { cn } from "@/lib/utils";

export { isOnwardAirSlug, ONWARDAIR_LOGO_SRC };

type OnwardAirLogoMarkProps = {
  className?: string;
  /** Display height in CSS pixels. Width is derived from the asset aspect ratio. */
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Canonical OnwardAir wordmark — white mark on transparent (from onwardair.tech).
 */
export default function OnwardAirLogoMark({
  className,
  height = 40,
  maxWidth,
  priority = false,
}: OnwardAirLogoMarkProps) {
  let width = Math.round(
    (height * ONWARDAIR_LOGO_INTRINSIC_WIDTH) / ONWARDAIR_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * ONWARDAIR_LOGO_INTRINSIC_HEIGHT) / ONWARDAIR_LOGO_INTRINSIC_WIDTH,
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-visible bg-transparent p-0",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ONWARDAIR_LOGO_SRC}
        alt="OnwardAir"
        width={width}
        height={displayHeight}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="block bg-transparent object-contain object-center drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
        style={{
          height: displayHeight,
          width,
          minWidth: width,
          maxWidth: "100%",
        }}
      />
    </span>
  );
}
