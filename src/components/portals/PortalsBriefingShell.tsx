"use client";

import type { ReactNode } from "react";
import { Manrope } from "next/font/google";

import { cn } from "@/lib/utils";

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export type PortalsBriefingShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared layout chrome for workspace /portals briefing pages.
 * Workspace-specific credential blocks and module editors remain in pack components.
 */
export default function PortalsBriefingShell({ children, className }: PortalsBriefingShellProps) {
  return (
    <div
      className={cn(
        body.className,
        "min-h-screen bg-[#070b14] text-white selection:bg-white/20",
        className,
      )}
    >
      {children}
    </div>
  );
}
