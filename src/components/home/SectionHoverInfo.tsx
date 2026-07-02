"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHoverInfoProps = {
  children: ReactNode;
  title: string;
  description: string;
  variant?: "light" | "dark" | "soft";
  placement?: "top" | "bottom";
  highlight?: boolean;
  className?: string;
};

export default function SectionHoverInfo({
  children,
  title,
  description,
  variant = "light",
  placement = "bottom",
  highlight = true,
  className,
}: SectionHoverInfoProps) {
  const panelClass =
    variant === "soft"
      ? "border-black/[0.08] bg-[#fafafa] text-black shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
      : variant === "light"
        ? "border-[#d7e3f4] bg-white text-[#1a2b4a] shadow-[0_16px_40px_rgba(11,45,99,0.18)]"
        : "border-white/15 bg-[#0b1118]/95 text-white shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm";

  const titleClass =
    variant === "soft" ? "text-black" : variant === "light" ? "text-[#1a2b4a]" : "text-white";
  const bodyClass =
    variant === "soft"
      ? "text-black/75"
      : variant === "light"
        ? "text-[#1a2b4a]/70"
        : "text-white/70";

  return (
    <div className={cn("group relative", className)}>
      <div
        className={cn(
          highlight &&
            "rounded-lg transition-[box-shadow,border-color] duration-200 group-hover:shadow-[0_0_28px_rgba(56,189,248,0.14)] group-focus-within:shadow-[0_0_28px_rgba(56,189,248,0.14)] [&>*]:transition-colors [&>*]:duration-200 group-hover:[&>*]:border-sky-400/35 group-focus-within:[&>*]:border-sky-400/35",
        )}
      >
        {children}
      </div>
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-[min(300px,calc(100vw-2.5rem))] -translate-x-1/2 rounded-xl border px-4 py-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100",
          placement === "top" ? "bottom-full mb-3" : "top-full mt-3",
          panelClass,
        )}
      >
        <p className={cn("text-sm font-semibold", titleClass)}>{title}</p>
        <p className={cn("mt-1.5 text-xs leading-relaxed", bodyClass)}>{description}</p>
      </div>
    </div>
  );
}
