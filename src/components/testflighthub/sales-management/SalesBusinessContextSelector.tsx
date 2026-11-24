"use client";

import { SALES_CONTEXT_OPTIONS } from "@/lib/sales-business-context-ui";
import type { SalesBusinessContext } from "@/lib/sales-business-context";
import { cn } from "@/lib/utils";

export function SalesBusinessContextSelector({
  context,
  onChange,
  variant = "page",
}: {
  context: SalesBusinessContext;
  onChange: (context: SalesBusinessContext) => void;
  variant?: "page" | "sidebar";
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Sales business"
      data-sales-context={context}
      className={cn("flex gap-1.5", variant === "sidebar" ? "flex-col" : "flex-wrap")}
    >
      {SALES_CONTEXT_OPTIONS.map((option) => {
        const selected = option.id === context;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border font-semibold tracking-[0.04em] transition-colors",
              variant === "sidebar"
                ? "min-h-7 px-2 text-[10px]"
                : "min-h-10 px-4 text-sm",
              selected
                ? "border-sky-300/50 bg-[#1F4FBF] text-white"
                : "border-white/15 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.07] hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
