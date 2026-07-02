"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const concepts = [
  {
    id: "a",
    label: "Concept A",
    name: "Command Center",
    status: "Live on Home",
    image: "/mockups/concept-a-command-center.png",
    summary:
      "KPI hero strip plus modules grouped by sidebar sections. Dense but scannable — best for daily ops.",
    traits: ["Grouped navigation", "KPI strip", "Horizontal module rows"],
  },
  {
    id: "b",
    label: "Concept B",
    name: "Executive Briefing",
    status: "Mockup",
    image: "/mockups/concept-b-executive-briefing.png",
    summary:
      "Split layout with a narrative left column and bento grid of featured modules. Feels boardroom-ready.",
    traits: ["Editorial hero", "Bento grid", "Featured modules"],
  },
  {
    id: "c",
    label: "Concept C",
    name: "Ops Horizon",
    status: "Mockup",
    image: "/mockups/concept-c-ops-horizon.png",
    summary:
      "Central live map / telemetry canvas with orbiting shortcuts. Strong field-ops identity.",
    traits: ["Map centerpiece", "Orbital modules", "Telemetry focus"],
  },
] as const;

type InternalDesignMockupsProps = {
  onBack: () => void;
};

export default function InternalDesignMockups({ onBack }: InternalDesignMockupsProps) {
  const [activeId, setActiveId] = useState<(typeof concepts)[number]["id"]>("a");
  const active = concepts.find((concept) => concept.id === activeId) ?? concepts[0];

  return (
    <section aria-label="Home design concepts" className="mx-auto max-w-6xl space-y-5 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </button>
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Home redesign concepts</h2>
          <p className="max-w-2xl text-sm text-white/55">
            Three directions for a more polished internal landing page. Concept A is implemented on Home.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {concepts.map((concept) => (
          <button
            key={concept.id}
            type="button"
            onClick={() => setActiveId(concept.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left transition-all sm:px-4",
              activeId === concept.id
                ? "border-sky-400/40 bg-sky-500/10 text-white shadow-[0_8px_24px_rgba(14,165,233,0.12)]"
                : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {concept.label}
            </span>
            <span className="mt-0.5 block text-sm font-medium">{concept.name}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070b12] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <div className="relative aspect-[16/10] w-full bg-black/40">
          <Image
            src={active.image}
            alt={`${active.name} home mockup`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1200px) 100vw, 1152px"
            priority
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{active.name}</h3>
            {active.status === "Live on Home" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {active.status}
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/50">
                {active.status}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{active.summary}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-400/90">
            Key traits
          </p>
          <ul className="mt-3 space-y-2">
            {active.traits.map((trait) => (
              <li key={trait} className="flex items-center gap-2 text-sm text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400/80" />
                {trait}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
