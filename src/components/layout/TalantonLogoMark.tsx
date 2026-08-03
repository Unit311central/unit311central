"use client";

import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { cn } from "@/lib/utils";

/**
 * Official Talanton wordmark from talantonimpact.com —
 * transparent PNG, white lettering + gradient arcs (for dark surfaces).
 */
export const TALANTON_LOGO_SRC = "/images/workspaces/talantonimpact-logo.png";

/** Intrinsic pixel size of talantonimpact-logo.png */
export const TALANTON_LOGO_INTRINSIC_WIDTH = 1853;
export const TALANTON_LOGO_INTRINSIC_HEIGHT = 320;

export { isTalantonImpactSlug };

type TalantonLogoMarkProps = {
  className?: string;
  /** Display height in CSS pixels. Width is derived from the asset aspect ratio. */
  height?: number;
  /** Optional max width clamp (keeps aspect ratio). */
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Canonical Talanton brand mark — transparent PNG, no card / well / padding.
 * White lettering + gradient arcs for navy sidebars and dark login surfaces.
 */
export default function TalantonLogoMark({
  className,
  height = 40,
  maxWidth,
  priority = false,
}: TalantonLogoMarkProps) {
  let width = Math.round(
    (height * TALANTON_LOGO_INTRINSIC_WIDTH) / TALANTON_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * TALANTON_LOGO_INTRINSIC_HEIGHT) / TALANTON_LOGO_INTRINSIC_WIDTH,
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
        src={TALANTON_LOGO_SRC}
        alt="Talanton Impact"
        width={width}
        height={displayHeight}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="block bg-transparent object-contain object-left"
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
