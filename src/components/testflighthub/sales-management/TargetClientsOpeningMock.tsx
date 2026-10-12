"use client";

import { Download, Plus, Search, Upload } from "lucide-react";

import {
  TARGET_CLIENTS_PREVIEW_ROWS,
  type TargetClientPreviewRow,
} from "@/lib/sales-management-target-clients-preview";
import { cn } from "@/lib/utils";

import { SalesTabHeader } from "./sales-management-ui";

function PreviewActionButton({
  primary,
  icon: Icon,
  label,
  caption,
  onClick,
}: {
  primary?: boolean;
  icon: typeof Plus;
  label: string;
  caption?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[42px] min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors sm:px-3.5",
        primary
          ? "border-violet-400/35 bg-violet-500/20 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-violet-500/28"
          : "border-white/12 bg-white/[0.04] text-white/85 hover:border-white/20 hover:bg-white/[0.07]",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", primary ? "text-violet-200" : "text-white/55")} strokeWidth={1.75} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold leading-tight">{label}</span>
        {caption ? (
          <span className="mt-0.5 block truncate text-[10px] font-medium text-white/45">{caption}</span>
        ) : null}
      </span>
    </button>
  );
}

function RowActions() {
  const actionClass =
    "rounded-md px-2 py-1 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white";

  return (
    <div className="flex flex-wrap items-center justify-end gap-0.5">
      <button type="button" className={actionClass} aria-label="Edit (preview)">
        Edit
      </button>
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      <button type="button" className={actionClass} aria-label="View (preview)">
        View
      </button>
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      <button type="button" className={cn(actionClass, "text-red-200/80 hover:text-red-100")} aria-label="Delete (preview)">
        Delete
      </button>
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      <button type="button" className={cn(actionClass, "text-violet-200/90 hover:text-violet-100")} aria-label="Move to Opportunity (preview)">
        Move to Opportunity
      </button>
    </div>
  );
}

function TargetClientRow({ row }: { row: TargetClientPreviewRow }) {
  return (
    <tr className="border-t border-white/10 text-[13px] text-white/80">
      <td className="px-3 py-2.5 font-medium text-white">{row.companyName}</td>
      <td className="max-w-[140px] truncate px-3 py-2.5 text-white/60">{row.website}</td>
      <td className="whitespace-nowrap px-3 py-2.5">{row.sector}</td>
      <td className="whitespace-nowrap px-3 py-2.5">{row.contactName}</td>
      <td className="max-w-[120px] truncate px-3 py-2.5 text-white/65">{row.contactPosition}</td>
      <td className="max-w-[180px] truncate px-3 py-2.5 text-white/60">{row.email}</td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={row.contacted}
          readOnly
          aria-label={`Contacted — ${row.companyName}`}
          className="h-4 w-4 rounded border-white/25 bg-white/5 text-violet-500 accent-violet-500"
        />
      </td>
      <td className="min-w-[220px] px-2 py-2">
        <RowActions />
      </td>
    </tr>
  );
}

/**
 * Visual design preview for Target Clients opening screen (internal.unit311central.com only).
 * No API, import, export, or add-form behaviour.
 */
export default function TargetClientsOpeningMock() {
  return (
    <div className="space-y-4">
      <SalesTabHeader
        title="Target Clients"
        description="Organisations in scope for outbound sales before they become opportunities."
      />

      <div
        className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-2.5"
        role="toolbar"
        aria-label="Target Clients actions"
      >
        <label className="relative flex w-full min-w-0 lg:w-[30%] lg:max-w-[30%] lg:flex-[0_0_30%]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            readOnly
            placeholder="Search name, company, country, city, industry..."
            className="h-[42px] w-full rounded-lg border border-white/12 bg-white/[0.04] py-2 pl-9 pr-3 text-[13px] text-white/90 placeholder:text-white/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            aria-label="Search Target Clients (preview)"
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch">
          <button
            type="button"
            className="flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-400/35 bg-violet-500/20 px-3 py-2 text-[13px] font-semibold text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-violet-500/28 sm:px-3.5"
          >
            <Plus className="h-4 w-4 shrink-0 text-violet-200" strokeWidth={2} aria-hidden />
            + Add Target Client
          </button>
          <PreviewActionButton icon={Upload} label="Import CSV / Excel" caption="Upload spreadsheet" />
          <PreviewActionButton icon={Download} label="Export" caption="Download filtered results" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <table className="min-w-[960px] w-full text-left">
          <thead className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2.5">Company Name</th>
              <th className="px-3 py-2.5">Website</th>
              <th className="px-3 py-2.5">Sector</th>
              <th className="px-3 py-2.5">Contact Name</th>
              <th className="px-3 py-2.5">Contact Position</th>
              <th className="px-3 py-2.5">Email Address</th>
              <th className="px-3 py-2.5 text-center">Contacted?</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {TARGET_CLIENTS_PREVIEW_ROWS.map((row) => (
              <TargetClientRow key={row.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-white/35">
        Preview build — actions and search are non-functional placeholders for visual review.
      </p>
    </div>
  );
}
