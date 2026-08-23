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
import { startEngineeringSopRunApi } from "@/lib/engineering-sop/client-api";
import {
  DEFAULT_SOP_RUNNER,
  EngSopCreatePanel,
  EngSopDefinitionPanel,
  EngSopManagePanel,
  EngSopRunPanel,
} from "./EngineeringSopPanels";
import { useEngineeringSopLibrary } from "./useEngineeringSopLibrary";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EngSopStatus | "All">("All");
  const [notice, setNotice] = useState<string | null>(null);
  const [definitionSop, setDefinitionSop] = useState<EngSop | null>(null);
  const [manageSop, setManageSop] = useState<EngSop | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeRun, setActiveRun] = useState<{ sop: EngSop; run: EngSopRun } | null>(null);
  const [runBusy, setRunBusy] = useState(false);

  const { sops, completedRunsBySopId, loading, error, refresh } = useEngineeringSopLibrary({
    search,
    status: statusFilter,
  });

  const catalogue = useMemo(() => {
    const byNumber = new Map<string, EngSop[]>();
    for (const sop of sops) {
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
  }, [sops]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "All";

  async function handleRun(sop: EngSop) {
    if (!canRunEngSop(sop)) {
      setNotice("Only approved procedures can be run.");
      return;
    }
    setNotice(null);
    setRunBusy(true);
    try {
      const run = await startEngineeringSopRunApi(sop.id);
      setActiveRun({ sop, run });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not start run.");
    } finally {
      setRunBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p>
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
            <option value="Retired">Retired</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-white/55">Loading procedures…</p>
        ) : catalogue.length === 0 ? (
          <WsEmpty
            message={
              hasFilters
                ? "No procedures match your filters."
                : "No procedures yet. Create one to get started."
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {catalogue.map((sop) => (
              <SopProcedureCard
                key={sop.id}
                sop={sop}
                lastRun={completedRunsBySopId.get(sop.id)}
                runBusy={runBusy}
                onRun={() => void handleRun(sop)}
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
          onSaved={(msg) => {
            setNotice(msg);
            void refresh();
          }}
          onDraftCreated={(draft) => {
            setNotice(`Draft revision ${draft.version} created.`);
            setManageSop(draft);
            void refresh();
          }}
        />
      ) : null}

      {createOpen ? (
        <EngSopCreatePanel
          onClose={() => setCreateOpen(false)}
          onCreated={(msg) => {
            setNotice(msg);
            void refresh();
          }}
        />
      ) : null}

      {activeRun ? (
        <EngSopRunPanel
          sop={activeRun.sop}
          run={activeRun.run}
          runnerName={DEFAULT_SOP_RUNNER}
          onClose={() => setActiveRun(null)}
          onComplete={() => {
            setNotice(`${activeRun.sop.title} run recorded.`);
            void refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function SopProcedureCard({
  sop,
  lastRun,
  runBusy,
  onRun,
  onViewDefinition,
  onManage,
}: {
  sop: EngSop;
  lastRun: EngSopRun | undefined;
  runBusy: boolean;
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
          className={WsPrimaryButtonClass(!runnable || runBusy)}
          disabled={!runnable || runBusy}
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
