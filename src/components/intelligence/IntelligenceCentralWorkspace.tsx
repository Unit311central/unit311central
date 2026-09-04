"use client";

import {
  AlertTriangle,
  Brain,
  ChevronRight,
  Filter,
  Loader2,
  Radar,
  Search,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ManagedClient } from "@/lib/client-management-data";
import type {
  IntelligenceBriefing,
  IntelligenceDomainDefinition,
  IntelligenceRecord,
  IntelligenceSeverity,
  IntelligenceSource,
} from "@/lib/intelligence/types";
import { resolveIntelligenceDomainForView } from "@/lib/intelligence/views";
import { resolveIntelligenceWorkspaceSlugFromBrowser } from "@/lib/intelligence/workspace-context";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";
import { cn } from "@/lib/utils";

const SEVERITIES: IntelligenceSeverity[] = ["critical", "high", "medium", "low", "info"];

const SEVERITY_STYLES: Record<IntelligenceSeverity, string> = {
  critical: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  high: "border-orange-400/35 bg-orange-500/12 text-orange-100",
  medium: "border-amber-400/35 bg-amber-500/12 text-amber-100",
  low: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  info: "border-white/15 bg-white/[0.05] text-white/70",
};

function severityLabel(severity: IntelligenceSeverity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export type IntelligenceCentralWorkspaceProps = {
  workspaceSlug?: string | null;
  activeView: string;
  clients?: ManagedClient[];
};

export default function IntelligenceCentralWorkspace({
  workspaceSlug: workspaceSlugProp,
  activeView,
  clients,
}: IntelligenceCentralWorkspaceProps) {
  const workspaceSlug =
    workspaceSlugProp ?? resolveIntelligenceWorkspaceSlugFromBrowser() ?? "";
  const isGreenDesertWorkspace = isGreenDesertSlug(workspaceSlug);

  const initialDomain = useMemo(
    () => resolveIntelligenceDomainForView(workspaceSlug, activeView),
    [workspaceSlug, activeView],
  );

  const [domains, setDomains] = useState<IntelligenceDomainDefinition[]>([]);
  const [packLabel, setPackLabel] = useState("Intelligence");
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(
    initialDomain?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<IntelligenceSeverity | "all">("all");
  const [records, setRecords] = useState<IntelligenceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<IntelligenceBriefing | null>(null);
  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedDomain = domains.find((d) => d.id === selectedDomainId) ?? null;
  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  useEffect(() => {
    if (initialDomain?.id) setSelectedDomainId(initialDomain.id);
  }, [initialDomain?.id]);

  const loadDomains = useCallback(async () => {
    const response = await fetch("/api/intelligence/domains", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load intelligence domains.");
    const data = (await response.json()) as {
      label?: string;
      domains?: IntelligenceDomainDefinition[];
    };
    setPackLabel(data.label ?? "Intelligence");
    setDomains(data.domains ?? []);
    if (!selectedDomainId && data.domains?.[0]) {
      setSelectedDomainId(data.domains[0].id);
    }
  }, [selectedDomainId]);

  const loadDomainData = useCallback(
    async (domainId: string) => {
      setLoading(true);
      setError(null);
      try {
        const providerData =
          clients && clients.length > 0
            ? `&providerData=${encodeURIComponent(JSON.stringify({ clients }))}`
            : "";

        const searchParams = new URLSearchParams({
          domainId,
          limit: "50",
          offset: "0",
        });
        if (search.trim()) searchParams.set("search", search.trim());
        if (severityFilter !== "all") searchParams.append("severity", severityFilter);

        const [searchRes, briefingRes, sourcesRes] = await Promise.all([
          fetch(`/api/intelligence/search?${searchParams.toString()}${providerData}`, {
            cache: "no-store",
          }),
          fetch(`/api/intelligence/briefing?domainId=${encodeURIComponent(domainId)}${providerData}`, {
            cache: "no-store",
          }),
          fetch(`/api/intelligence/sources?domainId=${encodeURIComponent(domainId)}`, {
            cache: "no-store",
          }),
        ]);

        if (!searchRes.ok) throw new Error("Failed to search intelligence records.");
        const searchData = (await searchRes.json()) as {
          records?: IntelligenceRecord[];
          total?: number;
          error?: string;
        };
        setRecords(searchData.records ?? []);
        setTotal(searchData.total ?? 0);
        setSelectedRecordId((current) =>
          current && searchData.records?.some((r) => r.id === current) ? current : null,
        );

        if (briefingRes.ok) {
          const briefingData = (await briefingRes.json()) as { briefing?: IntelligenceBriefing };
          setBriefing(briefingData.briefing ?? null);
        } else {
          setBriefing(null);
        }

        if (sourcesRes.ok) {
          const sourcesData = (await sourcesRes.json()) as { sources?: IntelligenceSource[] };
          setSources(sourcesData.sources ?? []);
        } else {
          setSources([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load intelligence.");
      } finally {
        setLoading(false);
      }
    },
    [clients, search, severityFilter],
  );

  useEffect(() => {
    void loadDomains().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load domains.");
      setLoading(false);
    });
  }, [loadDomains]);

  useEffect(() => {
    if (!selectedDomainId) return;
    void loadDomainData(selectedDomainId);
  }, [selectedDomainId, loadDomainData]);

  if (!workspaceSlug) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
        Intelligence is not configured for this workspace.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300/90">
            {isGreenDesertWorkspace ? packLabel : "Unit311 Intelligence"}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
            <Brain className="h-6 w-6 text-violet-300" />
            {packLabel}
          </h1>
          {selectedDomain?.description ? (
            <p className="mt-2 max-w-2xl text-sm text-white/60">{selectedDomain.description}</p>
          ) : null}
        </div>
        {briefing?.posture ? (
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm text-violet-100">
            Posture: <span className="font-semibold capitalize">{briefing.posture}</span>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {domains.map((domain) => (
          <button
            key={domain.id}
            type="button"
            onClick={() => setSelectedDomainId(domain.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition",
              selectedDomainId === domain.id
                ? "border-violet-400/40 bg-violet-500/20 text-violet-50"
                : "border-white/12 bg-white/[0.03] text-white/65 hover:bg-white/[0.06]",
            )}
          >
            {domain.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="flex min-h-0 flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-white/35" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search intelligence…"
                className="w-full rounded-lg border border-white/12 bg-black/25 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/12 bg-black/20 p-1">
              <Filter className="mx-1 h-3.5 w-3.5 text-white/40" />
              <button
                type="button"
                onClick={() => setSeverityFilter("all")}
                className={cn(
                  "rounded px-2 py-1 text-[11px]",
                  severityFilter === "all" ? "bg-white/10 text-white" : "text-white/55",
                )}
              >
                All
              </button>
              {SEVERITIES.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setSeverityFilter(severity)}
                  className={cn(
                    "rounded px-2 py-1 text-[11px] capitalize",
                    severityFilter === severity ? "bg-white/10 text-white" : "text-white/55",
                  )}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center gap-2 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading intelligence records…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">
                {total} record{total === 1 ? "" : "s"}
              </p>
              <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {records.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRecordId(record.id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition",
                        selectedRecordId === record.id
                          ? "border-violet-400/35 bg-violet-500/10"
                          : "border-white/10 bg-black/20 hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{record.title}</p>
                          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/55">
                            {record.summary}
                          </p>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                            SEVERITY_STYLES[record.severity],
                          )}
                        >
                          {severityLabel(record.severity)}
                        </span>
                        {record.score ? (
                          <span className="text-[10px] text-white/45">
                            Score {record.score.value}
                            {record.score.label ? ` · ${record.score.label}` : ""}
                          </span>
                        ) : null}
                        {record.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                ))}
                {records.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                    No intelligence records match your filters.
                  </li>
                ) : null}
              </ul>
            </>
          )}
        </section>

        <div className="flex min-h-0 flex-col gap-4">
          <section className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-violet-100">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-sm font-semibold">What needs attention</h2>
            </div>
            {briefing ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm font-medium text-white">{briefing.headline}</p>
                {briefing.postureReason ? (
                  <p className="text-[12px] text-white/60">{briefing.postureReason}</p>
                ) : null}
                {briefing.sections.map((section) => (
                  <div key={section.id}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                      {section.title}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="text-[12px] leading-relaxed text-white/70">
                          • {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {briefing.recommendedActions?.length ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                      Recommended actions
                    </p>
                    <ul className="mt-1 space-y-1">
                      {briefing.recommendedActions.map((action) => (
                        <li key={action} className="text-[12px] text-emerald-100/90">
                          → {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/50">No briefing available for this domain.</p>
            )}
          </section>

          {selectedRecord ? (
            <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-white/80">
                <Radar className="h-4 w-4 text-sky-300" />
                <h2 className="text-sm font-semibold">Record detail</h2>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{selectedRecord.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{selectedRecord.summary}</p>
              <dl className="mt-4 space-y-2 text-[12px]">
                <div className="flex justify-between gap-3 border-b border-white/8 pb-2">
                  <dt className="text-white/45">Severity</dt>
                  <dd className="capitalize text-white/80">{selectedRecord.severity}</dd>
                </div>
                {selectedRecord.score ? (
                  <div className="flex justify-between gap-3 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Score</dt>
                    <dd className="text-white/80">
                      {selectedRecord.score.value}
                      {selectedRecord.score.band ? ` (${selectedRecord.score.band})` : ""}
                    </dd>
                  </div>
                ) : null}
                {selectedRecord.categories.length ? (
                  <div className="border-b border-white/8 pb-2">
                    <dt className="text-white/45">Categories</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {selectedRecord.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/65"
                        >
                          {cat.label}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {selectedRecord.tags.length ? (
                  <div className="border-b border-white/8 pb-2">
                    <dt className="text-white/45">Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {selectedRecord.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/65"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {sources.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <h2 className="text-sm font-semibold text-white/85">Sources</h2>
              <ul className="mt-2 space-y-2">
                {sources.map((source) => (
                  <li key={source.id} className="text-[12px] text-white/60">
                    <span className="font-medium text-white/80">{source.name}</span>
                    {source.description ? ` — ${source.description}` : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
