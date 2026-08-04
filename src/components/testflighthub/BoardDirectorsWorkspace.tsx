"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";

import type { BoardDirector } from "@/lib/board-directors-service";
import { isScottParazynskiBoardMember } from "@/lib/board-directors-service";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import {
  CorporateFieldLabel,
  CorporateKpiTile,
  CorporateSection,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "./corporate-ui";

type DirectorFormState = {
  id: string | null;
  fullName: string;
  roleTitle: string;
  organisation: string;
  email: string;
  phone: string;
  notes: string;
  compensationUsdPerYear: string;
};

function emptyForm(): DirectorFormState {
  return {
    id: null,
    fullName: "",
    roleTitle: "",
    organisation: "",
    email: "",
    phone: "",
    notes: "",
    compensationUsdPerYear: "",
  };
}

function formFromDirector(director: BoardDirector): DirectorFormState {
  return {
    id: director.id,
    fullName: director.fullName,
    roleTitle: director.roleTitle,
    organisation: director.organisation,
    email: director.email ?? "",
    phone: director.phone ?? "",
    notes: director.notes,
    compensationUsdPerYear:
      director.compensationUsdPerYear === null || director.compensationUsdPerYear === undefined
        ? ""
        : String(director.compensationUsdPerYear),
  };
}

function formatUsdPerYear(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCompensationInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/[$,\s]/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Compensation must be a non-negative USD amount per year.");
  }
  return Math.round(n * 100) / 100;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function BoardDirectorsWorkspace() {
  const isOnwardAir = isBrowserOnwardAirSurface();
  const [directors, setDirectors] = useState<BoardDirector[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DirectorFormState>(emptyForm());

  async function loadDirectors() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/board-directors", { credentials: "include" });
      const data = (await res.json()) as { directors?: BoardDirector[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to load board directors.");
      setDirectors(data.directors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board directors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDirectors();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return directors;
    return directors.filter((d) =>
      [
        d.fullName,
        d.roleTitle,
        d.organisation,
        d.email ?? "",
        d.phone ?? "",
        d.compensationUsdPerYear === null ? "" : String(d.compensationUsdPerYear),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [directors, search]);

  const formHidesCompensation = isScottParazynskiBoardMember(form.fullName);

  function openCreate() {
    setForm(emptyForm());
    setFormOpen(true);
    setNotice(null);
  }

  function openEdit(director: BoardDirector) {
    setForm(formFromDirector(director));
    setFormOpen(true);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.fullName.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        roleTitle: form.roleTitle.trim(),
        organisation: form.organisation.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim(),
        compensationUsdPerYear: isScottParazynskiBoardMember(form.fullName)
          ? null
          : parseCompensationInput(form.compensationUsdPerYear),
      };
      const res = await fetch(
        form.id ? `/api/board-directors/${form.id}` : "/api/board-directors",
        {
          method: form.id ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { director?: BoardDirector; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to save director.");
      if (!data.director) throw new Error("Failed to save director.");
      setDirectors((current) => {
        if (form.id) {
          return current
            .map((row) => (row.id === data.director!.id ? data.director! : row))
            .sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName));
        }
        return [...current, data.director!].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName),
        );
      });
      setFormOpen(false);
      setNotice(form.id ? "Director updated." : "Director added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save director.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(director: BoardDirector) {
    const ok = window.confirm(`Delete “${director.fullName}” from the board?`);
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`/api/board-directors/${director.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to delete director.");
      setDirectors((current) => current.filter((row) => row.id !== director.id));
      if (form.id === director.id) setFormOpen(false);
      setNotice("Director deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete director.");
    }
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <CorporateSection
        title={isOnwardAir ? "Board Members" : "Board of Directors"}
        subtitle={
          isOnwardAir
            ? "Governance board members for this organisation. Compensation is USD per year."
            : "Governance board members for this organisation."
        }
        actions={
          <button type="button" onClick={openCreate} className={corporatePrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Add director
          </button>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <CorporateKpiTile label="Directors" value={String(directors.length)} />
          <CorporateKpiTile
            label="With organisation"
            value={String(directors.filter((d) => d.organisation).length)}
          />
          <CorporateKpiTile label="Showing" value={String(filtered.length)} />
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directors…"
            className={`${corporateInputClass()} border-0 bg-transparent px-0`}
          />
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading board…
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm text-white/55">No board directors found.</p>
            <button type="button" onClick={openCreate} className={`${corporatePrimaryButtonClass()} mt-4`}>
              <Plus className="h-3.5 w-3.5" />
              Add director
            </button>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Role / title</th>
                  <th className="px-3 py-2.5">Organisation</th>
                  <th className="px-3 py-2.5">Compensation (USD / yr)</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Phone</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const hideCompensation = isScottParazynskiBoardMember(d.fullName);
                  return (
                  <tr key={d.id} className="border-t border-white/8 text-white/80">
                    <td className="px-3 py-2.5 font-medium text-white">{d.fullName}</td>
                    <td className="px-3 py-2.5">{d.roleTitle || "—"}</td>
                    <td className="px-3 py-2.5">{d.organisation || "—"}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {hideCompensation ? "—" : formatUsdPerYear(d.compensationUsdPerYear)}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.email ? (
                        <a href={`mailto:${d.email}`} className="text-sky-300 hover:text-sky-200">
                          {d.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.phone ? (
                        <a href={`tel:${d.phone}`} className="text-white/80 hover:text-white">
                          {d.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                          aria-label={`Edit ${d.fullName}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(d)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                          aria-label={`Delete ${d.fullName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </CorporateSection>

      {formOpen ? (
        <Modal
          title={form.id ? "Edit director" : "Add director"}
          onClose={() => setFormOpen(false)}
        >
          <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
            <div>
              <CorporateFieldLabel>Full name</CorporateFieldLabel>
              <input
                value={form.fullName}
                onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                className={corporateInputClass()}
                required
              />
            </div>
            <div>
              <CorporateFieldLabel>Role / title</CorporateFieldLabel>
              <input
                value={form.roleTitle}
                onChange={(e) => setForm((current) => ({ ...current, roleTitle: e.target.value }))}
                className={corporateInputClass()}
                placeholder="e.g. Managing Director, B. Braun in the UK"
              />
            </div>
            <div>
              <CorporateFieldLabel>Organisation</CorporateFieldLabel>
              <input
                value={form.organisation}
                onChange={(e) =>
                  setForm((current) => ({ ...current, organisation: e.target.value }))
                }
                className={corporateInputClass()}
                placeholder="Company / organisation"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <CorporateFieldLabel>Email address</CorporateFieldLabel>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  className={corporateInputClass()}
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <CorporateFieldLabel>Phone number</CorporateFieldLabel>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  className={corporateInputClass()}
                  placeholder="+44 …"
                />
              </div>
            </div>
            {!formHidesCompensation ? (
              <div>
                <CorporateFieldLabel>Compensation (USD / year)</CorporateFieldLabel>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.compensationUsdPerYear}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      compensationUsdPerYear: e.target.value,
                    }))
                  }
                  className={corporateInputClass()}
                  placeholder="e.g. 25000"
                />
              </div>
            ) : null}
            <div>
              <CorporateFieldLabel>Notes</CorporateFieldLabel>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                rows={3}
                className={`${corporateInputClass()} resize-none`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className={corporateSecondaryButtonClass()}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.fullName.trim()}
                className={corporatePrimaryButtonClass(saving || !form.fullName.trim())}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : form.id ? (
                  "Save changes"
                ) : (
                  "Add director"
                )}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
