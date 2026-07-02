"use client";

import { useMemo } from "react";

import {
  REPRESENTATIVE_STATUS_OPTIONS,
  REPRESENTATIVE_TERRITORY_OPTIONS,
  REPRESENTATIVE_TYPE_OPTIONS,
  createBlankRepresentative,
  representativeStatusClass,
  type Representative,
} from "@/lib/representatives-data";
import { cn } from "@/lib/utils";
import ResponsiveMasterDetail, { useMobileDetailPanel } from "@/components/ui/ResponsiveMasterDetail";
import { Plus, Trash2 } from "lucide-react";

type RepresentativesWorkspaceProps = {
  representatives: Representative[];
  selectedRepresentativeId: string;
  onSelectRepresentative: (id: string) => void;
  onRepresentativesChange: (representatives: Representative[]) => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

export default function RepresentativesWorkspace({
  representatives,
  selectedRepresentativeId,
  onSelectRepresentative,
  onRepresentativesChange,
}: RepresentativesWorkspaceProps) {
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();
  const selectedRepresentative = useMemo(
    () =>
      representatives.find((rep) => rep.id === selectedRepresentativeId) ?? representatives[0],
    [representatives, selectedRepresentativeId],
  );

  function updateRepresentative(updated: Representative) {
    onRepresentativesChange(
      representatives.map((rep) => (rep.id === updated.id ? updated : rep)),
    );
  }

  function handleAddRepresentative() {
    const next = createBlankRepresentative();
    onRepresentativesChange([next, ...representatives]);
    onSelectRepresentative(next.id);
    openDetail();
  }

  function handleDeleteRepresentative() {
    if (!selectedRepresentative) return;
    const label = selectedRepresentative.fullName || selectedRepresentative.companyName || "this rep";
    if (!window.confirm(`Delete "${label}"?`)) return;

    const remaining = representatives.filter((rep) => rep.id !== selectedRepresentative.id);
    onRepresentativesChange(remaining);
    onSelectRepresentative(remaining[0]?.id ?? "");
    if (remaining.length === 0) closeDetail();
  }

  function patchSelected(patch: Partial<Representative>) {
    if (!selectedRepresentative) return;
    updateRepresentative({ ...selectedRepresentative, ...patch });
  }

  return (
    <div className="space-y-6">
      <ResponsiveMasterDetail
        showDetail={showDetail && !!selectedRepresentative}
        onBack={closeDetail}
        backLabel="Back to representatives"
        master={
          <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Representatives</h2>
                <p className="mt-1 text-xs text-white/45">
                  {representatives.length} external distributors &amp; agents
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRepresentative}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
              >
                <Plus className="h-3.5 w-3.5" />
                Add rep
              </button>
            </div>

            {representatives.length === 0 ? (
              <p className="mt-6 text-sm text-white/45">
                No representatives yet. Add your first external distributor or agent.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {representatives.map((rep) => {
                  const selected = rep.id === selectedRepresentative?.id;

                  return (
                    <li key={rep.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRepresentative(rep.id);
                          openDetail();
                        }}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                          selected
                            ? "border-sky-400/40 bg-sky-500/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {rep.fullName || "Unnamed representative"}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/45">{rep.companyName}</p>
                            <p className="mt-0.5 text-[11px] text-white/35">
                              {rep.repType} · {rep.territory}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]",
                              representativeStatusClass(rep.status),
                            )}
                          >
                            {rep.status}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        }
        detail={
          selectedRepresentative ? (
            <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
                    Representative record
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {selectedRepresentative.fullName || "New representative"}
                  </h2>
                  <p className="mt-1 text-sm text-white/50">{selectedRepresentative.companyName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      representativeStatusClass(selectedRepresentative.status),
                    )}
                  >
                    {selectedRepresentative.status}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteRepresentative}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-400/20 px-3 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Full name</FieldLabel>
                  <input
                    className={inputClassName()}
                    value={selectedRepresentative.fullName}
                    onChange={(event) => patchSelected({ fullName: event.target.value })}
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <FieldLabel>Company / distributor</FieldLabel>
                  <input
                    className={inputClassName()}
                    value={selectedRepresentative.companyName}
                    onChange={(event) => patchSelected({ companyName: event.target.value })}
                    placeholder="Organisation name"
                  />
                </div>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input
                    type="email"
                    className={inputClassName()}
                    value={selectedRepresentative.email}
                    onChange={(event) => patchSelected({ email: event.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <input
                    className={inputClassName()}
                    value={selectedRepresentative.phone}
                    onChange={(event) => patchSelected({ phone: event.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={selectedRepresentative.repType}
                    onChange={(event) =>
                      patchSelected({ repType: event.target.value as Representative["repType"] })
                    }
                  >
                    {REPRESENTATIVE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Territory</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={selectedRepresentative.territory}
                    onChange={(event) =>
                      patchSelected({
                        territory: event.target.value as Representative["territory"],
                      })
                    }
                  >
                    {REPRESENTATIVE_TERRITORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Status</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={selectedRepresentative.status}
                    onChange={(event) =>
                      patchSelected({ status: event.target.value as Representative["status"] })
                    }
                  >
                    {REPRESENTATIVE_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea
                    rows={3}
                    className={cn(inputClassName(), "resize-y")}
                    value={selectedRepresentative.notes}
                    onChange={(event) => patchSelected({ notes: event.target.value })}
                    placeholder="Territory coverage, commission terms, key accounts…"
                  />
                </div>
              </div>
            </section>
          ) : null
        }
      />
    </div>
  );
}
