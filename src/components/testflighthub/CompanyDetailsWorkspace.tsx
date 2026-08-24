"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";

import type { CompanyDetails } from "@/lib/company-details-data";
import CompanyEntityCard from "./CompanyEntityCard";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

export default function CompanyDetailsWorkspace() {
  const [companies, setCompanies] = useState<CompanyDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/company-details", { cache: "no-store" });
      const payload = await readApiJson<{
        companies?: CompanyDetails[];
        details?: CompanyDetails | null;
        error?: string;
      }>(response);
      if (!response.ok) {
        throw new Error(payload.error || `Failed to load (${response.status})`);
      }
      const rows =
        Array.isArray(payload.companies) && payload.companies.length > 0
          ? payload.companies
          : payload.details
            ? [payload.details]
            : [];
      setCompanies(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load companies.");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSaved(saved: CompanyDetails) {
    setCompanies((current) => {
      const index = current.findIndex((row) => row.id === saved.id);
      if (index === -1) return [...current, saved];
      const next = [...current];
      next[index] = saved;
      return next;
    });
    setCreatingNew(false);
  }

  function handleArchived(companyId: string) {
    setCompanies((current) => current.filter((row) => row.id !== companyId));
  }

  if (loading) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading company information…
        </div>
      </div>
    );
  }

  if (error && companies.length === 0 && !creatingNew) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.08]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (companies.length === 0 && !creatingNew) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10">
          <Building2 className="h-5 w-5 text-sky-200" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-white">No companies added yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/65">
          Add legal entities for this workspace — registration numbers, addresses, and contact
          details for each company.
        </p>
        <button
          type="button"
          onClick={() => setCreatingNew(true)}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-5 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/25"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add your first company
        </button>
      </div>
    );
  }

  const gridClass =
    companies.length + (creatingNew ? 1 : 0) === 1
      ? "grid gap-4"
      : "grid gap-4 md:grid-cols-2 2xl:grid-cols-3";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Company Information</h2>
          <p className="mt-1 text-sm text-white/55">
            {companies.length === 1
              ? "One legal entity in this workspace."
              : `${companies.length} legal entities in this workspace.`}
          </p>
        </div>
        {!creatingNew ? (
          <button
            type="button"
            onClick={() => setCreatingNew(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/25"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add company
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <div className={gridClass}>
        {creatingNew ? (
          <CompanyEntityCard
            company={null}
            isNew
            defaultEditing
            onSaved={handleSaved}
            onCancelNew={() => setCreatingNew(false)}
          />
        ) : null}
        {companies.map((company) => (
          <CompanyEntityCard
            key={company.id}
            company={company}
            onSaved={handleSaved}
            onArchived={handleArchived}
          />
        ))}
      </div>
    </div>
  );
}
