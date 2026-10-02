import Link from "next/link";

import WolfLogoMark from "@/components/layout/WolfLogoMark";
import WolfRealtimeHeroProductPreview from "@/components/wolf-realtime-website/WolfRealtimeHeroProductPreview";
import WolfRealtimeOperatingModelSection from "@/components/wolf-realtime-website/WolfRealtimeOperatingModelSection";
import { wolfEyebrowClass } from "@/components/wolf/wolf-ui";
import { WOLF_CENTRAL_ORIGIN } from "@/lib/wolf/wolf-surface";
import { WOLF_REALTIME_CONTACT_EMAIL } from "@/lib/wolf-realtime-website-surface";

const pipelineStages = [
  {
    label: "Flight",
    description: "Aerial operations and data capture across the reserve estate.",
  },
  {
    label: "Intelligence",
    description: "Turn aerial video into detections and operational signals.",
  },
  {
    label: "Command",
    description: "Estate overview, domain summaries, and operator awareness in WOLF Central.",
  },
] as const;

export default function WolfRealtimeHomeContent() {
  return (
    <>
      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden bg-[#080c0a] text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(26,77,58,0.35),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div>
            <WolfLogoMark size="lg" className="mb-8" />
            <h1 className="text-2xl font-semibold uppercase leading-tight tracking-[0.06em] text-white sm:text-3xl lg:text-4xl lg:leading-[1.15]">
              Real-time intelligence for wildlife operations
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              Aerial operations, intelligence and command software built for wildlife reserves.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${WOLF_REALTIME_CONTACT_EMAIL}?subject=WOLF%20demonstration%20request`}
                className="inline-flex items-center justify-center rounded-md border border-emerald-400/40 bg-emerald-600/90 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
              >
                Request a demonstration
              </a>
              <Link
                href="#wolf-platform"
                className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/[0.04] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 transition-colors hover:border-white/35 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                Explore the platform
              </Link>
            </div>
          </div>
          <WolfRealtimeHeroProductPreview />
        </div>
      </section>

      {/* Section 2 — What is WOLF? */}
      <section
        id="wolf-platform"
        className="border-t border-white/[0.06] bg-[#060908] py-16 text-white sm:py-20 lg:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className={wolfEyebrowClass}>WOLF Realtime</p>
          <h2 className="mt-3 max-w-4xl text-xl font-semibold uppercase leading-snug tracking-[0.04em] text-white/95 sm:text-2xl lg:text-3xl">
            The operating system for aerial intelligence across the wildlife reserve.
          </h2>
          <div className="mt-8 max-w-3xl space-y-4 text-base leading-relaxed text-white/55 sm:text-lg">
            <p>
              WOLF connects aerial operations, artificial intelligence and operational command into
              a single platform.
            </p>
            <p>
              From flight and data capture through AI-powered intelligence to operator
              decision-making, WOLF gives reserve teams a unified view of what is happening across
              their estate.
            </p>
          </div>

          <div className="mt-14 border-t border-white/[0.08] pt-12">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/75">
              Flight → Intelligence → Command
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {pipelineStages.map((stage, index) => (
                <div
                  key={stage.label}
                  className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-5 py-6"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-white">{stage.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{stage.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-xs text-white/35">
              Authorised operators access WOLF Central at{" "}
              <a
                href={WOLF_CENTRAL_ORIGIN}
                className="text-emerald-300/70 underline-offset-2 hover:text-emerald-200/90 hover:underline"
              >
                {WOLF_CENTRAL_ORIGIN.replace("https://", "")}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <WolfRealtimeOperatingModelSection />
    </>
  );
}
