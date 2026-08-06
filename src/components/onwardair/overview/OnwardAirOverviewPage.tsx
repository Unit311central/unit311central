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
  editable = true,
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
  /** When false, render static text (invite presentation mode). */
  editable?: boolean;
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
    ...(multiline
      ? {}
      : editable
        ? { minHeight: "1.25em", height: "1.25em" }
        : { minHeight: 0, height: "auto" }),
    ...style,
  };

  if (!editable) {
    return (
      <div className={`min-w-0 shrink-0 ${fill ? (multiline ? "w-full" : "flex-1") : "w-auto max-w-full"}`}>
        <p
          aria-label={ariaLabel}
          className={`m-0 block w-full min-w-0 leading-snug ${className}`}
          style={controlStyle}
        >
          {value}
        </p>
      </div>
    );
  }

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
  editable = true,
}: {
  value: string;
  onChange: (value: string) => void;
  typography: OverviewStyleConfig["typography"];
  onTypographyChange: (partial: Partial<OverviewStyleConfig["typography"]>) => void;
  editable?: boolean;
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
    fontSize: `calc(${typography.headerFontSize}px * var(--oa-scale, 1))`,
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
      {!editable ? (
        <p className="m-0 min-w-0 w-full leading-snug" style={typeStyle}>
          {value}
        </p>
      ) : (
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
      )}
      {editable ? stylePanel : null}
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
  const [authReady, setAuthReady] = useState(false);
  const [content, setContent] = useState<OnwardAirOverviewEditableContent | null>(null);
  const [style, setStyle] = useState<OverviewStyleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<InternalOperationsView>("home");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  /** Live style popup + inline editors — only with ?tune=1 */
  const [tuneMode, setTuneMode] = useState(false);

  // Never render invite content until the overview session is verified.
  // Server layout auth can be bypassed by client-side router hydration.
  useEffect(() => {
    let cancelled = false;

    async function loadAuthenticatedOverview() {
      try {
        const response = await fetch("/api/onwardair/overview-content", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          const next = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/overview/login?next=${encodeURIComponent(next)}`);
          return;
        }
        if (cancelled) return;
        setStyle(defaultOverviewStyleConfig());
        setContent(defaultOnwardAirOverviewContent());
        try {
          setTuneMode(new URLSearchParams(window.location.search).get("tune") === "1");
        } catch {
          setTuneMode(false);
        }
        setAuthReady(true);
        setLoading(false);
      } catch {
        window.location.replace("/overview/login");
      }
    }

    void loadAuthenticatedOverview();
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

  const previewMedia = useMemo(
    () => (style && content ? overviewPreviewMediaForView(activeView) : null),
    [activeView, style, content],
  );
  const layoutCols = style
    ? `minmax(min(100%, max(160px, 18vw)), ${style.page.leftColumnFr}fr) minmax(0, ${style.page.rightColumnFr}fr)`
    : "";
  const visibleLeftCards = style ? style.leftColumnOrder.filter((id) => style[id].visible) : [];
  const scale = (px: number) => `calc(${px}px * var(--oa-scale, 1))`;
  const leftGridRows =
    style && visibleLeftCards.length > 0
      ? visibleLeftCards.map((id) => `minmax(0, ${style[id].heightFr}fr)`).join(" ")
      : "1fr";

  function patchContent(partial: Partial<OnwardAirOverviewEditableContent>) {
    if (!content) return;
    setContent((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  if (!authReady || !style || !content || !previewMedia) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#020617] px-4 text-sm text-white/55">
        Checking access…
      </div>
    );
  }

  const renderLeftCard = (id: OverviewLeftCardId) => {
    const chrome = style[id];
    const border = overviewCardBorder({
      borderColor: chrome.borderColor,
      borderOpacity: chrome.borderOpacity,
    });
    const shadow = overviewCardShadow(chrome.shadowOpacity);
    const boxStyle: CSSProperties = {
      background: chrome.bg,
      padding: scale(chrome.padding),
      borderRadius: chrome.radius,
      border,
      boxShadow: shadow,
    };

    if (id === "questions") {
      return (
        <section
          key={id}
          className="oa-left-card flex min-h-0 flex-col overflow-hidden text-white backdrop-blur-[2px]"
          style={boxStyle}
        >
          <ul
            className="oa-left-card-body flex min-h-0 flex-1 flex-col justify-evenly overflow-y-auto py-0.5"
            style={{ gap: scale(style.questions.itemGap) }}
          >
            {content.questions.map((q, i) => (
              <li key={`q-${i}`} className="flex shrink-0 items-start gap-2 leading-snug">
                <span
                  className="mt-0.5 flex shrink-0 items-center justify-center rounded-full border font-bold leading-none"
                  style={{
                    width: scale(Math.max(18, style.questions.textSize + 6)),
                    height: scale(Math.max(18, style.questions.textSize + 6)),
                    fontSize: scale(Math.max(10, style.questions.textSize - 3)),
                    color: style.questions.textColor,
                    borderColor: style.questions.textColor,
                    background: "transparent",
                  }}
                  aria-hidden
                >
                  ?
                </span>
                <InlineEdit
                  aria-label={`Question ${i + 1}`}
                  value={q}
                  editable={tuneMode}
                  onChange={(next) => {
                    const questions = content.questions.map((item, index) =>
                      index === i ? next : item,
                    );
                    patchContent({ questions });
                  }}
                  className="leading-snug"
                  style={{
                    fontSize: scale(style.questions.textSize),
                    color: style.questions.textColor,
                    height: "auto",
                    minHeight: "1.35em",
                  }}
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
          className="oa-left-card flex min-h-0 flex-col overflow-hidden text-white backdrop-blur-[2px]"
          style={boxStyle}
        >
          <div className="shrink-0" style={{ marginBottom: scale(style.highlights.titleGap) }}>
            <InlineEdit
              aria-label="Highlights title"
              value={content.highlightsTitle}
              editable={tuneMode}
              onChange={(highlightsTitle) => patchContent({ highlightsTitle })}
              fill={false}
              className="font-bold uppercase tracking-[0.14em]"
              style={{ fontSize: scale(style.highlights.titleSize), color: style.highlights.titleColor }}
            />
          </div>
          <div className="oa-left-card-body min-h-0 flex-1 overflow-y-auto">
            <ul className="m-0 flex list-none flex-col p-0" style={{ gap: scale(style.highlights.itemGap) }}>
              {content.highlights.map((item, i) => (
                <li key={`h-${i}`} className="flex shrink-0 items-start gap-1.5 leading-snug">
                  <span className="mt-0.5 shrink-0" style={{ color: style.highlights.bulletColor }}>
                    •
                  </span>
                  <InlineEdit
                    aria-label={`Highlight ${i + 1}`}
                    value={item}
                    editable={tuneMode}
                    onChange={(next) => {
                      const highlights = content.highlights.map((row, index) =>
                        index === i ? next : row,
                      );
                      patchContent({ highlights });
                    }}
                    className="leading-snug"
                    style={{
                      fontSize: scale(style.highlights.itemSize),
                      color: style.highlights.itemColor,
                      height: "auto",
                      minHeight: 0,
                    }}
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
        className="oa-left-card flex min-h-0 flex-col overflow-hidden text-[#1B2430]"
        style={boxStyle}
      >
        <div
          className="shrink-0"
          style={{
            marginTop: scale(style.agenda.titleTopGap),
            marginBottom: scale(style.agenda.titleGap),
          }}
        >
          {tuneMode ? (
            <InlineEdit
              aria-label="Agenda title"
              value={content.agendaTitle}
              editable
              onChange={(agendaTitle) => patchContent({ agendaTitle })}
              fill
              className="oa-agenda-title !font-bold tracking-tight text-center"
              style={{
                fontSize: scale(style.agenda.titleSize),
                fontWeight: 800,
                color: style.agenda.titleColor,
                height: "auto",
                minHeight: "1.2em",
                lineHeight: 1.2,
                textAlign: "center",
                width: "100%",
              }}
            />
          ) : (
            <p
              className="oa-agenda-title m-0 w-full text-center font-extrabold uppercase tracking-tight"
              style={{
                fontSize: scale(style.agenda.titleSize),
                fontWeight: 800,
                color: style.agenda.titleColor,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              45 MIN WORKING SESSION
            </p>
          )}
        </div>
        <div className="oa-left-card-body flex min-h-0 flex-1 flex-col justify-start overflow-y-auto">
          <div className="flex flex-col" style={{ gap: scale(style.agenda.rowGap) }}>
            {content.agenda.map((row, i) => (
              <div
                key={`a-${i}`}
                className="shrink-0"
                style={{
                  background: style.agenda.rowBg,
                  padding: `${scale(style.agenda.rowPaddingY)} ${scale(style.agenda.rowPaddingX)}`,
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
                    editable={tuneMode}
                    fill={false}
                    onChange={(wave) => {
                      const agenda = content.agenda.map((item, index) =>
                        index === i ? { ...item, wave } : item,
                      );
                      patchContent({ agenda });
                    }}
                    className="font-bold uppercase tracking-wider"
                    style={{ fontSize: scale(style.agenda.waveSize), color: style.agenda.waveColor }}
                  />
                  <InlineEdit
                    aria-label={`Agenda row ${i + 1} who`}
                    value={row.who}
                    editable={tuneMode}
                    fill={false}
                    onChange={(who) => {
                      const agenda = content.agenda.map((item, index) =>
                        index === i ? { ...item, who } : item,
                      );
                      patchContent({ agenda });
                    }}
                    className="text-right font-semibold"
                    style={{ fontSize: scale(style.agenda.whoSize), color: style.agenda.whoColor }}
                  />
                </div>
                <InlineEdit
                  aria-label={`Agenda row ${i + 1} why`}
                  value={row.why}
                  editable={tuneMode}
                  onChange={(why) => {
                    const agenda = content.agenda.map((item, index) =>
                      index === i ? { ...item, why } : item,
                    );
                    patchContent({ agenda });
                  }}
                  className="oa-agenda-why mt-0.5 !font-bold leading-snug"
                  style={{
                    fontSize: scale(style.agenda.whySize),
                    fontWeight: 700,
                    color: style.agenda.whyColor,
                    height: "auto",
                    minHeight: "1.35em",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const handleStyleChange = (
    next: OverviewStyleConfig | ((prev: OverviewStyleConfig) => OverviewStyleConfig),
  ) => {
    setStyle((prev) => {
      const base = prev ?? defaultOverviewStyleConfig();
      return typeof next === "function" ? next(base) : next;
    });
  };

  const handleContentChange = (
    next:
      | OnwardAirOverviewEditableContent
      | ((prev: OnwardAirOverviewEditableContent) => OnwardAirOverviewEditableContent),
  ) => {
    setContent((prev) => {
      const base = prev ?? defaultOnwardAirOverviewContent();
      return typeof next === "function" ? next(base) : next;
    });
  };

  return (
    <div
      className="oa-overview relative flex min-h-[100dvh] flex-col overflow-x-hidden text-white min-[1100px]:h-[100dvh] min-[1100px]:max-h-[100dvh] min-[1100px]:overflow-hidden"
      style={{ fontFamily: overviewFontStack(style.typography.fontFamily) }}
    >
      <style>{`
        .oa-overview {
          --oa-scale: 1;
          --oa-pad-x: ${style.page.paddingX}px;
          --oa-pad-y: ${style.page.paddingY}px;
          --oa-col-gap: ${style.page.columnGap}px;
          --oa-card-gap: ${style.page.cardGap}px;
          --oa-layout-cols: ${layoutCols};
          --oa-preview-min-h: ${style.preview.minHeight}px;
        }
        @media (max-width: 1511px) {
          .oa-overview { --oa-scale: 0.94; }
        }
        @media (max-width: 1365px) {
          .oa-overview {
            --oa-scale: 0.88;
            --oa-pad-x: max(10px, ${Math.round(style.page.paddingX * 0.75)}px);
            --oa-pad-y: max(8px, ${Math.round(style.page.paddingY * 0.75)}px);
            --oa-col-gap: max(10px, ${Math.round(style.page.columnGap * 0.75)}px);
            --oa-card-gap: max(10px, ${Math.round(style.page.cardGap * 0.75)}px);
          }
        }
        @media (max-width: 1279px) {
          .oa-overview {
            --oa-scale: 0.82;
            --oa-preview-min-h: 320px;
          }
        }
        @media (min-width: 1100px) {
          .oa-overview-layout {
            grid-template-columns: var(--oa-layout-cols);
          }
        }
        /* Tablet + phone — stack left cards above preview; no crushed side column */
        @media (max-width: 1099px) {
          .oa-overview {
            height: auto !important;
            max-height: none !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }
          .oa-overview-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto !important;
            gap: 12px !important;
          }
          .oa-overview-left {
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            gap: 10px !important;
            grid-template-rows: none !important;
          }
          .oa-overview-left .oa-left-card {
            flex: 0 0 auto !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .oa-overview-left .oa-left-card-body {
            flex: none !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .oa-overview-preview {
            flex-direction: column !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .oa-overview-nav {
            max-height: min(42vh, 320px) !important;
            width: 100% !important;
          }
          .oa-preview-stage {
            position: relative !important;
            width: 100%;
            min-height: 220px !important;
            aspect-ratio: 4 / 3;
            flex: none !important;
          }
          .oa-overview-header-row {
            flex-wrap: wrap;
            row-gap: 8px;
          }
          .oa-overview-tagline-beside {
            flex: 1 1 100%;
            order: 3;
            max-width: 100% !important;
          }
          .oa-overview-tagline-beside p,
          .oa-overview-tagline-beside input,
          .oa-overview-tagline-beside textarea {
            text-align: left !important;
            font-size: calc(14px * var(--oa-scale, 1)) !important;
            line-height: 1.35 !important;
            height: auto !important;
            min-height: 0 !important;
            white-space: normal !important;
          }
        }
        @media (max-height: 820px) and (min-width: 768px) {
          .oa-overview { --oa-scale: 0.86; --oa-preview-min-h: 280px; }
        }
        @media (max-height: 720px) and (min-width: 768px) {
          .oa-overview {
            height: auto !important;
            max-height: none !important;
            overflow: auto !important;
          }
        }
        /* Phones — tighter padding */
        @media (max-width: 767px) {
          .oa-overview {
            --oa-scale: 0.95;
            --oa-pad-x: max(12px, env(safe-area-inset-left, 0px));
            --oa-pad-y: max(10px, env(safe-area-inset-top, 0px));
            --oa-col-gap: 12px;
            --oa-card-gap: 10px;
            --oa-preview-min-h: 0px;
            min-height: 100dvh;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .oa-overview-nav {
            max-height: min(38vh, 260px) !important;
          }
        }
        @media (max-width: 430px) {
          .oa-overview {
            --oa-scale: 0.92;
            --oa-pad-x: max(10px, env(safe-area-inset-left, 0px));
          }
          .oa-preview-stage {
            aspect-ratio: 3 / 4;
            min-height: 240px !important;
          }
        }
      `}</style>
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
          paddingLeft: "var(--oa-pad-x)",
          paddingRight: "var(--oa-pad-x)",
          paddingTop: "var(--oa-pad-y)",
          paddingBottom: "var(--oa-pad-y)",
        }}
      >
        <header className="flex shrink-0 flex-col gap-2">
          <div className="oa-overview-header-row flex items-center justify-between gap-3">
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
                  height: scale(style.logos.oaHeight),
                  width: "auto",
                  maxWidth: scale(style.logos.oaMaxWidth),
                  maxHeight: scale(style.logos.oaHeight),
                }}
              />
              {style.typography.taglinePlacement === "beside" ? (
                <div className="oa-overview-tagline-beside min-w-0 flex-1">
                  <HeaderTaglineEditor
                    value={content.headline}
                    editable={tuneMode}
                    onChange={(headline) => patchContent({ headline })}
                    typography={style.typography}
                    onTypographyChange={(partial) =>
                      setStyle((prev) =>
                        prev
                          ? { ...prev, typography: { ...prev.typography, ...partial } }
                          : prev,
                      )
                    }
                  />
                </div>
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
                    height: scale(style.logos.unit311Height),
                    width: "auto",
                    maxWidth: scale(style.logos.unit311MaxWidth),
                    maxHeight: scale(style.logos.unit311Height),
                  }}
                />
              </a>
            </div>
          </div>
          {style.typography.taglinePlacement === "below" ? (
            <HeaderTaglineEditor
              value={content.headline}
              editable={tuneMode}
              onChange={(headline) => patchContent({ headline })}
              typography={style.typography}
              onTypographyChange={(partial) =>
                setStyle((prev) =>
                  prev ? { ...prev, typography: { ...prev.typography, ...partial } } : prev,
                )
              }
            />
          ) : null}
        </header>

        <div
          className="oa-overview-layout mt-3 grid min-h-0 flex-1 grid-cols-1 min-[1100px]:mt-5 min-[1100px]:items-stretch"
          style={
            {
              gap: "var(--oa-col-gap)",
              ["--oa-left-count" as string]: String(visibleLeftCards.length || 1),
            } as CSSProperties
          }
        >
            <aside
              className="oa-overview-left grid h-full min-h-0 overflow-hidden md:overflow-hidden"
              style={{
                gap: "var(--oa-card-gap)",
                gridTemplateRows: leftGridRows,
              }}
            >
              {visibleLeftCards.map((id) => renderLeftCard(id))}
            </aside>

            <section
              className="oa-overview-preview flex min-w-0 flex-col overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.35)] md:min-h-0 md:flex-row"
              style={{
                borderRadius: style.preview.radius,
                minHeight: "var(--oa-preview-min-h)",
                background: style.preview.bg,
                border: overviewCardBorder({
                  borderColor: style.preview.borderColor,
                  borderOpacity: style.preview.borderOpacity,
                }),
              }}
            >
              <OperatorEntitlementsProvider>
                <Suspense fallback={<div className="h-[180px] w-full shrink-0 bg-[#07111F] md:h-auto md:w-[240px] lg:w-[280px] xl:w-[300px] 2xl:w-[320px]" />}>
                  <OverviewPlatformNav activeView={activeView} onViewChange={setActiveView} />
                </Suspense>
              </OperatorEntitlementsProvider>

              <div className="oa-preview-stage relative min-h-0 min-w-0 flex-1 bg-[#020617]">
                {previewMedia.kind === "video" ? (
                  <video
                    key={previewMedia.src}
                    src={previewMedia.src}
                    className="absolute inset-0 h-full w-full object-contain object-center"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
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
                        img.src = "/images/overview/screenshots/generic.png?v=live16";
                      }}
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFullscreen(true)}
                  className="absolute bottom-[max(0.625rem,env(safe-area-inset-bottom))] right-2.5 z-10 inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-white/20 bg-black/55 text-white shadow-md transition hover:bg-[#267B90] sm:h-9 sm:w-9"
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

        <footer className="mt-1.5 shrink-0 pb-[max(0px,env(safe-area-inset-bottom))] text-center text-[9px] text-white/35 sm:text-[10px]">
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

      {tuneMode ? (
        <OverviewStyleTuner
          style={style}
          onStyleChange={handleStyleChange}
          content={content}
          onContentChange={handleContentChange}
        />
      ) : null}
    </div>
  );
}
