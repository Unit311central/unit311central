"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  deleteNorthstarBoardMember,
  upsertNorthstarBoardMember,
  type NorthstarBoardMember,
} from "@/lib/demo/northstar-board-members-store";
import {
  CorporateFieldLabel,
  CorporateSection,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { useNorthstarBoardMembersStore } from "@/components/testflighthub/useNorthstarBoardMembersStore";

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
        Northstar · Board
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-white/55">{subtitle}</p>
    </header>
  );
}

const TYPES: NorthstarBoardMember["type"][] = [
  "Executive",
  "Non-Executive",
  "Investor",
  "Independent",
];

export function NorthstarBoardMembersWorkspace() {
  const store = useNorthstarBoardMembersStore();
  const [form, setForm] = useState<NorthstarBoardMember | null>(null);

  useEffect(() => {
    void fetch("/api/auth/whoami", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { username?: string; displayName?: string } | null) => {
        if (!data) return;
        const isAdmin =
          String(data.username ?? "")
            .trim()
            .toLowerCase() === "admin@unit311central.com";
        if (!isAdmin) return;
        const admin = store.members.find((m) => m.id === "dir-admin");
        const displayName = data.displayName?.trim() || "Platform Admin";
        if (admin && admin.name === "Platform Admin") {
          upsertNorthstarBoardMember({
            id: "dir-admin",
            name: displayName,
            role: "Chief Executive Officer & Director",
            type: "Executive",
          });
        }
      })
      .catch(() => undefined);
  }, [store.members]);

  function save() {
    if (!form?.name.trim()) return;
    upsertNorthstarBoardMember(form);
    setForm(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Board Members"
        subtitle="Northstar board of directors — add, edit, or remove members."
      />

      <CorporateSection
        title="Directors"
        actions={
          <button
            type="button"
            className={corporatePrimaryButtonClass()}
            onClick={() =>
              setForm({ id: "", name: "", role: "Director", type: "Independent" })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add member
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {store.members.map((director) => (
            <div
              key={director.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-medium text-white">{director.name}</h2>
                  <p className="text-sm text-sky-300/90">{director.role}</p>
                  <p className="mt-2 text-sm text-white/65">{director.type} director</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={corporateSecondaryButtonClass()}
                    onClick={() => setForm({ ...director })}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className={corporateSecondaryButtonClass()}
                    onClick={() => {
                      if (window.confirm(`Remove ${director.name}?`)) {
                        deleteNorthstarBoardMember(director.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CorporateSection>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">
              {form.id ? "Edit member" : "Add member"}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <CorporateFieldLabel>Name</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Role</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Chief Executive Officer & Director"
                />
              </div>
              <div>
                <CorporateFieldLabel>Type</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as NorthstarBoardMember["type"] })
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
