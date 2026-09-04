"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  deleteCustomerArchitectureDiagram,
  getCustomerArchitectureSnapshot,
  subscribeCustomerArchitecture,
  upsertCustomerArchitectureDiagram,
  type CustomerArchitectureDiagram,
} from "@/lib/customer-architecture-store";
import { GREENDESERT_ARCHITECTURE_DIAGRAMS } from "@/lib/greendesert/greendesert-architecture-diagrams-data";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";

function inputClass() {
  return "mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40";
}

export default function CustomerArchitectureWorkspace() {
  const [rows, setRows] = useState<CustomerArchitectureDiagram[]>(() => getCustomerArchitectureSnapshot());
  const [editor, setEditor] = useState<Partial<CustomerArchitectureDiagram> & { id?: string } | null>(
    null,
  );

  useEffect(() => {
    return subscribeCustomerArchitecture(() => setRows(getCustomerArchitectureSnapshot()));
  }, []);

  useEffect(() => {
    if (!isBrowserGreenDesertSurface()) return;
    const current = getCustomerArchitectureSnapshot();
    const canonicalSlugs = new Set(
      GREENDESERT_ARCHITECTURE_DIAGRAMS.map((diagram) => diagram.slug),
    );
    const hasCanonical =
      current.length > 0 && current.every((row) => canonicalSlugs.has(row.slug));
    if (hasCanonical) return;
    for (const diagram of GREENDESERT_ARCHITECTURE_DIAGRAMS) {
      upsertCustomerArchitectureDiagram(diagram);
    }
  }, []);

  function saveEditor() {
    if (!editor?.title?.trim()) return;
    upsertCustomerArchitectureDiagram({
      id: editor.id,
      title: editor.title,
      slug: editor.slug ?? "",
      description: editor.description ?? "",
      notes: editor.notes ?? "",
    });
    setEditor(null);
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Technology Management
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Architecture Diagrams</h1>
            <p className="mt-1 max-w-3xl text-sm text-white/55">
              Workspace-owned architecture diagrams. Add, edit, and delete records for this tenant.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditor({ title: "", slug: "", description: "", notes: "" })}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Add diagram
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
          <p className="text-sm text-white/50">No architecture diagrams yet.</p>
        </section>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{row.title}</p>
                <p className="text-xs text-white/45">{row.slug}</p>
                {row.description ? <p className="mt-1 text-sm text-white/60">{row.description}</p> : null}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditor(row)}
                  className="rounded border border-white/15 px-2 py-1 text-xs text-white/75"
                >
                  <Pencil className="mr-1 inline h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete diagram ${row.title}?`)) {
                      deleteCustomerArchitectureDiagram(row.id);
                    }
                  }}
                  className="rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                >
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor ? (
        <section className="rounded-2xl border border-sky-400/25 bg-sky-500/5 p-4">
          <p className="text-sm font-medium text-white">{editor.id ? "Edit diagram" : "Add diagram"}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/55">
              Title
              <input
                value={editor.title ?? ""}
                onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))}
                className={inputClass()}
              />
            </label>
            <label className="block text-xs text-white/55">
              Slug
              <input
                value={editor.slug ?? ""}
                onChange={(event) => setEditor((current) => ({ ...current, slug: event.target.value }))}
                className={inputClass()}
              />
            </label>
            <label className="block text-xs text-white/55 sm:col-span-2">
              Description
              <input
                value={editor.description ?? ""}
                onChange={(event) =>
                  setEditor((current) => ({ ...current, description: event.target.value }))
                }
                className={inputClass()}
              />
            </label>
            <label className="block text-xs text-white/55 sm:col-span-2">
              Notes
              <input
                value={editor.notes ?? ""}
                onChange={(event) => setEditor((current) => ({ ...current, notes: event.target.value }))}
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
