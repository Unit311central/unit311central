"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Plus, Search, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TargetClientRow } from "@/lib/target-clients";
import { searchTargetClientRows } from "@/lib/target-clients";

import AddTargetClientModal from "./AddTargetClientModal";
import { SalesEmptyState, SalesTabHeader } from "./sales-management-ui";

export type TargetClientDesignSampleRow = {
  id: string;
  companyName: string;
  website: string;
  sector: string;
  contactName: string;
  contactPosition: string;
  email: string;
  contacted: boolean;
};

/** Fictional rows — design preview / dev route only. Never shown on live internal host. */
export const TARGET_CLIENTS_DESIGN_SAMPLE_ROWS: readonly TargetClientDesignSampleRow[] = [
  {
    id: "tc-design-1",
    companyName: "Northwind Fixtures Ltd",
    website: "northwind-fixtures.example",
    sector: "Manufacturing",
    contactName: "Alex Mercer",
    contactPosition: "Head of Procurement",
    email: "alex.m@northwind-fixtures.example",
    contacted: true,
  },
  {
    id: "tc-design-2",
    companyName: "Harborline Analytics",
    website: "harborline-analytics.example",
    sector: "Technology",
    contactName: "Priya Nair",
    contactPosition: "VP Commercial",
    email: "priya.nair@harborline-analytics.example",
    contacted: false,
  },
  {
    id: "tc-design-3",
    companyName: "Summit Civic Partners",
    website: "summit-civic.example",
    sector: "Public sector",
    contactName: "Jordan Ellis",
    contactPosition: "Programme Director",
    email: "j.ellis@summit-civic.example",
    contacted: true,
  },
] as const;

const SEARCH_DEBOUNCE_MS = 300;

function ToolbarButton({
  primary,
  icon: Icon,
  label,
  caption,
  disabled,
  onDisabledAction,
}: {
  primary?: boolean;
  icon: typeof Plus;
  label: string;
  caption?: string;
  disabled?: boolean;
  onDisabledAction?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? onDisabledAction : undefined}
      className={cn(
        "flex min-h-[42px] min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors sm:px-3.5",
        disabled && "cursor-not-allowed opacity-70",
        primary
          ? "border-violet-400/35 bg-violet-500/20 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-violet-500/28 disabled:hover:bg-violet-500/20"
          : "border-white/12 bg-white/[0.04] text-white/85 hover:border-white/20 hover:bg-white/[0.07] disabled:hover:bg-white/[0.04]",
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

function RowActions({ disabled, onDisabledAction }: { disabled?: boolean; onDisabledAction?: () => void }) {
  const actionClass =
    "rounded-md px-2 py-1 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

  const wrap = (label: string, className?: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? onDisabledAction : undefined}
      className={cn(actionClass, className)}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-0.5">
      {wrap("Edit")}
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      {wrap("View")}
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      {wrap("Delete", "text-red-200/80 hover:text-red-100")}
      <span className="text-white/20" aria-hidden>
        ·
      </span>
      {wrap("Move to Opportunity", "text-violet-200/90 hover:text-violet-100")}
    </div>
  );
}

function TargetClientRow({
  row,
  actionsDisabled,
  onDisabledAction,
}: {
  row: TargetClientDesignSampleRow | TargetClientRow;
  actionsDisabled?: boolean;
  onDisabledAction?: () => void;
}) {
  return (
    <tr className="border-t border-white/10 text-[13px] text-white/80">
      <td className="px-3 py-2.5 font-medium text-white">{row.companyName}</td>
      <td className="max-w-[140px] truncate px-3 py-2.5 text-white/60">{row.website || "—"}</td>
      <td className="whitespace-nowrap px-3 py-2.5">{row.sector || "—"}</td>
      <td className="whitespace-nowrap px-3 py-2.5">{row.contactName || "—"}</td>
      <td className="max-w-[120px] truncate px-3 py-2.5 text-white/65">{row.contactPosition || "—"}</td>
      <td className="max-w-[180px] truncate px-3 py-2.5 text-white/60">{row.email || "—"}</td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={row.contacted}
          readOnly
          disabled
          aria-label={`Contacted — ${row.companyName}`}
          className="h-4 w-4 rounded border-white/25 bg-white/5 text-violet-500 accent-violet-500"
        />
      </td>
      <td className="min-w-[220px] px-2 py-2">
        <RowActions disabled={actionsDisabled} onDisabledAction={onDisabledAction} />
      </td>
    </tr>
  );
}

export type TargetClientsOpeningScreenProps = {
  /** Live internal page loads CRM data; design-preview uses fictional rows. */
  variant?: "live" | "design-preview";
};

async function fetchTargetClients(): Promise<TargetClientRow[]> {
  const response = await fetch("/api/sales-management/target-clients", { cache: "no-store" });
  const body = (await response.json()) as { clients?: TargetClientRow[]; error?: string };
  if (!response.ok) throw new Error(body.error ?? "Failed to load target clients");
  return body.clients ?? [];
}

export default function TargetClientsOpeningScreen({ variant = "live" }: TargetClientsOpeningScreenProps) {
  const isLive = variant === "live";
  const [allRows, setAllRows] = useState<TargetClientRow[]>([]);
  const [loading, setLoading] = useState(isLive);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const designRows = isLive ? [] : TARGET_CLIENTS_DESIGN_SAMPLE_ROWS;

  const reload = useCallback(async () => {
    if (!isLive) return;
    setLoading(true);
    setLoadError(null);
    try {
      const clients = await fetchTargetClients();
      setAllRows(clients);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load target clients");
    } finally {
      setLoading(false);
    }
  }, [isLive]);

  useEffect(() => {
    if (isLive) void reload();
  }, [isLive, reload]);

  useEffect(() => {
    if (!isLive) return;
    const timer = window.setTimeout(() => setSearchQuery(searchInput), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, isLive]);

  const onComingSoon = useCallback(() => {
    setNotice("This action will be available in a future release.");
  }, []);

  const displayedRows = useMemo(() => {
    if (!isLive) return designRows;
    return searchTargetClientRows(allRows, searchQuery);
  }, [allRows, designRows, isLive, searchQuery]);

  const handleSaved = useCallback(async () => {
    await reload();
    setSuccessNotice("Target client saved.");
    window.setTimeout(() => setSuccessNotice(null), 5000);
  }, [reload]);

  return (
    <div className="space-y-4">
      <SalesTabHeader
        title="Target Clients"
        description="Organisations in scope for outbound sales before they become opportunities."
      />

      {successNotice ? (
        <p
          className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
          role="status"
        >
          {successNotice}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-sm text-violet-100" role="status">
          {notice}
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
          {loadError}
        </p>
      ) : null}

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
            value={isLive ? searchInput : ""}
            readOnly={!isLive}
            disabled={!isLive}
            onChange={isLive ? (e) => setSearchInput(e.target.value) : undefined}
            placeholder="Search name, company, country, city, industry..."
            className="h-[42px] w-full rounded-lg border border-white/12 bg-white/[0.04] py-2 pl-9 pr-3 text-[13px] text-white/90 placeholder:text-white/38 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-80"
            aria-label="Search Target Clients"
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch">
          <button
            type="button"
            disabled={!isLive}
            onClick={isLive ? () => setAddModalOpen(true) : onComingSoon}
            className="flex min-h-[42px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-400/35 bg-violet-500/20 px-3 py-2 text-[13px] font-semibold text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-violet-500/28 disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:bg-violet-500/20 sm:px-3.5"
          >
            <Plus className="h-4 w-4 shrink-0 text-violet-200" strokeWidth={2} aria-hidden />
            + Add Target Client
          </button>
          <ToolbarButton
            icon={Upload}
            label="Import CSV / Excel"
            caption="Upload spreadsheet"
            disabled={isLive}
            onDisabledAction={onComingSoon}
          />
          <ToolbarButton
            icon={Download}
            label="Export"
            caption="Download filtered results"
            disabled={isLive}
            onDisabledAction={onComingSoon}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <table className="min-w-full w-full table-fixed text-left">
          <thead className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wide text-white/45">
            <tr>
              <th className="w-[18%] px-3 py-2.5">Company Name</th>
              <th className="w-[14%] px-3 py-2.5">Website</th>
              <th className="w-[12%] px-3 py-2.5">Sector</th>
              <th className="w-[12%] px-3 py-2.5">Contact Name</th>
              <th className="w-[12%] px-3 py-2.5">Contact Position</th>
              <th className="w-[14%] px-3 py-2.5">Email Address</th>
              <th className="w-[8%] px-3 py-2.5 text-center">Contacted?</th>
              <th className="w-[10%] px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-white/50">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-violet-300" aria-hidden />
                  <span className="sr-only">Loading target clients</span>
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8">
                  <SalesEmptyState
                    title={
                      isLive && searchQuery.trim()
                        ? "No matching target clients"
                        : "No target clients yet"
                    }
                    description={
                      isLive && searchQuery.trim()
                        ? "Try a different search term. Search matches company, contact, sector, website and email fields stored on CRM records."
                        : isLive
                          ? "Add a target client to start building your outbound list. Records are stored in the shared CRM register for this workspace."
                          : "Target client records will appear here once the add and import flows are enabled. Nothing has been stored in the database for this view yet."
                    }
                    compact
                  />
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => (
                <TargetClientRow
                  key={row.id}
                  row={row}
                  actionsDisabled={isLive}
                  onDisabledAction={onComingSoon}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLive ? (
        <p className="text-[11px] text-white/35">
          Design preview — fictional sample rows for layout review only.
        </p>
      ) : null}

      {isLive ? (
        <AddTargetClientModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
