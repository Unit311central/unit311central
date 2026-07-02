"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ViewerCardProps = {
  title: string;
  description?: string;
  badge?: string;
  badgeClassName?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  hero?: boolean;
};

export default function ViewerCard({
  title,
  description,
  badge,
  badgeClassName,
  actions,
  children,
  className,
  hero = false,
}: ViewerCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1B2A] shadow-[0_16px_40px_rgba(0,0,0,0.25)]",
        hero && "border-sky-400/15 shadow-[0_24px_56px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
            {badge ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                  badgeClassName ??
                    "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
                )}
              >
                {badge}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="max-w-2xl text-xs leading-relaxed text-white/45">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className={cn("relative", hero ? "min-h-[420px]" : "min-h-[280px]")}>{children}</div>
    </article>
  );
}
