"use client";

import { SALES_CONTEXT_OPTIONS } from "@/lib/sales-business-context-ui";
import type { SalesBusinessContext } from "@/lib/sales-business-context";
import { isSalesBusinessContext } from "@/lib/sales-business-context";
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
    <label className={cn("block", variant === "page" && "max-w-xs")}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        Sales
      </span>
      <select
        aria-label="Sales business"
        data-sales-context={context}
        value={context}
        onChange={(event) => {
          const next = event.target.value;
          if (isSalesBusinessContext(next)) onChange(next);
        }}
        className={cn(
          "w-full rounded-lg border border-white/15 bg-[#0b1220] font-semibold text-white outline-none focus:border-sky-300/50",
          variant === "sidebar" ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
        )}
      >
        {SALES_CONTEXT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
