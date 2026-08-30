"use client";

import {
  SAEC_DISCOVERY_LOGO_HEIGHT,
  SAEC_DISCOVERY_LOGO_SRC,
  SAEC_DISCOVERY_LOGO_WIDTH,
} from "@/lib/saec-discovery/branding";
import { cn } from "@/lib/utils";

type SaecDiscoveryLogoProps = {
  className?: string;
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

export default function SaecDiscoveryLogo({
  className,
  height = 36,
  maxWidth = 150,
  priority = false,
}: SaecDiscoveryLogoProps) {
  let width = Math.round((height * SAEC_DISCOVERY_LOGO_WIDTH) / SAEC_DISCOVERY_LOGO_HEIGHT);
  let displayHeight = height;
  if (maxWidth != null && width > maxWidth) {
    width = maxWidth;
    displayHeight = Math.round((width * SAEC_DISCOVERY_LOGO_HEIGHT) / SAEC_DISCOVERY_LOGO_WIDTH);
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
        src={SAEC_DISCOVERY_LOGO_SRC}
        alt="SAEC"
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
