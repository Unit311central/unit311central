"use client";

import { Maximize2, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";

import { OverviewStyleTuner } from "@/components/onwardair/overview/OverviewStyleTuner";
import {
  type OnwardAirOverviewEditableContent,
  defaultOnwardAirOverviewContent,
  overviewScreenshotForView,
} from "@/lib/onwardair/overview-demo";
import {
  type OverviewLeftCardId,
  type OverviewStyleConfig,
  defaultOverviewStyleConfig,
  overviewCardBorder,
  overviewCardShadow,
  overviewFontStack,
} from "@/lib/onwardair/overview-style";
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
  const [style, setStyle] = useState<OverviewStyleConfig>(() => defaultOverviewStyleConfig());
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
  const layoutCols = `minmax(220px, ${style.page.leftColumnFr}fr) minmax(0, ${style.page.rightColumnFr}fr)`;
  const visibleLeftCards = style.leftColumnOrder.filter((id) => style[id].visible);
  const leftGridRows =
    visibleLeftCards.length > 0
      ? visibleLeftCards.map((id) => `minmax(0, ${style[id].heightFr}fr)`).join(" ")
      : "1fr";

  function renderLeftCard(id: OverviewLeftCardId) {
    const chrome = style[id];
    const border = overviewCardBorder({
      borderColor: chrome.borderColor,
      borderOpacity: chrome.borderOpacity,
    });
    const shadow = overviewCardShadow(chrome.shadowOpacity);
    const boxStyle: CSSProperties = {
      background: chrome.bg,
      padding: chrome.padding,
      borderRadius: chrome.radius,
      border,
      boxShadow: shadow,
    };

    if (id === "questions") {
      return (
        <section key={id} className="flex min-h-0 flex-col overflow-hidden" style={boxStyle}>
          <ul
            className="flex min-h-0 flex-1 flex-col justify-evenly overflow-y-auto py-0.5"
            style={{ gap: style.questions.itemGap }}
          >
            {content.questions.map((q, i) => (
              <li
                key={`q-${i}`}
                className="oa-overview-question flex items-start gap-2.5"
                style={{ animationDelay: `${i * 0.55}s` }}
              >
                <span
                  className="mt-0.5 flex shrink-0 items-center justify-center rounded-full font-bold text-white"
                  style={{
                    backgroundColor: style.questions.badgeColor,
                    width: style.questions.badgeSize,
                    height: style.questions.badgeSize,
                    fontSize: Math.round(style.questions.badgeSize * 0.55),
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className="leading-snug"
                  style={{ fontSize: style.questions.textSize, color: style.questions.textColor }}
                >
                  {q}
                </p>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    if (id === "highlights") {
      return (
        <section
          key={id}
          className="flex min-h-0 flex-col overflow-hidden text-white backdrop-blur-[2px]"
          style={boxStyle}
        >
          <p
            className="shrink-0 font-bold uppercase tracking-[0.14em]"
            style={{ fontSize: style.highlights.titleSize, color: style.highlights.titleColor }}
          >
            {content.highlightsTitle}
          </p>
          <ul className="mt-2 flex min-h-0 flex-1 flex-col justify-evenly gap-1 overflow-y-auto">
            {content.highlights.map((item, i) => (
              <li
                key={`h-${i}`}
                className="leading-snug"
                style={{ fontSize: style.highlights.itemSize, color: style.highlights.itemColor }}
              >
                <span style={{ color: style.highlights.bulletColor }}>• </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      );
    }

    return (
      <section key={id} className="flex min-h-0 flex-col overflow-hidden" style={boxStyle}>
        <h2
          className="shrink-0 truncate font-semibold tracking-tight"
          style={{ fontSize: style.agenda.titleSize, color: style.agenda.titleColor }}
        >
          {content.agendaTitle}
        </h2>
        <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-y-auto">
          {content.agenda.map((row, i) => (
            <div
              key={`a-${i}`}
              style={{
                background: style.agenda.rowBg,
                padding: `${style.agenda.rowPaddingY}px ${style.agenda.rowPaddingX}px`,
                borderRadius: style.agenda.rowRadius,
                border: overviewCardBorder({
                  borderColor: style.agenda.rowBorderColor,
                  borderOpacity: style.agenda.rowBorderOpacity,
                }),
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <p
                  className="font-bold uppercase tracking-wider"
                  style={{ fontSize: style.agenda.waveSize, color: style.agenda.waveColor }}
                >
                  {row.wave.includes("min") ? row.wave : `${row.wave} min`}
                </p>
                <p
                  className="font-semibold"
                  style={{ fontSize: style.agenda.whoSize, color: style.agenda.whoColor }}
                >
                  {row.who}
                </p>
              </div>
              <p
                className="mt-0.5 leading-snug"
                style={{ fontSize: style.agenda.whySize, color: style.agenda.whyColor }}
              >
                {row.why}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div
      className="oa-overview relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden text-white"
      style={{ fontFamily: overviewFontStack(style.typography.fontFamily) }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})`, opacity: style.page.heroImageOpacity }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(2,6,23,${Math.max(0, style.page.overlayOpacity - 0.06)}), rgba(2,6,23,${style.page.overlayOpacity}), rgba(2,6,23,${Math.min(1, style.page.overlayOpacity + 0.1)}))`,
        }}
        aria-hidden
      />

      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={{
          paddingLeft: style.page.paddingX,
          paddingRight: style.page.paddingX,
          paddingTop: style.page.paddingY,
          paddingBottom: style.page.paddingY,
        }}
      >
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
              style={{
                height: style.logos.oaHeight,
                width: "auto",
                maxWidth: style.logos.oaMaxWidth,
                maxHeight: style.logos.oaHeight,
              }}
            />
            <p
              className="mt-2 min-w-0 whitespace-nowrap"
              style={{
                fontSize: style.typography.headerFontSize,
                lineHeight: 1.3,
                color: style.typography.headerColor,
                opacity: style.typography.headerOpacity,
              }}
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
                style={{
                  height: style.logos.unit311Height,
                  width: "auto",
                  maxWidth: style.logos.unit311MaxWidth,
                  maxHeight: style.logos.unit311Height,
                }}
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

        <div
          className="oa-overview-layout mt-5 grid min-h-0 flex-1 grid-cols-1 lg:items-stretch"
          style={
            {
              gap: style.page.columnGap,
              ["--oa-layout-cols" as string]: layoutCols,
            } as CSSProperties
          }
        >
          <style>{`
            @media (min-width: 1024px) {
              .oa-overview-layout {
                grid-template-columns: var(--oa-layout-cols);
              }
            }
          `}</style>
            <aside
              className="grid h-full min-h-0 overflow-hidden"
              style={{
                gap: style.page.cardGap,
                gridTemplateRows: leftGridRows,
              }}
            >
              {visibleLeftCards.map((id) => renderLeftCard(id))}
            </aside>

            <section
              className="flex min-w-0 overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.35)] lg:min-h-0"
              style={{
                borderRadius: style.preview.radius,
                minHeight: style.preview.minHeight,
                background: style.preview.bg,
                border: overviewCardBorder({
                  borderColor: style.preview.borderColor,
                  borderOpacity: style.preview.borderOpacity,
                }),
              }}
            >
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
                  onError={(event) => {
                    const img = event.currentTarget;
                    if (img.dataset.fallbackApplied === "1") return;
                    img.dataset.fallbackApplied = "1";
                    img.src = "/images/overview/screenshots/generic.png?v=live9";
                  }}
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

      <OverviewStyleTuner
        style={style}
        onStyleChange={setStyle}
        content={content}
        onContentChange={setContent}
      />
    </div>
  );
}
