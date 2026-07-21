"use client";

import { cn } from "@/lib/utils";

export function TqmsSection({
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

export function TqmsKpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

export function TqmsStatusPill({
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

export function tqmsPrimaryButtonClass(disabled?: boolean) {
  return cn(
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-200 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25",
    disabled && "pointer-events-none opacity-50",
  );
}

export function tqmsSecondaryButtonClass(disabled?: boolean) {
  return cn(
    "inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 transition-colors hover:bg-white/[0.08]",
    disabled && "pointer-events-none opacity-50",
  );
}

export function tqmsInputClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

export function tqmsLabelClass() {
  return "text-[11px] font-medium uppercase tracking-[0.12em] text-white/45";
}

export function TqmsEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/45">
      {message}
    </div>
  );
}

export function TqmsSlideOver({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
          <button
            type="button"
            onClick={onClose}
            className={tqmsSecondaryButtonClass()}
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="border-t border-white/10 px-5 py-4">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
