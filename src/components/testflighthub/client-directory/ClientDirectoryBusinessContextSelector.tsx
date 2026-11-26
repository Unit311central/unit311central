"use client";

import { CLIENT_DIRECTORY_CONTEXT_OPTIONS } from "@/lib/client-directory-business-context";
import type { ClientDirectoryBusinessContext } from "@/lib/client-directory-business-context";
import { isClientDirectoryBusinessContext } from "@/lib/client-directory-business-context";
import { cn } from "@/lib/utils";

type ClientDirectoryBusinessContextSelectorProps = {
  value: ClientDirectoryBusinessContext;
  onChange: (next: ClientDirectoryBusinessContext) => void;
  className?: string;
};

export function ClientDirectoryBusinessContextSelector({
  value,
  onChange,
  className,
}: ClientDirectoryBusinessContextSelectorProps) {
  return (
    <div
      className={cn(
        "relative z-20 flex min-w-[12rem] shrink-0 flex-col gap-1 rounded-xl border border-sky-400/35 bg-sky-500/[0.08] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:min-w-[14.5rem]",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200/90">
        Business context
      </span>
      <select
        aria-label="Client directory business context"
        data-client-directory-context={value}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (isClientDirectoryBusinessContext(next)) onChange(next);
        }}
        className="w-full min-w-[11rem] max-w-full appearance-none rounded-lg border border-white/20 bg-[#0b1524] px-3 py-2.5 pr-9 text-sm font-semibold text-white outline-none focus:border-sky-300/55"
        style={{ backgroundImage: "none" }}
      >
        {CLIENT_DIRECTORY_CONTEXT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-[10px] leading-snug text-white/40">Scoped client book for this workspace.</p>
    </div>
  );
}