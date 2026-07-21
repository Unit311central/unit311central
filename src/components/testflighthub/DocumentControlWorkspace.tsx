"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { TqmsDocStatus, TqmsDocument } from "@/lib/tqms-data";
import { TQMS_DOC_STATUSES, tqmsStatusClass } from "@/lib/tqms-data";
import {
  approveDocument,
  archiveDocument,
  createDocument,
  deleteDocument,
  updateDocument,
} from "@/lib/tqms-mock-store";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsSlideOver,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type DocumentFormState = {
  number: string;
  title: string;
  revision: string;
  owner: string;
  status: TqmsDocStatus;
  nextReview: string;
};

const emptyForm = (): DocumentFormState => ({
  number: "",
  title: "",
  revision: "A",
  owner: "",
  status: "Draft",
  nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
});

function actionClass(tone: "sky" | "amber" | "rose" | "emerald") {
  const map = {
    sky: "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    amber: "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25",
    rose: "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
    emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  } as const;
  return `inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition-colors ${map[tone]}`;
}

export default function DocumentControlWorkspace() {
  const store = useTqmsMockStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TqmsDocStatus | "All">("All");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DocumentFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<TqmsDocument | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.documents.filter((doc) => {
      if (statusFilter !== "All" && doc.status !== statusFilter) return false;
      if (!q) return true;
      return (
        doc.number.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.owner.toLowerCase().includes(q)
      );
    });
  }, [store.documents, search, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(doc: TqmsDocument) {
    setEditingId(doc.id);
    setForm({
      number: doc.number,
      title: doc.title,
      revision: doc.revision,
      owner: doc.owner,
      status: doc.status,
      nextReview: doc.nextReview,
    });
    setFormOpen(true);
  }

  function handleSubmit() {
    if (!form.number.trim() || !form.title.trim() || !form.owner.trim()) {
      setNotice("Document number, title, and owner are required.");
      return;
    }
    if (editingId) {
      updateDocument(editingId, {
        title: form.title.trim(),
        revision: form.revision.trim(),
        owner: form.owner.trim(),
        status: form.status,
        nextReview: form.nextReview,
      });
      setNotice("Document updated.");
    } else {
      createDocument({
        number: form.number.trim(),
        title: form.title.trim(),
        revision: form.revision.trim(),
        owner: form.owner.trim(),
        status: form.status,
        approvalDate: null,
        nextReview: form.nextReview,
      });
      setNotice("Document added to the register.");
    }
    setFormOpen(false);
    setForm(emptyForm());
    setEditingId(null);
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <TqmsSection
        title="Document Control Register"
        subtitle="Controlled documents, revisions, approvals, and review cycles."
        actions={
          <button type="button" className={tqmsPrimaryButtonClass()} onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create Document
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search number, title, owner…"
              className={`${tqmsInputClass()} mt-0 pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TqmsDocStatus | "All")}
            className={`${tqmsInputClass()} mt-0 w-auto min-w-[140px]`}
          >
            <option value="All">All statuses</option>
            {TQMS_DOC_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <TqmsEmpty message="No documents match your filters." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Document Number</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Revision</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Approval Date</th>
                  <th className="px-3 py-2.5 font-medium">Next Review</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-sky-200">{doc.number}</td>
                    <td className="px-3 py-2.5 font-medium text-white">{doc.title}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/70">{doc.revision}</td>
                    <td className="px-3 py-2.5 text-white/70">{doc.owner}</td>
                    <td className="px-3 py-2.5">
                      <TqmsStatusPill className={tqmsStatusClass(doc.status)}>{doc.status}</TqmsStatusPill>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">
                      {doc.approvalDate ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">{doc.nextReview}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={actionClass("sky")}
                          onClick={() => setSelected(doc)}
                        >
                          <Eye className="h-3 w-3" />
                          Open
                        </button>
                        <button type="button" className={actionClass("amber")} onClick={() => openEdit(doc)}>
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        {doc.status !== "Approved" ? (
                          <button
                            type="button"
                            className={actionClass("emerald")}
                            onClick={() => {
                              approveDocument(doc.id);
                              setNotice(`${doc.number} approved.`);
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        ) : null}
                        {doc.status !== "Obsolete" ? (
                          <button
                            type="button"
                            className={actionClass("amber")}
                            onClick={() => {
                              archiveDocument(doc.id);
                              setNotice(`${doc.number} archived.`);
                            }}
                          >
                            <Archive className="h-3 w-3" />
                            Archive
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={actionClass("rose")}
                          onClick={() => {
                            if (window.confirm(`Delete ${doc.number}?`)) {
                              deleteDocument(doc.id);
                              setNotice(`${doc.number} removed from register.`);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
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
      </TqmsSection>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? "Edit Document" : "Create Document"}
              </h3>
              <button
                type="button"
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {!editingId ? (
                <label>
                  <span className={tqmsLabelClass()}>Document Number</span>
                  <input
                    className={tqmsInputClass()}
                    value={form.number}
                    onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                    placeholder="SOP-QMS-001"
                  />
                </label>
              ) : null}
              <label>
                <span className={tqmsLabelClass()}>Title</span>
                <input
                  className={tqmsInputClass()}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={tqmsLabelClass()}>Revision</span>
                  <input
                    className={tqmsInputClass()}
                    value={form.revision}
                    onChange={(e) => setForm((f) => ({ ...f, revision: e.target.value }))}
                  />
                </label>
                <label>
                  <span className={tqmsLabelClass()}>Status</span>
                  <select
                    className={tqmsInputClass()}
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as TqmsDocStatus }))
                    }
                  >
                    {TQMS_DOC_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                <span className={tqmsLabelClass()}>Owner</span>
                <input
                  className={tqmsInputClass()}
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                />
              </label>
              <label>
                <span className={tqmsLabelClass()}>Next Review</span>
                <input
                  type="date"
                  className={tqmsInputClass()}
                  value={form.nextReview}
                  onChange={(e) => setForm((f) => ({ ...f, nextReview: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={tqmsSecondaryButtonClass()} onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="button" className={tqmsPrimaryButtonClass()} onClick={handleSubmit}>
                {editingId ? "Save Changes" : "Create Document"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <TqmsSlideOver
          title={selected.title}
          subtitle={selected.number}
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={tqmsSecondaryButtonClass()} onClick={() => openEdit(selected)}>
                Edit
              </button>
              {selected.status !== "Approved" ? (
                <button
                  type="button"
                  className={tqmsPrimaryButtonClass()}
                  onClick={() => {
                    approveDocument(selected.id);
                    setNotice(`${selected.number} approved.`);
                    setSelected(null);
                  }}
                >
                  Approve
                </button>
              ) : null}
            </div>
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Revision", selected.revision],
              ["Owner", selected.owner],
              ["Status", selected.status],
              ["Approval Date", selected.approvalDate ?? "Pending"],
              ["Next Review", selected.nextReview],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 p-3">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</dt>
                <dd className="mt-1 text-sm text-white/80">{value}</dd>
              </div>
            ))}
          </dl>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
