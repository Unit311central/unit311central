"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import {
  UK_PAVILION_FEE_GBP,
  UK_PAVILION_SITE,
  deleteUkPavilionMember,
  formatPavilionMoney,
  upsertUkPavilionMember,
  type UkPavilionMember,
  type UkPavilionStatus,
} from "@/lib/abhi-uk-pavilion-store";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { useUkPavilionStore } from "./useUkPavilionStore";
import {
  WsEmpty,
  WsInputClass,
  WsKpiTile,
  WsLabelClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsSection,
  WsSlideOver,
  WsStatusPill,
} from "./domain-workspace-ui";

type FormState = {
  id: string | null;
  companyName: string;
  contactName: string;
  contactEmail: string;
  signedUpAt: string;
  amountGbp: string;
  status: UkPavilionStatus;
  notes: string;
};

function emptyForm(): FormState {
  return {
    id: null,
    companyName: "",
    contactName: "",
    contactEmail: "",
    signedUpAt: new Date().toISOString().slice(0, 10),
    amountGbp: String(UK_PAVILION_FEE_GBP),
    status: "pending",
    notes: "",
  };
}

function formFrom(member: UkPavilionMember): FormState {
  return {
    id: member.id,
    companyName: member.companyName,
    contactName: member.contactName,
    contactEmail: member.contactEmail,
    signedUpAt: member.signedUpAt,
    amountGbp: String(member.amountGbp),
    status: member.status,
    notes: member.notes,
  };
}

function statusClass(status: UkPavilionStatus) {
  if (status === "active") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "pending") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "expired") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  return "border-white/15 bg-white/[0.04] text-white/55";
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default function AbhiUkPavilionWorkspace() {
  const store = useUkPavilionStore();
  const basePath = useInternalOperationsBasePath();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [...store.members].sort((a, b) => b.signedUpAt.localeCompare(a.signedUpAt));
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.companyName.toLowerCase().includes(q) ||
        row.contactName.toLowerCase().includes(q) ||
        row.contactEmail.toLowerCase().includes(q),
    );
  }, [query, store.members]);

  const kpis = useMemo(() => {
    const active = store.members.filter((row) => row.status === "active");
    const pending = store.members.filter((row) => row.status === "pending");
    const revenue = store.members
      .filter((row) => row.status === "active" || row.status === "pending")
      .reduce((sum, row) => sum + row.amountGbp, 0);
    return {
      total: store.members.length,
      active: active.length,
      pending: pending.length,
      revenue,
    };
  }, [store.members]);

  function openCreate() {
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(member: UkPavilionMember) {
    setForm(formFrom(member));
    setFormOpen(true);
  }

  function handleSave(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!form.companyName.trim() || !form.contactEmail.trim()) return;
    const saved = upsertUkPavilionMember({
      id: form.id ?? undefined,
      companyName: form.companyName,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      signedUpAt: form.signedUpAt,
      amountGbp: Number(form.amountGbp) || UK_PAVILION_FEE_GBP,
      status: form.status,
      notes: form.notes,
    });
    setFormOpen(false);
    setNotice(
      form.id
        ? `Updated “${saved.companyName}”.`
        : `Added “${saved.companyName}” at ${formatPavilionMoney(saved.amountGbp)}.`,
    );
  }

  function handleDelete(member: UkPavilionMember) {
    if (!window.confirm(`Remove “${member.companyName}” from UK Healthcare Pavilion listings?`)) {
      return;
    }
    deleteUkPavilionMember(member.id);
    setNotice(`Removed “${member.companyName}”.`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
            Website Management
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">UK Healthcare Pavilion</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Companies signed up to be advertised on{" "}
            <Link
              href={UK_PAVILION_SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 underline-offset-2 hover:underline"
            >
              ukhealthcarepavilion.com
            </Link>
            . Standard listing fee {formatPavilionMoney(UK_PAVILION_FEE_GBP)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={getInternalNavHref("website-management", basePath)}
            className={WsSecondaryButtonClass()}
          >
            Back to Website Management
          </Link>
          <Link
            href={UK_PAVILION_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className={WsSecondaryButtonClass()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open pavilion site
          </Link>
          <button type="button" className={WsPrimaryButtonClass()} onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Add member
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WsKpiTile label="Signed up" value={kpis.total} hint="All pavilion listings" />
        <WsKpiTile label="Active" value={kpis.active} hint="Live on the site" />
        <WsKpiTile label="Pending" value={kpis.pending} hint="Awaiting go-live / payment" />
        <WsKpiTile
          label="Pipeline value"
          value={formatPavilionMoney(kpis.revenue)}
          hint={`@ ${formatPavilionMoney(UK_PAVILION_FEE_GBP)} each`}
        />
      </section>

      <WsSection
        title="Pavilion members"
        subtitle="Signup date, listing fee, and status for advertisers."
        actions={
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company or contact…"
            className={cn(WsInputClass(), "min-w-[220px]")}
          />
        }
      >
        {filtered.length === 0 ? (
          <WsEmpty message="No pavilion members match this search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-[0.12em] text-white/40">
                  <th className="px-2 py-2 font-medium">Company</th>
                  <th className="px-2 py-2 font-medium">Contact</th>
                  <th className="px-2 py-2 font-medium">Signed up</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.id} className="border-b border-white/5">
                    <td className="px-2 py-2.5">
                      <p className="font-medium text-white">{member.companyName}</p>
                      {member.notes ? (
                        <p className="max-w-xs truncate text-xs text-white/40">{member.notes}</p>
                      ) : null}
                    </td>
                    <td className="px-2 py-2.5 text-white/75">
                      <p>{member.contactName || "—"}</p>
                      <p className="text-xs text-white/40">{member.contactEmail}</p>
                    </td>
                    <td className="px-2 py-2.5 tabular-nums text-white/75">
                      {formatDate(member.signedUpAt)}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums font-medium text-white">
                      {formatPavilionMoney(member.amountGbp)}
                    </td>
                    <td className="px-2 py-2.5">
                      <WsStatusPill className={statusClass(member.status)}>
                        {member.status}
                      </WsStatusPill>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          className={WsSecondaryButtonClass()}
                          onClick={() => openEdit(member)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={cn(
                            WsSecondaryButtonClass(),
                            "border-rose-400/30 text-rose-100 hover:bg-rose-500/15",
                          )}
                          onClick={() => handleDelete(member)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WsSection>

      {formOpen ? (
        <WsSlideOver
          title={form.id ? "Edit pavilion member" : "Add pavilion member"}
          subtitle={`Default listing fee ${formatPavilionMoney(UK_PAVILION_FEE_GBP)}`}
          onClose={() => setFormOpen(false)}
        >
          <form className="space-y-3" onSubmit={handleSave}>
            <div>
              <label className={WsLabelClass()}>Company name</label>
              <input
                required
                value={form.companyName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, companyName: event.target.value }))
                }
                className={WsInputClass()}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={WsLabelClass()}>Contact name</label>
                <input
                  value={form.contactName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contactName: event.target.value }))
                  }
                  className={WsInputClass()}
                />
              </div>
              <div>
                <label className={WsLabelClass()}>Contact email</label>
                <input
                  required
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contactEmail: event.target.value }))
                  }
                  className={WsInputClass()}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={WsLabelClass()}>Signed up</label>
                <input
                  type="date"
                  required
                  value={form.signedUpAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, signedUpAt: event.target.value }))
                  }
                  className={WsInputClass()}
                />
              </div>
              <div>
                <label className={WsLabelClass()}>Amount (£)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  required
                  value={form.amountGbp}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, amountGbp: event.target.value }))
                  }
                  className={WsInputClass()}
                />
              </div>
              <div>
                <label className={WsLabelClass()}>Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as UkPavilionStatus,
                    }))
                  }
                  className={WsInputClass()}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <label className={WsLabelClass()}>Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className={cn(WsInputClass(), "resize-none")}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className={WsSecondaryButtonClass()}
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className={WsPrimaryButtonClass()}>
                {form.id ? "Save changes" : "Add member"}
              </button>
            </div>
          </form>
        </WsSlideOver>
      ) : null}
    </div>
  );
}
