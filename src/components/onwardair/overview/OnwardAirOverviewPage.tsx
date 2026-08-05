"use client";

import { Maximize2, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { ONWARDAIR_HOME_ACCENT } from "@/lib/onwardair-surface";
import {
  type OnwardAirOverviewEditableContent,
  defaultOnwardAirOverviewContent,
  overviewScreenshotForView,
} from "@/lib/onwardair/overview-demo";
import {
  isInternalOperationsView,
  resolveInternalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import type { SurveyOperationsView } from "@/lib/survey-operations-mock-data";
import { OperatorEntitlementsProvider } from "@/components/testflighthub/OperatorEntitlementsProvider";
import SurveyOperationsSidebar from "@/components/testflighthub/SurveyOperationsSidebar";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const OA_LOGO = "/images/workspaces/onwardair-logo.png";
const HERO_BG = "/images/overview-corporate-intelligence-bg.png";

function OverviewPlatformNav({
  activeView,
  onViewChange,
}: {
  activeView: InternalOperationsView;
  onViewChange: (view: InternalOperationsView) => void;
}) {
  return (
    <SurveyOperationsSidebar
      mode="internal"
      activeView={activeView}
      basePath="/overview"
      overviewEmbed
      onViewChange={(view: SurveyOperationsView | InternalOperationsView) => {
        if (isInternalOperationsView(view)) onViewChange(view);
      }}
    />
  );
}

export function OnwardAirOverviewPage() {
  const [content, setContent] = useState<OnwardAirOverviewEditableContent>(() =>
    defaultOnwardAirOverviewContent(),
  );
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<InternalOperationsView>("home");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

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

  useEffect(() => {
    if (!previewFullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [previewFullscreen]);

  const previewTitle = useMemo(() => {
    try {
      return resolveInternalViewTitles(activeView).title;
    } catch {
      return "Home";
    }
  }, [activeView]);

  const previewSrc = useMemo(() => overviewScreenshotForView(activeView), [activeView]);

  const headerLine = `${content.headline} – ${content.subheadline}`;

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
        <header className="flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${OA_LOGO}?v=swap7`}
              alt="OnwardAir"
              width={200}
              height={40}
              decoding="async"
              className="block object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
              style={{ height: 36, width: "auto", maxWidth: 160, maxHeight: 36 }}
            />
            <p
              className="mt-2 min-w-0 whitespace-nowrap text-white/85"
              style={{ fontSize: "clamp(10px, 1.05vw, 13.5px)", lineHeight: 1.3 }}
            >
              {headerLine}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
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

        <div className="mt-5 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,2.45fr)] lg:gap-3.5 lg:items-stretch">
          {/* Equal-height briefing cards */}
          <aside className="grid h-full min-h-0 grid-rows-3 gap-4 overflow-hidden">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#267B90]/20 bg-white p-3 text-[#1B2430] shadow-[0_8px_24px_rgba(0,0,0,0.14)] sm:p-3.5">
              <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-2 overflow-y-auto py-0.5">
                {content.questions.map((q, i) => (
                  <li
                    key={`q-${i}`}
                    className="oa-overview-question flex items-start gap-2.5"
                    style={{ animationDelay: `${i * 0.55}s` }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white sm:text-[12px]"
                      style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-[13px] leading-snug text-[#1B2430] sm:text-[14px] lg:text-[15px]">{q}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#267B90]/25 bg-[#0B3A4A]/85 p-3 text-white backdrop-blur-[2px] sm:p-3.5">
              <p className="shrink-0 text-[12px] font-bold uppercase tracking-[0.14em] sm:text-[13px]" style={{ color: "#7DD3E8" }}>
                {content.highlightsTitle}
              </p>
              <ul className="mt-2 flex min-h-0 flex-1 flex-col justify-evenly gap-1 overflow-y-auto">
                {content.highlights.map((item, i) => (
                  <li key={`h-${i}`} className="text-[12px] leading-snug text-white/95 sm:text-[13px] lg:text-[14px]">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#267B90]/25 bg-white p-3 text-[#1B2430] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-3.5">
              <h2 className="shrink-0 truncate text-[12px] font-semibold tracking-tight text-[#1B2430] sm:text-[13px]">
                {content.agendaTitle}
              </h2>
              <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-y-auto">
                {content.agenda.map((row, i) => (
                  <div
                    key={`a-${i}`}
                    className="rounded-lg border border-[#267B90]/20 bg-[#F4FAFB] px-2.5 py-1.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p
                        className="text-[9px] font-bold uppercase tracking-wider sm:text-[10px]"
                        style={{ color: ONWARDAIR_HOME_ACCENT }}
                      >
                        {row.wave.includes("min") ? row.wave : `${row.wave} min`}
                      </p>
                      <p className="text-[11px] font-semibold text-[#1B2430] sm:text-[12px]">{row.who}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#5B6577] sm:text-[11px]">{row.why}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="flex min-h-[420px] min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#050B16] shadow-[0_12px_36px_rgba(0,0,0,0.35)] lg:min-h-0">
            <OperatorEntitlementsProvider>
              <Suspense fallback={<div className="w-[240px] shrink-0 bg-[#07111F]" />}>
                <OverviewPlatformNav activeView={activeView} onViewChange={setActiveView} />
              </Suspense>
            </OperatorEntitlementsProvider>

            <div className="relative min-h-0 min-w-0 flex-1 bg-[#020617]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={previewSrc}
                src={previewSrc}
                alt={`${previewTitle} screenshot`}
                className="absolute inset-0 h-full w-full object-contain object-top"
                decoding="async"
              />
              <button
                type="button"
                onClick={() => setPreviewFullscreen(true)}
                className="absolute bottom-2.5 right-2.5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/55 text-white shadow-md transition hover:bg-[#267B90]"
                aria-label="View screenshot full screen"
                title="Full screen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-1.5 shrink-0 text-center text-[9px] text-white/35 sm:text-[10px]">
          OnwardAir · Unit311 Central · Private overview
          {loading ? " · Loading…" : null}
        </footer>
      </div>

      {previewFullscreen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewTitle} full screen`}
          onClick={() => setPreviewFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewFullscreen(false)}
            className="absolute right-4 top-4 z-[81] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label="Close full screen"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative flex h-full w-full max-w-[1600px] flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 shrink-0 text-center text-sm font-medium text-white/80">{previewTitle}</p>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/15 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={`${previewTitle} full screen`}
                className="h-full w-full object-contain object-center"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
