"use client";

import {
  NORTHSTAR_LOGO_INTRINSIC_HEIGHT,
  NORTHSTAR_LOGO_INTRINSIC_WIDTH,
  NORTHSTAR_LOGO_SRC,
  isNorthstarDemoSlug,
} from "@/lib/demo/northstar-surface";
import { cn } from "@/lib/utils";

export { isNorthstarDemoSlug, NORTHSTAR_LOGO_SRC };

type NorthstarLogoMarkProps = {
  className?: string;
  /** Display height in CSS pixels. Width is derived from the asset aspect ratio. */
  height?: number;
  /** Optional max width clamp (keeps aspect ratio). */
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Northstar Industrial Technologies wordmark — white on transparent for dark UI chrome.
 */
export default function NorthstarLogoMark({
  className,
  height = 32,
  maxWidth,
  priority = false,
}: NorthstarLogoMarkProps) {
  let width = Math.round(
    (height * NORTHSTAR_LOGO_INTRINSIC_WIDTH) / NORTHSTAR_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * NORTHSTAR_LOGO_INTRINSIC_HEIGHT) / NORTHSTAR_LOGO_INTRINSIC_WIDTH,
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
        src={NORTHSTAR_LOGO_SRC}
        alt="Northstar Industrial Technologies"
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
