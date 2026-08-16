"use client";

import { isNorthstarDemoSlug, NORTHSTAR_LOGO_SRC } from "@/lib/demo/northstar-surface";
import { cn } from "@/lib/utils";

export { isNorthstarDemoSlug, NORTHSTAR_LOGO_SRC };

type NorthstarLogoMarkProps = {
  className?: string;
  /** Base display height in CSS pixels (wordmark scales ~25% above legacy 32px default). */
  height?: number;
  maxWidth?: number;
  priority?: boolean;
};

/**
 * Northstar wordmark — NORTHSTAR (white) + INDUSTRIAL TECHNOLOGIES (sky blue), equal line width.
 */
export default function NorthstarLogoMark({
  className,
  height = 40,
  maxWidth = 230,
}: NorthstarLogoMarkProps) {
  const titleSize = Math.round(height * 0.38);
  const subtitleSize = Math.round(height * 0.19);

  return (
    <span
      className={cn("inline-flex min-w-0 flex-col items-stretch leading-none bg-transparent", className)}
      style={{ width: maxWidth, maxWidth }}
    >
      <span
        className="block w-full text-center font-bold text-white"
        style={{ fontSize: titleSize, lineHeight: 1.05, letterSpacing: "0.24em" }}
      >
        NORTHSTAR
      </span>
      <span
        className="mt-0.5 block w-full text-center font-semibold uppercase text-sky-400"
        style={{ fontSize: subtitleSize, lineHeight: 1.1, letterSpacing: "0.06em" }}
      >
        Industrial Technologies
      </span>
    </span>
  );
}
