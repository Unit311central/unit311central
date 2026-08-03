"use client";

import { useMemo, useState } from "react";
import { Check, Filter } from "lucide-react";

import {
  updateStoryStatus,
  type PortfolioStory,
  type StoryStatus,
} from "@/lib/talanton/marketing-stories-store";
import { cn } from "@/lib/utils";
import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";
import { useTalantonMarketingStoriesStore } from "./useTalantonMarketingStoriesStore";

const STATUS_FILTERS: Array<StoryStatus | "all"> = [
  "all",
  "Submitted",
  "Under Review",
  "Approved",
  "Published",
  "Draft",
];

function statusClass(status: StoryStatus) {
  if (status === "Published" || status === "Approved") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "Under Review") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "Submitted") return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  return "border-white/15 bg-white/[0.04] text-white/60";
}

function storyCopy(s: PortfolioStory) {
  return [
    s.title,
    `${s.companyName} · ${s.country} · ${s.status}`,
    s.impactCategory,
    "",
    s.summary,
    "",
    s.fullStory,
  ].join("\n");
}

export default function PortfolioStoriesWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const [statusFilter, setStatusFilter] = useState<StoryStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of store.stories) map.set(s.companyId, s.companyName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [store.stories]);

  const filtered = useMemo(() => {
    return store.stories
      .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
      .filter((s) => (companyFilter === "all" ? true : s.companyId === companyFilter))
      .sort((a, b) => Date.parse(b.submissionDate) - Date.parse(a.submissionDate));
  }, [store.stories, statusFilter, companyFilter]);

  const arcCount = store.stories.filter((s) => s.companyId === "ti-co-arc-ride").length;
  const digest = filtered
    .map((s) => `• [${s.status}] ${s.companyName}: ${s.title}`)
    .join("\n");

  const selectClass =
    "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-emerald-400/40";

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Marketing & Stories"
        title="Portfolio Stories"
        description="Stories submitted by portfolio companies (including ARC Ride Stories & Impact) feed Marketing, Media Library, and Digital Newsletter once approved."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <TalantonImpactMetric label="Stories in feed" value={store.stories.length} />
        <TalantonImpactMetric
          label="ARC Ride submissions"
          value={arcCount}
          hint="Company portal"
          tone="good"
        />
        <TalantonImpactMetric
          label="Ready for newsletter"
          value={store.stories.filter((s) => s.status === "Approved" || s.status === "Published").length}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-white/45">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-white/45">Status</span>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StoryStatus | "all")}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-white/45">Company</span>
            <select
              className={selectClass}
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="all">All companies</option>
              {companies.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <TalantonGeneratedPanel eyebrow="Live feed" title="Story queue" copyText={digest}>
        <div className="space-y-4">
          {filtered.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusClass(s.status))}>
                      {s.status}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-white/40">
                      {s.companyName} · {s.country}
                    </span>
                    <span className="text-[10px] text-white/35">{s.submissionDate}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-white">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{s.summary}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {s.impactCategory} · {s.photos.length} photos · {s.videos.length} videos ·{" "}
                    {s.attachments.length} attachments · by {s.submittedBy}
                  </p>
                </div>
                <CopyToClipboardButton text={storyCopy(s)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["Submitted", "Submitted"],
                    ["Under Review", "Under Review"],
                    ["Approved", "Approved"],
                    ["Published", "Published"],
                  ] as const
                ).map(([label, status]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateStoryStatus(s.id, status)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition",
                      s.status === status
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                        : "border-white/10 text-white/55 hover:border-white/25 hover:text-white",
                    )}
                  >
                    {s.status === status ? <Check className="h-3 w-3" /> : null}
                    {label}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {filtered.length === 0 ? (
            <p className="text-sm text-white/45">No stories match the current filters.</p>
          ) : null}
        </div>
      </TalantonGeneratedPanel>
    </div>
  );
}
