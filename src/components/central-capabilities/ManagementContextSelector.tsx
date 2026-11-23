"use client";

import {
  MANAGEMENT_CONTEXT_OPTIONS,
  WOLF_MANAGEMENT_PLACEHOLDER,
  type ManagementContext,
} from "@/lib/central-capabilities/management-context";
import { WorkspaceEmpty, WorkspaceSection } from "@/components/workspace-ui";
import { cn } from "@/lib/utils";

export function ManagementContextSelector({
  context,
  onChange,
}: {
  context: ManagementContext;
  onChange: (context: ManagementContext) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Management context"
      data-management-context={context}
      className="flex flex-wrap gap-2"
    >
      {MANAGEMENT_CONTEXT_OPTIONS.map((option) => {
        const selected = option.id === context;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-xl border px-4 text-sm font-semibold tracking-[0.04em] transition-colors",
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

export function WolfManagementPlaceholder() {
  return (
    <WorkspaceSection
      title={WOLF_MANAGEMENT_PLACEHOLDER.title}
      subtitle={WOLF_MANAGEMENT_PLACEHOLDER.subtitle}
    >
      <WorkspaceEmpty message={WOLF_MANAGEMENT_PLACEHOLDER.message} />
    </WorkspaceSection>
  );
}
