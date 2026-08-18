"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { WorkspaceModuleHeader, workspaceSecondaryButtonClass } from "@/components/workspace-ui";
import { cn } from "@/lib/utils";

export type CentralSubnavItem<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
};

export function centralSubnavAsideClass() {
  return "h-fit rounded-2xl border border-white/15 bg-white/[0.04] p-3";
}

export function centralSubnavItemClass(active: boolean) {
  return cn(
    "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
    active
      ? "border border-sky-400/35 bg-sky-500/15 text-sky-50"
      : "border border-transparent text-white/65 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
  );
}

export function CentralSubnavShell<T extends string>({
  eyebrow,
  title,
  subtitle,
  items,
  activeId,
  onSelect,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  items: CentralSubnavItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  children: ReactNode;
}) {
  const [brandLabel, moduleLabel] =
    eyebrow && eyebrow.includes(" · ")
      ? (eyebrow.split(" · ", 2) as [string, string])
      : eyebrow
        ? [eyebrow, undefined]
        : [undefined, undefined];

  return (
    <div className="space-y-5">
      <WorkspaceModuleHeader
        brandLabel={brandLabel}
        moduleLabel={moduleLabel}
        title={title}
        description={subtitle}
      />

      <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={`${title} sections`} className={centralSubnavAsideClass()}>
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={centralSubnavItemClass(active)}
                  >
                    {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" /> : null}
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function PlaceholderBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
      {children}
    </span>
  );
}

export function ComingSoonButton({ label = "Generate" }: { label?: string }) {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className={cn(workspaceSecondaryButtonClass(true), "cursor-not-allowed opacity-45")}
    >
      {label} · Coming soon
    </button>
  );
}
