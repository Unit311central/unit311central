"use client";

import type { ReactNode } from "react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { cn } from "@/lib/utils";

import {
  getWorkspaceUiTheme,
  workspaceInputClass,
  workspaceLabelClass,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
  type WorkspaceUiThemeId,
} from "./theme";

export function WorkspaceSection({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function WorkspaceKpiTile({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string | number;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums text-white", valueClassName)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

export function WorkspaceStatusPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function WorkspaceEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
      {message}
    </div>
  );
}

export function WorkspaceSlideOver({
  title,
  subtitle,
  onClose,
  children,
  footer,
  themeId,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  themeId?: WorkspaceUiThemeId;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close panel"
        className="flex-1 cursor-default"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0b1524] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className={workspaceSecondaryButtonClass(false, themeId)}>
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="border-t border-white/10 px-5 py-4">{footer}</footer> : null}
      </aside>
    </div>
  );
}

export function WorkspaceModuleHeader({
  moduleLabel,
  title,
  description,
  actions,
  themeId = "default",
  brandLabel,
}: {
  moduleLabel: string;
  title: string;
  description: string;
  actions?: ReactNode;
  themeId?: WorkspaceUiThemeId;
  brandLabel?: string;
}) {
  const theme = getWorkspaceUiTheme(themeId);
  const isTalanton = themeId === "talanton-emerald";

  return (
    <header
      className={cn(
        isTalanton
          ? theme.moduleHeaderClassName
          : "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-7 sm:py-7",
      )}
    >
      {isTalanton ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
        />
      ) : null}
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {brandLabel ? (
            <p className={theme.moduleHeaderEyebrowClassName ?? "text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55"}>
              {brandLabel}
            </p>
          ) : null}
          <p
            className={cn(
              theme.moduleHeaderAccentClassName ?? "mt-1.5 text-[11px] font-medium tracking-wide text-white/45",
              !brandLabel && "mt-0",
            )}
          >
            {moduleLabel}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

export function WorkspaceGeneratedPanel({
  title,
  eyebrow,
  copyText,
  children,
  className,
  themeId = "default",
}: {
  title: string;
  eyebrow?: string;
  copyText: string;
  children: ReactNode;
  className?: string;
  themeId?: WorkspaceUiThemeId;
}) {
  const theme = getWorkspaceUiTheme(themeId);
  const isTalanton = themeId === "talanton-emerald";

  return (
    <section
      className={cn(
        isTalanton
          ? theme.generatedPanelClassName
          : "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6",
        className,
      )}
    >
      {isTalanton ? (
        <div aria-hidden className={theme.generatedPanelAccentLineClassName} />
      ) : null}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        </div>
        <CopyToClipboardButton text={copyText} className="shrink-0" />
      </div>
      {children}
    </section>
  );
}

export function WorkspaceImpactMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "watch" | "alert" | "good";
}) {
  const valueClass =
    tone === "alert"
      ? "text-rose-200"
      : tone === "watch"
        ? "text-amber-200"
        : tone === "good"
          ? "text-emerald-200"
          : "text-white";

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-white/40">{hint}</p> : null}
    </div>
  );
}

export {
  workspaceInputClass,
  workspaceLabelClass,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
  type WorkspaceUiThemeId,
};
