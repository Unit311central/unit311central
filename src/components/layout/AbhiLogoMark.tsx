"use client";

import {
  ABHI_LOGO_INTRINSIC_HEIGHT,
  ABHI_LOGO_INTRINSIC_WIDTH,
  ABHI_LOGO_SRC,
  isAbhiSlug,
} from "@/lib/abhi-surface";
import { cn } from "@/lib/utils";

export { isAbhiSlug, ABHI_LOGO_SRC };

type AbhiLogoMarkProps = {
  className?: string;
  /** Display height in CSS pixels. Width is derived from the asset aspect ratio. */
  height?: number;
  /** Optional max width clamp (keeps aspect ratio). */
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Canonical ABHI brand mark — transparent PNG, no card / well / padding.
 * Use on login, sidebar, portals, and any dark or light application surface.
 */
export default function AbhiLogoMark({
  className,
  height = 40,
  maxWidth,
  priority = false,
}: AbhiLogoMarkProps) {
  let width = Math.round(
    (height * ABHI_LOGO_INTRINSIC_WIDTH) / ABHI_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * ABHI_LOGO_INTRINSIC_HEIGHT) / ABHI_LOGO_INTRINSIC_WIDTH,
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
        src={ABHI_LOGO_SRC}
        alt="ABHI"
        width={width}
        height={displayHeight}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="block bg-transparent object-contain object-center"
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
