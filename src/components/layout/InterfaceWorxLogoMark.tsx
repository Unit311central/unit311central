"use client";

import {
  INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_HEIGHT,
  INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_WIDTH,
  INTERFACE_WORX_WORKSPACE_LOGO_SRC,
  isInterfaceWorxSlug,
} from "@/lib/interface-worx-surface";
import { cn } from "@/lib/utils";

export { isInterfaceWorxSlug, INTERFACE_WORX_WORKSPACE_LOGO_SRC };

type InterfaceWorxLogoMarkProps = {
  className?: string;
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Interface Worx workspace wordmark — white + brand orange on transparent (sidebar).
 */
export default function InterfaceWorxLogoMark({
  className,
  height = 32,
  maxWidth = 180,
  priority = false,
}: InterfaceWorxLogoMarkProps) {
  let width = Math.round(
    (height * INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_WIDTH) /
      INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_HEIGHT,
  );
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round(
      (width * INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_HEIGHT) /
        INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_WIDTH,
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
        src={INTERFACE_WORX_WORKSPACE_LOGO_SRC}
        alt="Interface Worx"
        width={width}
        height={displayHeight}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="block bg-transparent object-contain object-left"
        style={{
          height: displayHeight,
          width,
          minWidth: width,
          maxWidth,
        }}
      />
    </span>
  );
}
