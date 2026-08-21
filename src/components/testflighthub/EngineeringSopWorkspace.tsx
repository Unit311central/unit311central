"use client";

import { useMemo, useState } from "react";
import { Play, Plus, Search, Settings2 } from "lucide-react";

import {
  canRunEngSop,
  countSopSteps,
  engSopStatusClass,
  type EngSop,
  type EngSopRun,
  type EngSopStatus,
} from "@/lib/engineering-sop-data";
import { getLatestCompletedRun, startEngSopRun } from "@/lib/engineering-sop-store";
import { useEngineeringSopStore } from "./useEngineeringSopStore";
import {
  DEFAULT_SOP_RUNNER,
  EngSopCreatePanel,
  EngSopDefinitionPanel,
  EngSopManagePanel,
  EngSopRunPanel,
} from "./EngineeringSopPanels";
import {
  WsEmpty,
  WsInputClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsSection,
  WsStatusPill,
} from "./domain-workspace-ui";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function formatLastRun(run: EngSopRun | undefined) {
  if (!run?.completedAt) return "Never run";
  const day = formatDate(run.completedAt);
  return `Last run: ${day} · ${run.status}`;
}

export default function EngineeringSopWorkspace() {
  const store = useEngineeringSopStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EngSopStatus | "All">("All");
  const [notice, setNotice] = useState<string | null>(null);
  const [definitionSop, setDefinitionSop] = useState<EngSop | null>(null);
  const [manageSop, setManageSop] = useState<EngSop | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeRun, setActiveRun] = useState<{ sop: EngSop; run: EngSopRun } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.sops.filter((sop) => {
      if (statusFilter !== "All" && sop.status !== statusFilter) return false;
      if (!q) return true;
      return (
        sop.number.toLowerCase().includes(q) ||
        sop.title.toLowerCase().includes(q) ||
        sop.owner.toLowerCase().includes(q) ||
        sop.approver.toLowerCase().includes(q)
      );
    });
  }, [store.sops, search, statusFilter]);

  const catalogue = useMemo(() => {
    const byNumber = new Map<string, EngSop[]>();
    for (const sop of filtered) {
      const list = byNumber.get(sop.number) ?? [];
      list.push(sop);
      byNumber.set(sop.number, list);
    }
    const rows: EngSop[] = [];
    for (const group of byNumber.values()) {
      const approved = group.find((s) => s.status === "Approved");
      if (approved) rows.push(approved);
      else rows.push(group[0]!);
    }
    return rows.sort((a, b) => a.title.localeCompare(b.title));
  }, [filtered]);

  function handleRun(sop: EngSop) {
    if (!canRunEngSop(sop)) {
      setNotice("Only approved procedures can be run.");
      return;
    }
    const run = startEngSopRun(sop.id, DEFAULT_SOP_RUNNER);
    if (!run) {
      setNotice("Could not start run.");
      return;
    }
    setActiveRun({ sop, run });
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <WsSection
        title="Engineering Procedures"
        subtitle="Controlled procedures to run — not a document register."
        actions={
          <button type="button" className={WsSecondaryButtonClass()} onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New procedure
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
              placeholder="Search procedures…"
              className={`${WsInputClass()} mt-0 pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EngSopStatus | "All")}
            className={`${WsInputClass()} mt-0 w-auto min-w-[140px]`}
          >
            <option value="All">All statuses</option>
            <option value="Approved">Approved</option>
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="Obsolete">Obsolete</option>
          </select>
        </div>

        {catalogue.length === 0 ? (
          <WsEmpty message="No procedures match your filters." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {catalogue.map((sop) => (
              <SopProcedureCard
                key={sop.id}
                sop={sop}
                lastRun={getLatestCompletedRun(sop.id)}
                onRun={() => handleRun(sop)}
                onViewDefinition={() => setDefinitionSop(sop)}
                onManage={() => setManageSop(sop)}
              />
            ))}
          </div>
        )}
      </WsSection>

      {definitionSop ? (
        <EngSopDefinitionPanel sop={definitionSop} onClose={() => setDefinitionSop(null)} />
      ) : null}

      {manageSop ? (
        <EngSopManagePanel
          sop={manageSop}
          onClose={() => setManageSop(null)}
          onSaved={(msg) => setNotice(msg)}
          onDraftCreated={(draft) => {
            setNotice(`Draft revision ${draft.version} created.`);
            setManageSop(draft);
          }}
        />
      ) : null}

      {createOpen ? (
        <EngSopCreatePanel onClose={() => setCreateOpen(false)} onCreated={(msg) => setNotice(msg)} />
      ) : null}

      {activeRun ? (
        <EngSopRunPanel
          sop={activeRun.sop}
          run={activeRun.run}
          runnerName={DEFAULT_SOP_RUNNER}
          onClose={() => setActiveRun(null)}
          onComplete={() => setNotice(`${activeRun.sop.title} run recorded.`)}
        />
      ) : null}
    </div>
  );
}

function SopProcedureCard({
  sop,
  lastRun,
  onRun,
  onViewDefinition,
  onManage,
}: {
  sop: EngSop;
  lastRun: EngSopRun | undefined;
  onRun: () => void;
  onViewDefinition: () => void;
  onManage: () => void;
}) {
  const steps = countSopSteps(sop);
  const runnable = canRunEngSop(sop);

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1524] to-[#0a101c] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">{sop.title}</h3>
          <p className="mt-1 text-sm text-white/55">
            v{sop.version} · {sop.status} · {steps} steps
          </p>
        </div>
        <WsStatusPill className={engSopStatusClass(sop.status)}>{sop.status}</WsStatusPill>
      </div>

      <p className="mt-2 text-xs text-white/45">
        Owner {sop.owner} · Approver {sop.approver} · Effective {formatDate(sop.effectiveDate)} · Review{" "}
        {formatDate(sop.reviewDate)}
      </p>
      <p className="mt-1 text-xs text-white/40">{formatLastRun(lastRun)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={WsPrimaryButtonClass(!runnable)}
          disabled={!runnable}
          onClick={onRun}
        >
          <Play className="h-3.5 w-3.5" />
          Run SOP
        </button>
        <button type="button" className={WsSecondaryButtonClass()} onClick={onViewDefinition}>
          View Definition
        </button>
        <button type="button" className={WsSecondaryButtonClass()} onClick={onManage}>
          <Settings2 className="h-3.5 w-3.5" />
          Manage
        </button>
      </div>
    </article>
  );
}
