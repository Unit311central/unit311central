"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import {
  listJourneyStoriesForBoard,
  type JourneyStory,
} from "@/lib/talanton/journey-stories-store";

export default function BoardJourneyStoriesPage() {
  const stories = useMemo(() => listJourneyStoriesForBoard(), []);
  const [active, setActive] = useState<JourneyStory | null>(null);

  if (active) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-200/90 hover:text-emerald-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Latest Journey Stories
        </button>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                Board Portal · Journey Story
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">{active.title}</h1>
              <p className="mt-2 text-sm text-white/55">
                {active.country} · {active.startDate}
                {active.endDate !== active.startDate ? ` – ${active.endDate}` : ""} ·{" "}
                {active.author}
              </p>
              <p className="mt-1 text-xs text-white/40">
                Companies: {active.companyNames.join(", ")}
              </p>
            </div>
            <CopyToClipboardButton text={active.generated.boardSummary} />
          </div>
          <div className="mt-5 space-y-4">
            <section>
              <h2 className="text-sm font-semibold text-emerald-200/90">Executive Summary</h2>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                {active.generated.executiveSummary}
              </pre>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-emerald-200/90">Board Summary</h2>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                {active.generated.boardSummary}
              </pre>
            </section>
            <section>
              <h2 className="text-sm font-semibold text-emerald-200/90">Full Journey Story</h2>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                {active.generated.journeyStory}
              </pre>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
          Board Portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Latest Journey Stories</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Field journeys from Harry and the investment team — impact witnessed, challenges, and
          prayer points for board oversight.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {stories.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-emerald-400/30"
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-white/40">
              <MapPin className="h-3 w-3" />
              {s.country} · {s.startDate}
            </div>
            <h2 className="mt-2 text-base font-semibold text-white">{s.title}</h2>
            <p className="mt-2 line-clamp-4 text-sm text-white/60">
              {s.generated.executiveSummary}
            </p>
            <p className="mt-3 text-xs text-emerald-200/80">Open full journey →</p>
          </button>
        ))}
        {stories.length === 0 ? (
          <p className="text-sm text-white/45">No journey stories distributed to the Board Portal yet.</p>
        ) : null}
      </div>
    </div>
  );
}
