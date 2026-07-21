"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import {
  enterpriseButtonClassName,
  enterpriseCardClassName,
  enterpriseInputClassName,
  enterpriseMetaClassName,
  enterpriseTokens,
  type EnterpriseCardSize,
} from "@/lib/enterprise-ui";
import { cn } from "@/lib/utils";

type EnterpriseCardProps = {
  size?: EnterpriseCardSize;
  title?: string;
  meta?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

/**
 * Shared enterprise card — header / body / footer only.
 * Prefer this over one-off panel shells.
 */
export function EnterpriseCard({
  size,
  title,
  meta,
  actions,
  footer,
  children,
  className,
  interactive,
}: EnterpriseCardProps) {
  return (
    <section className={enterpriseCardClassName({ size, interactive, className })}>
      {(title || meta || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {meta ? <p className={enterpriseMetaClassName()}>{meta}</p> : null}
            {title ? (
              <h2 className={cn(enterpriseTokens.type.cardHeading, meta && "mt-0.5")}>{title}</h2>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="min-h-0 flex-1">{children}</div>
      {footer ? (
        <footer className="mt-3 border-t border-white/10 pt-3">{footer}</footer>
      ) : null}
    </section>
  );
}

export function EnterpriseEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  aiSuggestion,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  aiSuggestion?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45"
        aria-hidden
      >
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className={enterpriseTokens.type.section}>{title}</p>
      <p className={cn(enterpriseTokens.type.body, "mt-2 max-w-md")}>{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(enterpriseButtonClassName("primary"), "mt-4")}
        >
          {actionLabel}
        </button>
      ) : null}
      {aiSuggestion ? (
        <p className={cn(enterpriseTokens.type.helper, "mt-3 max-w-sm")}>
          AI suggestion · {aiSuggestion}
        </p>
      ) : null}
    </div>
  );
}

export function EnterpriseSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-10 animate-pulse rounded-xl border border-white/5 bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

export function EnterprisePageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className={enterpriseMetaClassName()}>{eyebrow}</p> : null}
        <h1 className={cn(enterpriseTokens.type.pageTitle, eyebrow && "mt-0.5")}>{title}</h1>
        {description ? (
          <p className={cn(enterpriseTokens.type.body, "mt-1 max-w-2xl")}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Standard data-table chrome: sticky header, toolbar slots, empty/skeleton. */
export function EnterpriseTableShell({
  title,
  meta,
  toolbar,
  loading,
  empty,
  children,
  className,
}: {
  title?: string;
  meta?: string;
  toolbar?: ReactNode;
  loading?: boolean;
  empty?: ReactNode | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <EnterpriseCard title={title} meta={meta} className={className}>
      {toolbar ? <div className="mb-3 flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      {loading ? (
        <EnterpriseSkeleton rows={5} />
      ) : empty ? (
        empty
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-full [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1] [&_thead]:bg-[#0b1524] [&_th]:border-b [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[10px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.14em] [&_th]:text-white/40 [&_td]:border-b [&_td]:border-white/5 [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-white/80">
            {children}
          </div>
        </div>
      )}
    </EnterpriseCard>
  );
}

export function EnterpriseSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={enterpriseInputClassName(cn("h-9 max-w-xs", className))}
      aria-label={placeholder}
    />
  );
}

export function EnterpriseFormField({
  label,
  htmlFor,
  helper,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className={enterpriseTokens.type.label}>
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      {!error && helper ? <p className={enterpriseTokens.type.helper}>{helper}</p> : null}
    </div>
  );
}

export function EnterpriseToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-center gap-2", className)}>{children}</div>
  );
}
