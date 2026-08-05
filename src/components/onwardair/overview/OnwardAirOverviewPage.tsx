"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

import { ONWARDAIR_HOME_ACCENT } from "@/lib/onwardair-surface";
import {
  type OnwardAirOverviewEditableContent,
  defaultOnwardAirOverviewContent,
} from "@/lib/onwardair/overview-demo";
import WorkspaceLoadingFallback from "@/components/testflighthub/WorkspaceLoadingFallback";
import SurveyOperationsSimulatorProvider from "@/components/testflighthub/SurveyOperationsSimulatorProvider";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const OA_LOGO = "/images/workspaces/onwardair-logo.png";
const HERO_BG = "/images/overview-corporate-intelligence-bg.png";

const InternalOperationsDashboard = dynamic(
  () => import("@/components/testflighthub/InternalOperationsDashboard"),
  {
    ssr: false,
    loading: () => <WorkspaceLoadingFallback variant="page" label="Loading OnwardAir platform" />,
  },
);

export function OnwardAirOverviewPage() {
  const [content, setContent] = useState<OnwardAirOverviewEditableContent>(() =>
    defaultOnwardAirOverviewContent(),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onwardair/overview-content", { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { content: OnwardAirOverviewEditableContent };
        if (cancelled) return;
        const defaults = defaultOnwardAirOverviewContent();
        setContent({
          ...data.content,
          headline: defaults.headline,
          subheadline: defaults.subheadline,
          questionsIntro: defaults.questionsIntro,
          questions: defaults.questions,
          highlights: defaults.highlights,
          highlightsTitle: defaults.highlightsTitle,
          agenda: defaults.agenda,
          agendaTitle: defaults.agendaTitle,
          agendaIntro: defaults.agendaIntro,
        });
      } catch {
        if (!cancelled) setContent(defaultOnwardAirOverviewContent());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="oa-overview relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.42]"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020617]/72 via-[#020617]/78 to-[#020617]/88"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-3 lg:px-5 lg:py-3">
        {/* Row 1: OA logo + demo headline (single line) | Unit311 + sign out */}
        <header className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${OA_LOGO}?v=swap7`}
            alt="OnwardAir"
            width={200}
            height={40}
            decoding="async"
            className="block shrink-0 object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
            style={{ height: 36, width: "auto", maxWidth: 160, maxHeight: 36 }}
          />
          <p
            className="min-w-0 flex-1 whitespace-nowrap text-white/90"
            style={{ fontSize: "clamp(10px, 1.05vw, 14px)", lineHeight: 1.25 }}
          >
            <span className="font-semibold text-white">{content.headline}</span>
            <span className="text-white/45"> — </span>
            <span className="text-white/70">{content.subheadline}</span>
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            <a href="https://unit311central.com" aria-label="Unit311 Central" className="inline-flex h-9 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${UNIT311_LOGO}?v=swap7`}
                alt="Unit311 Central"
                width={100}
                height={22}
                decoding="async"
                className="block object-contain object-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
                style={{ height: 20, width: "auto", maxWidth: 92, maxHeight: 20 }}
              />
            </a>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
                window.location.assign("/overview/login");
              }}
              className="inline-flex min-h-11 touch-manipulation items-center px-2 text-xs font-medium text-white/70 underline-offset-2 hover:text-white hover:underline sm:min-h-0 sm:text-[11px]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Row 2: OS tagline */}
        <p className="mt-2 shrink-0 whitespace-nowrap text-[11px] leading-snug text-white/65 sm:text-[12px]">
          {content.questionsIntro}
        </p>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,2.4fr)] lg:gap-3">
          {/* Briefing column */}
          <aside className="flex min-h-0 flex-col gap-2.5 overflow-hidden lg:overflow-hidden">
            <section className="shrink-0 rounded-xl border border-[#267B90]/20 bg-white p-3.5 text-[#1B2430] shadow-[0_8px_24px_rgba(0,0,0,0.14)] sm:p-4">
              <ul className="space-y-2">
                {content.questions.map((q, i) => (
                  <li
                    key={`q-${i}`}
                    className="oa-overview-question flex gap-2"
                    style={{ animationDelay: `${i * 0.55}s` }}
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[12px] leading-snug text-[#1B2430]">{q}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#267B90]/25 bg-[#0B3A4A]/85 p-3 text-white backdrop-blur-[2px] sm:p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "#7DD3E8" }}>
                {content.highlightsTitle}
              </p>
              <ul className="mt-2 space-y-1">
                {content.highlights.map((item, i) => (
                  <li key={`h-${i}`} className="text-[11px] leading-snug text-white/95">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="shrink-0 rounded-xl border border-[#267B90]/25 bg-white p-3 text-[#1B2430] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-3.5">
              <h2 className="text-[14px] font-semibold tracking-tight text-[#1B2430]">
                {content.agendaTitle}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#5B6577]">{content.agendaIntro}</p>
              <div className="mt-2.5 space-y-2">
                {content.agenda.map((row, i) => (
                  <div
                    key={`a-${i}`}
                    className="rounded-lg border border-[#267B90]/20 bg-[#F4FAFB] px-2.5 py-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: ONWARDAIR_HOME_ACCENT }}
                      >
                        {row.wave.includes("min") ? row.wave : `${row.wave} min`}
                      </p>
                      <p className="text-[12px] font-semibold text-[#1B2430]">{row.who}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#5B6577]">{row.why}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          {/* Live interactive platform — sidebar + content, single view */}
          <section className="relative flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#050B16] shadow-[0_12px_36px_rgba(0,0,0,0.35)] lg:min-h-0">
            <div className="relative h-full min-h-0 flex-1">
              <SurveyOperationsSimulatorProvider>
                <Suspense
                  fallback={<WorkspaceLoadingFallback variant="page" label="Loading OnwardAir platform" />}
                >
                  <InternalOperationsDashboard basePath="/overview" initialView="home" />
                </Suspense>
              </SurveyOperationsSimulatorProvider>
            </div>
          </section>
        </div>

        <footer className="mt-1.5 shrink-0 text-center text-[9px] text-white/35 sm:text-[10px]">
          OnwardAir · Unit311 Central · Private overview
          {loading ? " · Loading…" : null}
        </footer>
      </div>
    </div>
  );
}
