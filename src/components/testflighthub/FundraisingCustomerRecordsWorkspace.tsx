"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import {
  deleteCustomerFundraisingInvestor,
  deleteCustomerFundraisingPipelineDeal,
  deleteCustomerFundraisingPitchDeck,
  deleteCustomerFundraisingDataRoom,
  getCustomerFundraisingSnapshot,
  subscribeCustomerFundraising,
  upsertCustomerFundraisingInvestor,
  upsertCustomerFundraisingPipelineDeal,
  upsertCustomerFundraisingPitchDeck,
  upsertCustomerFundraisingDataRoom,
  type CustomerFundraisingInvestor,
  type CustomerFundraisingPipelineDeal,
  type CustomerFundraisingPitchDeck,
  type CustomerFundraisingDataRoom,
} from "@/lib/customer-fundraising-store";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";

type Section = "dashboard" | "investors" | "pipeline" | "meetings" | "pitch-decks" | "data-rooms";

type Props = {
  title: string;
  subtitle: string;
  section: Section;
};

function inputClass() {
  return "mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40";
}

export default function FundraisingCustomerRecordsWorkspace({ title, subtitle, section }: Props) {
  const slug = readBrowserCustomerWorkspaceSlug();
  const currency = resolveSlugReportingCurrency(slug ?? undefined);
  const [snapshot, setSnapshot] = useState(() => getCustomerFundraisingSnapshot(slug));
  const [editor, setEditor] = useState<
    | { kind: "investor"; row: Partial<CustomerFundraisingInvestor> & { id?: string } }
    | { kind: "pipeline"; row: Partial<CustomerFundraisingPipelineDeal> & { id?: string } }
    | { kind: "pitch-deck"; row: Partial<CustomerFundraisingPitchDeck> & { id?: string } }
    | { kind: "data-room"; row: Partial<CustomerFundraisingDataRoom> & { id?: string } }
    | null
  >(null);

  useEffect(() => subscribeCustomerFundraising(() => setSnapshot(getCustomerFundraisingSnapshot(slug))), [slug]);

  const pipelineTotal = useMemo(
    () => snapshot.pipeline.reduce((sum, row) => sum + row.amount, 0),
    [snapshot.pipeline],
  );

  function openInvestor(row?: CustomerFundraisingInvestor) {
    setEditor({
      kind: "investor",
      row: row ?? { name: "", type: "Angel", stage: "Prospect", amount: 0, currency, notes: "" },
    });
  }

  function openPipeline(row?: CustomerFundraisingPipelineDeal) {
    setEditor({
      kind: "pipeline",
      row: row ?? { name: "", stage: "Lead", amount: 0, currency, expectedClose: "", notes: "" },
    });
  }

  function openPitchDeck(row?: CustomerFundraisingPitchDeck) {
    setEditor({
      kind: "pitch-deck",
      row: row ?? { title: "", version: "1.0", url: "", notes: "" },
    });
  }

  function openDataRoom(row?: CustomerFundraisingDataRoom) {
    setEditor({
      kind: "data-room",
      row: row ?? { name: "", url: "", investor: "", notes: "" },
    });
  }

  function saveEditor() {
    if (!editor) return;
    if (editor.kind === "investor") {
      upsertCustomerFundraisingInvestor(
        {
          id: editor.row.id,
          name: String(editor.row.name ?? "").trim(),
          type: String(editor.row.type ?? "").trim() || "Investor",
          stage: String(editor.row.stage ?? "").trim() || "Prospect",
          amount: Number(editor.row.amount) || 0,
          currency: editor.row.currency ?? currency,
          notes: String(editor.row.notes ?? ""),
        },
        slug,
      );
    } else if (editor.kind === "pitch-deck") {
      upsertCustomerFundraisingPitchDeck(
        {
          id: editor.row.id,
          title: String(editor.row.title ?? "").trim(),
          version: String(editor.row.version ?? "").trim() || "1.0",
          url: String(editor.row.url ?? "").trim(),
          notes: String(editor.row.notes ?? ""),
        },
        slug,
      );
    } else if (editor.kind === "data-room") {
      upsertCustomerFundraisingDataRoom(
        {
          id: editor.row.id,
          name: String(editor.row.name ?? "").trim(),
          url: String(editor.row.url ?? "").trim(),
          investor: String(editor.row.investor ?? "").trim(),
          notes: String(editor.row.notes ?? ""),
        },
        slug,
      );
    } else {
      upsertCustomerFundraisingPipelineDeal(
        {
          id: editor.row.id,
          name: String(editor.row.name ?? "").trim(),
          stage: String(editor.row.stage ?? "").trim() || "Lead",
          amount: Number(editor.row.amount) || 0,
          currency: editor.row.currency ?? currency,
          expectedClose: String(editor.row.expectedClose ?? ""),
          notes: String(editor.row.notes ?? ""),
        },
        slug,
      );
    }
    setEditor(null);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-1 py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Fundraising</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{subtitle}</p>
      </header>

      {section === "dashboard" ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Investors</p>
            <p className="mt-1 text-2xl font-semibold text-white">{snapshot.investors.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Pipeline deals</p>
            <p className="mt-1 text-2xl font-semibold text-white">{snapshot.pipeline.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Pipeline value</p>
            <p className="mt-1 text-2xl font-semibold text-white">{formatMoney(pipelineTotal, currency)}</p>
          </div>
        </section>
      ) : null}

      {section === "investors" || section === "dashboard" ? (
        <RecordSection
          title="Investors"
          addLabel="Add investor"
          onAdd={() => openInvestor()}
          empty="No investors yet."
          rows={snapshot.investors.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.type} · ${row.stage} · ${formatMoney(row.amount, row.currency)}`,
            onEdit: () => openInvestor(row),
            onDelete: () => {
              if (window.confirm(`Delete investor ${row.name}?`)) deleteCustomerFundraisingInvestor(row.id, slug);
            },
          }))}
        />
      ) : null}

      {section === "pipeline" || section === "dashboard" ? (
        <RecordSection
          title="Pipeline"
          addLabel="Add deal"
          onAdd={() => openPipeline()}
          empty="No pipeline deals yet."
          rows={snapshot.pipeline.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.stage} · ${formatMoney(row.amount, row.currency)} · due ${row.expectedClose || "—"}`,
            onEdit: () => openPipeline(row),
            onDelete: () => {
              if (window.confirm(`Delete deal ${row.name}?`)) deleteCustomerFundraisingPipelineDeal(row.id, slug);
            },
          }))}
        />
      ) : null}

      {section === "pitch-decks" ? (
        <RecordSection
          title="Pitch decks"
          addLabel="Add pitch deck"
          onAdd={() => openPitchDeck()}
          empty="No pitch decks yet."
          rows={snapshot.pitchDecks.map((row) => ({
            id: row.id,
            primary: row.title,
            secondary: `v${row.version}${row.url ? ` · ${row.url}` : ""}`,
            onEdit: () => openPitchDeck(row),
            onDelete: () => {
              if (window.confirm(`Delete pitch deck ${row.title}?`)) {
                deleteCustomerFundraisingPitchDeck(row.id, slug);
              }
            },
          }))}
        />
      ) : null}

      {section === "data-rooms" ? (
        <RecordSection
          title="Data rooms"
          addLabel="Add data room"
          onAdd={() => openDataRoom()}
          empty="No data rooms yet."
          rows={snapshot.dataRooms.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.investor || "Unassigned"}${row.url ? ` · ${row.url}` : ""}`,
            onEdit: () => openDataRoom(row),
            onDelete: () => {
              if (window.confirm(`Delete data room ${row.name}?`)) {
                deleteCustomerFundraisingDataRoom(row.id, slug);
              }
            },
          }))}
        />
      ) : null}

      {section === "meetings" ? (
        <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
          <p className="text-sm text-white/50">No {title.toLowerCase()} yet. Add records from Investors or Pipeline to start tracking this workspace raise.</p>
        </section>
      ) : null}

      {editor ? (
        <section className="rounded-2xl border border-sky-400/25 bg-sky-500/5 p-4">
          <p className="text-sm font-medium text-white">
            {editor.row.id ? "Edit" : "Add"}{" "}
            {editor.kind === "investor"
              ? "investor"
              : editor.kind === "pipeline"
                ? "pipeline deal"
                : editor.kind === "pitch-deck"
                  ? "pitch deck"
                  : "data room"}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {editor.kind === "investor" || editor.kind === "pipeline" ? (
              <>
                <label className="block text-xs text-white/55">
                  Name
                  <input
                    value={String(editor.row.name ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current ? { ...current, row: { ...current.row, name: event.target.value } } : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Stage
                  <input
                    value={String(editor.row.stage ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current ? { ...current, row: { ...current.row, stage: event.target.value } } : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                {editor.kind === "investor" ? (
                  <label className="block text-xs text-white/55">
                    Type
                    <input
                      value={String(editor.row.type ?? "")}
                      onChange={(event) =>
                        setEditor((current) =>
                          current ? { ...current, row: { ...current.row, type: event.target.value } } : current,
                        )
                      }
                      className={inputClass()}
                    />
                  </label>
                ) : (
                  <label className="block text-xs text-white/55">
                    Expected close
                    <input
                      type="date"
                      value={String(editor.row.expectedClose ?? "")}
                      onChange={(event) =>
                        setEditor((current) =>
                          current
                            ? { ...current, row: { ...current.row, expectedClose: event.target.value } }
                            : current,
                        )
                      }
                      className={inputClass()}
                    />
                  </label>
                )}
                <label className="block text-xs text-white/55">
                  Amount ({currency})
                  <input
                    value={String(editor.row.amount ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current
                          ? { ...current, row: { ...current.row, amount: Number(event.target.value) || 0 } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
              </>
            ) : null}
            {editor.kind === "pitch-deck" ? (
              <>
                <label className="block text-xs text-white/55">
                  Title
                  <input
                    value={String(editor.row.title ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "pitch-deck"
                          ? { ...current, row: { ...current.row, title: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Version
                  <input
                    value={String(editor.row.version ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "pitch-deck"
                          ? { ...current, row: { ...current.row, version: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55 sm:col-span-2">
                  URL
                  <input
                    value={String(editor.row.url ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "pitch-deck"
                          ? { ...current, row: { ...current.row, url: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
              </>
            ) : null}
            {editor.kind === "data-room" ? (
              <>
                <label className="block text-xs text-white/55">
                  Name
                  <input
                    value={String(editor.row.name ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "data-room"
                          ? { ...current, row: { ...current.row, name: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Investor
                  <input
                    value={String(editor.row.investor ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "data-room"
                          ? { ...current, row: { ...current.row, investor: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55 sm:col-span-2">
                  URL
                  <input
                    value={String(editor.row.url ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "data-room"
                          ? { ...current, row: { ...current.row, url: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
              </>
            ) : null}
            <label className="block text-xs text-white/55 sm:col-span-2">
              Notes
              <input
                value={String(editor.row.notes ?? "")}
                onChange={(event) =>
                  setEditor((current) =>
                    current ? { ...current, row: { ...current.row, notes: event.target.value } } : current,
                  )
                }
                className={inputClass()}
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveEditor}
              className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/75"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RecordSection({
  title,
  addLabel,
  onAdd,
  empty,
  rows,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  empty: string;
  rows: Array<{ id: string; primary: string; secondary: string; onEdit: () => void; onDelete: () => void }>;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">{empty}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1524]/70 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-white">{row.primary}</p>
                <p className="text-xs text-white/50">{row.secondary}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={row.onEdit} className="rounded border border-white/15 px-2 py-1 text-xs text-white/75">
                  <Pencil className="mr-1 inline h-3 w-3" />
                  Edit
                </button>
                <button type="button" onClick={row.onDelete} className="rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
