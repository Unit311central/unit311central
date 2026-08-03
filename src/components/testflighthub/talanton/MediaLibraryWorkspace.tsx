"use client";

import { useMemo, useState } from "react";
import { FileText, Film, Image as ImageIcon } from "lucide-react";

import type { MediaType } from "@/lib/talanton/marketing-stories-store";
import { cn } from "@/lib/utils";
import { TalantonImpactMetric, TalantonIntelligenceHeader } from "./talanton-intelligence-ui";
import { useTalantonMarketingStoriesStore } from "./useTalantonMarketingStoriesStore";

function typeIcon(type: MediaType) {
  if (type === "Video") return <Film className="h-4 w-4 text-violet-300" />;
  if (type === "Document") return <FileText className="h-4 w-4 text-amber-300" />;
  return <ImageIcon className="h-4 w-4 text-emerald-300" />;
}

function typeClass(type: MediaType) {
  if (type === "Video") return "border-violet-400/30 bg-violet-500/10 text-violet-100";
  if (type === "Document") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MediaLibraryWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of store.media) map.set(m.sourceCompanyId, m.sourceCompanyName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [store.media]);

  const filtered = useMemo(() => {
    return store.media
      .filter((m) => (typeFilter === "all" ? true : m.mediaType === typeFilter))
      .filter((m) => (companyFilter === "all" ? true : m.sourceCompanyId === companyFilter));
  }, [store.media, typeFilter, companyFilter]);

  const counts = useMemo(() => {
    return {
      image: store.media.filter((m) => m.mediaType === "Image").length,
      video: store.media.filter((m) => m.mediaType === "Video").length,
      document: store.media.filter((m) => m.mediaType === "Document").length,
    };
  }, [store.media]);

  const selectClass =
    "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-emerald-400/40";

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Marketing & Stories"
        title="Media Library"
        description="Central media repository for portfolio communications — images, videos, and documents from approved stories and company portal uploads."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <TalantonImpactMetric label="Images" value={counts.image} hint="Photo assets" tone="good" />
        <TalantonImpactMetric label="Videos" value={counts.video} hint="Field & milestone clips" />
        <TalantonImpactMetric label="Documents" value={counts.document} hint="Briefs & one-pagers" />
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-white/45">Media type</span>
            <select
              className={selectClass}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MediaType | "all")}
            >
              <option value="all">All types</option>
              <option value="Image">Images</option>
              <option value="Video">Videos</option>
              <option value="Document">Documents</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-white/45">Source company</span>
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/50 via-[#0b1a14]/80 to-[#08110d] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {typeIcon(item.mediaType)}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    typeClass(item.mediaType),
                  )}
                >
                  {item.mediaType}
                </span>
              </div>
              <span className="text-[11px] text-white/40">{formatDate(item.uploadDate)}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-snug text-white">{item.name}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">{item.caption}</p>
            <div className="mt-3 border-t border-white/8 pt-3 text-xs text-white/45">
              <p>
                Source company · <span className="text-white/70">{item.sourceCompanyName}</span>
              </p>
              {item.storyTitle ? (
                <p className="mt-1">
                  From story · <span className="text-white/65">{item.storyTitle}</span>
                </p>
              ) : (
                <p className="mt-1 text-white/35">Direct portal upload</p>
              )}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-white/45">No media matches these filters.</p>
      ) : null}
    </div>
  );
}
