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
      className="mb-1 ml-6 mr-1 grid gap-0.5"
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
              "h-6 rounded-md px-1.5 text-left font-medium leading-none tracking-[0.04em] transition-colors",
              selected ? "text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white",
            )}
            style={{
              fontSize: 9,
              background: selected ? "#1F4FBF" : "transparent",
            }}
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
