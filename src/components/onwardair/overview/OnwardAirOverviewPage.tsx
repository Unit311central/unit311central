"use client";

import { GripHorizontal, Maximize2, X } from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { OverviewStyleTuner } from "@/components/onwardair/overview/OverviewStyleTuner";
import {
  type OnwardAirOverviewEditableContent,
  defaultOnwardAirOverviewContent,
  overviewPreviewMediaForView,
} from "@/lib/onwardair/overview-demo";
import {
  OVERVIEW_FONT_OPTIONS,
  type OverviewFontId,
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

const INLINE_EDIT =
  "oa-inline-edit w-full min-w-0 rounded border border-dashed border-transparent bg-transparent px-0.5 py-0 outline-none hover:border-[#7DD3E8]/50 hover:bg-black/5 focus:border-[#7DD3E8] focus:bg-black/5";

function InlineEdit({
  value,
  onChange,
  multiline = false,
  rows = 1,
  fill = true,
  className = "",
  style,
  "aria-label": ariaLabel,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  /** When false, field sizes to content instead of stretching. */
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  // Color/size on the control itself — page uses text-white and form controls
  // do not reliably inherit color from a wrapper.
  const controlStyle: CSSProperties = {
    resize: "none",
    minHeight: multiline ? undefined : "1.25em",
    height: multiline ? undefined : "1.25em",
    ...style,
  };

  return (
    <div
      className={`min-w-0 shrink-0 ${fill ? (multiline ? "w-full" : "flex-1") : "w-auto max-w-full"}`}
    >
      {multiline ? (
        <textarea
          aria-label={ariaLabel}
          value={value}
          rows={rows}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={`${INLINE_EDIT} block leading-snug ${className}`}
          style={controlStyle}
        />
      ) : (
        <input
          aria-label={ariaLabel}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          className={`${INLINE_EDIT} block ${className}`}
          style={controlStyle}
        />
      )}
    </div>
  );
}

function HeaderTaglineEditor({
  value,
  onChange,
  typography,
  onTypographyChange,
}: {
  value: string;
  onChange: (value: string) => void;
  typography: OverviewStyleConfig["typography"];
  onTypographyChange: (partial: Partial<OverviewStyleConfig["typography"]>) => void;
}) {
  const [showStyle, setShowStyle] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [stylePos, setStylePos] = useState<{ left: number; top: number } | null>(null);
  const stylePanelRef = useRef<HTMLDivElement | null>(null);
  const taglineDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const styleDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const typeStyle: CSSProperties = {
    fontSize: `${typography.headerFontSize}px`,
    fontWeight: typography.headerFontWeight,
    letterSpacing: `${typography.headerLetterSpacing}px`,
    color: typography.headerColor,
    opacity: typography.headerOpacity,
    lineHeight: 1.25,
    fontFamily: overviewFontStack(typography.fontFamily),
  };

  function onTaglineDragStart(event: ReactPointerEvent<HTMLElement>) {
    event.preventDefault();
    taglineDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: typography.taglineOffsetX,
      origY: typography.taglineOffsetY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onTaglineDragMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = taglineDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onTypographyChange({
      taglineOffsetX: Math.round(drag.origX + (event.clientX - drag.startX)),
      taglineOffsetY: Math.round(drag.origY + (event.clientY - drag.startY)),
    });
  }

  function onTaglineDragEnd(event: ReactPointerEvent<HTMLElement>) {
    if (taglineDragRef.current?.pointerId === event.pointerId) {
      taglineDragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
  }

  function onStyleDragStart(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button, input, select, textarea, label")) return;
    const el = stylePanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = stylePos?.left ?? rect.left;
    const top = stylePos?.top ?? rect.top;
    styleDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: left,
      origTop: top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onStyleDragMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = styleDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = stylePanelRef.current?.offsetWidth ?? 420;
    setStylePos({
      left: Math.max(8, Math.min(window.innerWidth - width - 8, drag.origLeft + (event.clientX - drag.startX))),
      top: Math.max(8, Math.min(window.innerHeight - 80, drag.origTop + (event.clientY - drag.startY))),
    });
  }

  function onStyleDragEnd(event: ReactPointerEvent<HTMLElement>) {
    if (styleDragRef.current?.pointerId === event.pointerId) {
      styleDragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
  }

  const stylePanelStyle: CSSProperties = stylePos
    ? { left: stylePos.left, top: stylePos.top }
    : { left: 24, top: 72 };

  const stylePanel =
    showStyle && mounted
      ? createPortal(
          <div
            ref={stylePanelRef}
            className="pointer-events-auto fixed z-[2147483000] flex max-w-[min(100vw-1.5rem,560px)] flex-wrap items-center gap-2 rounded-xl border-2 border-[#7DD3E8] bg-[#0B1220] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
            style={stylePanelStyle}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div
              className="flex cursor-grab items-center gap-1.5 px-1 active:cursor-grabbing"
              onPointerDown={onStyleDragStart}
              onPointerMove={onStyleDragMove}
              onPointerUp={onStyleDragEnd}
              onPointerCancel={onStyleDragEnd}
              title="Drag style box"
            >
              <GripHorizontal className="h-4 w-4 text-[#7DD3E8]" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7DD3E8]">
                Tagline style
              </span>
            </div>
            <label className="flex items-center gap-1 text-[10px] text-white/70">
              Place
              <select
                value={typography.taglinePlacement}
                onChange={(event) =>
                  onTypographyChange({
                    taglinePlacement: event.target.value as "beside" | "below",
                    taglineOffsetX: 0,
                    taglineOffsetY: 0,
                  })
                }
                className="rounded border border-white/20 bg-black/50 px-1.5 py-1 text-[11px] text-white"
              >
                <option value="below">Below logo</option>
                <option value="beside">Beside logo</option>
              </select>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-white/70">
              Font
              <select
                value={typography.fontFamily}
                onChange={(event) =>
                  onTypographyChange({ fontFamily: event.target.value as OverviewFontId })
                }
                className="rounded border border-white/20 bg-black/50 px-1.5 py-1 text-[11px] text-white"
              >
                {OVERVIEW_FONT_OPTIONS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-white/70">
              Size
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() =>
                  onTypographyChange({
                    headerFontSize: Math.max(8, typography.headerFontSize - 1),
                  })
                }
              >
                −
              </button>
              <span className="min-w-[2rem] text-center tabular-nums text-white">
                {typography.headerFontSize}px
              </span>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() =>
                  onTypographyChange({
                    headerFontSize: Math.min(28, typography.headerFontSize + 1),
                  })
                }
              >
                +
              </button>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-white/70">
              Weight
              <select
                value={typography.headerFontWeight}
                onChange={(event) =>
                  onTypographyChange({ headerFontWeight: Number(event.target.value) })
                }
                className="rounded border border-white/20 bg-black/50 px-1.5 py-1 text-[11px] text-white"
              >
                {[300, 400, 500, 600, 700, 800].map((weight) => (
                  <option key={weight} value={weight}>
                    {weight}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-[10px] text-white/70">
              Colour
              <input
                type="color"
                value={
                  typography.headerColor.startsWith("#")
                    ? typography.headerColor.slice(0, 7)
                    : "#ffffff"
                }
                onChange={(event) => onTypographyChange({ headerColor: event.target.value })}
                className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowStyle(false)}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Hide tagline style bar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className="relative min-w-0 w-full"
      style={{
        transform: `translate(${typography.taglineOffsetX}px, ${typography.taglineOffsetY}px)`,
      }}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        <button
          type="button"
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border border-white/15 bg-white/5 text-[#7DD3E8] hover:bg-white/10 active:cursor-grabbing"
          title="Drag to move tagline"
          aria-label="Drag to move tagline"
          onPointerDown={onTaglineDragStart}
          onPointerMove={onTaglineDragMove}
          onPointerUp={onTaglineDragEnd}
          onPointerCancel={onTaglineDragEnd}
        >
          <GripHorizontal className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <InlineEdit
            aria-label="Header tagline"
            value={value}
            onChange={onChange}
            onFocus={() => setShowStyle(true)}
            className="min-w-0 w-full"
            style={typeStyle}
          />
          {!showStyle ? (
            <button
              type="button"
              onClick={() => setShowStyle(true)}
              className="mt-1 text-[10px] font-medium text-[#7DD3E8] underline-offset-2 hover:underline"
            >
              Edit tagline size / font
            </button>
          ) : null}
        </div>
      </div>
      {stylePanel}
    </div>
  );
}

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

  // Always re-apply shipped defaults on load so deploy updates are not stuck behind an old in-session look.
  useEffect(() => {
    setStyle(defaultOverviewStyleConfig());
  }, []);

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

  const previewMedia = useMemo(() => overviewPreviewMediaForView(activeView), [activeView]);
  const layoutCols = `minmax(220px, ${style.page.leftColumnFr}fr) minmax(0, ${style.page.rightColumnFr}fr)`;
  const visibleLeftCards = style.leftColumnOrder.filter((id) => style[id].visible);
  const leftGridRows =
    visibleLeftCards.length > 0
      ? visibleLeftCards.map((id) => `minmax(0, ${style[id].heightFr}fr)`).join(" ")
      : "1fr";

  function patchContent(partial: Partial<OnwardAirOverviewEditableContent>) {
    setContent((prev) => ({ ...prev, ...partial }));
  }

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
        <section
          key={id}
          className="flex min-h-0 flex-col overflow-hidden text-white backdrop-blur-[2px]"
          style={boxStyle}
        >
          <ul
            className="flex min-h-0 flex-1 flex-col justify-start overflow-y-auto py-0.5"
            style={{ gap: style.questions.itemGap }}
          >
            {content.questions.map((q, i) => (
              <li key={`q-${i}`} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex shrink-0 items-center justify-center rounded-full font-bold text-[#0B3A4A]"
                  style={{
                    backgroundColor: style.questions.badgeColor,
                    width: style.questions.badgeSize,
                    height: style.questions.badgeSize,
                    fontSize: Math.round(style.questions.badgeSize * 0.55),
                  }}
                >
                  {i + 1}
                </span>
                <InlineEdit
                  aria-label={`Question ${i + 1}`}
                  value={q}
                  multiline
                  rows={2}
                  onChange={(next) => {
                    const questions = content.questions.map((item, index) =>
                      index === i ? next : item,
                    );
                    patchContent({ questions });
                  }}
                  className="leading-snug"
                  style={{ fontSize: `${style.questions.textSize}px`, color: style.questions.textColor }}
                />
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
          <div className="shrink-0" style={{ marginBottom: style.highlights.titleGap }}>
            <InlineEdit
              aria-label="Highlights title"
              value={content.highlightsTitle}
              onChange={(highlightsTitle) => patchContent({ highlightsTitle })}
              fill={false}
              className="font-bold uppercase tracking-[0.14em]"
              style={{ fontSize: `${style.highlights.titleSize}px`, color: style.highlights.titleColor }}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="m-0 flex list-none flex-col p-0" style={{ gap: style.highlights.itemGap }}>
              {content.highlights.map((item, i) => (
                <li key={`h-${i}`} className="flex shrink-0 items-start gap-1 leading-snug">
                  <span className="shrink-0" style={{ color: style.highlights.bulletColor }}>
                    •
                  </span>
                  <InlineEdit
                    aria-label={`Highlight ${i + 1}`}
                    value={item}
                    onChange={(next) => {
                      const highlights = content.highlights.map((row, index) =>
                        index === i ? next : row,
                      );
                      patchContent({ highlights });
                    }}
                    style={{ fontSize: `${style.highlights.itemSize}px`, color: style.highlights.itemColor }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      );
    }

    return (
      <section
        key={id}
        className="flex min-h-0 flex-col overflow-hidden text-[#1B2430]"
        style={boxStyle}
      >
        <div className="shrink-0" style={{ marginBottom: style.agenda.titleGap }}>
          <InlineEdit
            aria-label="Agenda title"
            value={content.agendaTitle}
            onChange={(agendaTitle) => patchContent({ agendaTitle })}
            fill={false}
            className="font-semibold tracking-tight"
            style={{ fontSize: `${style.agenda.titleSize}px`, color: style.agenda.titleColor }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col" style={{ gap: style.agenda.rowGap }}>
            {content.agenda.map((row, i) => (
              <div
                key={`a-${i}`}
                className="shrink-0"
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
                <div className="flex items-baseline justify-between gap-2">
                  <InlineEdit
                    aria-label={`Agenda row ${i + 1} time`}
                    value={row.wave}
                    fill={false}
                    onChange={(wave) => {
                      const agenda = content.agenda.map((item, index) =>
                        index === i ? { ...item, wave } : item,
                      );
                      patchContent({ agenda });
                    }}
                    className="font-bold uppercase tracking-wider"
                    style={{ fontSize: `${style.agenda.waveSize}px`, color: style.agenda.waveColor }}
                  />
                  <InlineEdit
                    aria-label={`Agenda row ${i + 1} who`}
                    value={row.who}
                    fill={false}
                    onChange={(who) => {
                      const agenda = content.agenda.map((item, index) =>
                        index === i ? { ...item, who } : item,
                      );
                      patchContent({ agenda });
                    }}
                    className="text-right font-semibold"
                    style={{ fontSize: `${style.agenda.whoSize}px`, color: style.agenda.whoColor }}
                  />
                </div>
                <InlineEdit
                  aria-label={`Agenda row ${i + 1} why`}
                  value={row.why}
                  onChange={(why) => {
                    const agenda = content.agenda.map((item, index) =>
                      index === i ? { ...item, why } : item,
                    );
                    patchContent({ agenda });
                  }}
                  className="mt-0.5 leading-snug"
                  style={{ fontSize: `${style.agenda.whySize}px`, color: style.agenda.whyColor }}
                />
              </div>
            ))}
          </div>
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
        <header className="flex shrink-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${OA_LOGO}?v=swap7`}
                alt="OnwardAir"
                width={200}
                height={40}
                decoding="async"
                className="block shrink-0 object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
                style={{
                  height: style.logos.oaHeight,
                  width: "auto",
                  maxWidth: style.logos.oaMaxWidth,
                  maxHeight: style.logos.oaHeight,
                }}
              />
              {style.typography.taglinePlacement === "beside" ? (
                <HeaderTaglineEditor
                  value={content.headline}
                  onChange={(headline) => patchContent({ headline })}
                  typography={style.typography}
                  onTypographyChange={(partial) =>
                    setStyle((prev) => ({
                      ...prev,
                      typography: { ...prev.typography, ...partial },
                    }))
                  }
                />
              ) : null}
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
          </div>
          {style.typography.taglinePlacement === "below" ? (
            <HeaderTaglineEditor
              value={content.headline}
              onChange={(headline) => patchContent({ headline })}
              typography={style.typography}
              onTypographyChange={(partial) =>
                setStyle((prev) => ({
                  ...prev,
                  typography: { ...prev.typography, ...partial },
                }))
              }
            />
          ) : null}
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
                {previewMedia.kind === "video" ? (
                  <video
                    key={previewMedia.src}
                    src={previewMedia.src}
                    className="absolute inset-0 h-full w-full object-contain object-top"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={`${previewTitle} demo video`}
                  />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={previewMedia.src}
                      src={previewMedia.src}
                      alt={`${previewTitle} screenshot`}
                      className="absolute inset-0 h-full w-full object-contain object-top"
                      decoding="async"
                      onError={(event) => {
                        const img = event.currentTarget;
                        if (img.dataset.fallbackApplied === "1") return;
                        img.dataset.fallbackApplied = "1";
                        img.src = "/images/overview/screenshots/generic.png?v=live15";
                      }}
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFullscreen(true)}
                  className="absolute bottom-2.5 right-2.5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/55 text-white shadow-md transition hover:bg-[#267B90]"
                  aria-label={
                    previewMedia.kind === "video"
                      ? "View video full screen"
                      : "View screenshot full screen"
                  }
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
              {previewMedia.kind === "video" ? (
                <video
                  src={previewMedia.src}
                  className="h-full w-full object-contain object-center"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  aria-label={`${previewTitle} full screen video`}
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewMedia.src}
                    alt={`${previewTitle} full screen`}
                    className="h-full w-full object-contain object-center"
                  />
                </>
              )}
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
