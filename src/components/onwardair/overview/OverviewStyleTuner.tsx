"use client";

import { ArrowDown, ArrowUp, Check, Copy, Eye, EyeOff, GripHorizontal, Plus, RotateCcw, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

import { copyTextToClipboard } from "@/lib/clipboard";
import {
  type OnwardAirOverviewEditableContent,
  type OverviewInviteRow,
  defaultOnwardAirOverviewContent,
} from "@/lib/onwardair/overview-demo";
import {
  OVERVIEW_FONT_OPTIONS,
  OVERVIEW_LEFT_CARD_LABELS,
  type OverviewFontId,
  type OverviewStyleConfig,
  defaultOverviewStyleConfig,
  moveLeftColumnCard,
  overviewTunerExportToClipboardJson,
} from "@/lib/onwardair/overview-style";

type Props = {
  style: OverviewStyleConfig;
  onStyleChange: (
    next: OverviewStyleConfig | ((prev: OverviewStyleConfig) => OverviewStyleConfig),
  ) => void;
  content: OnwardAirOverviewEditableContent;
  onContentChange: (next: OnwardAirOverviewEditableContent) => void;
};

type SectionId =
  | "text"
  | "layout"
  | "page"
  | "type"
  | "logos"
  | "cards"
  | "questions"
  | "highlights"
  | "agenda"
  | "preview";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "layout", label: "Layout" },
  { id: "page", label: "Page" },
  { id: "type", label: "Type" },
  { id: "logos", label: "Logos" },
  { id: "cards", label: "Cards" },
  { id: "questions", label: "Questions" },
  { id: "highlights", label: "Highlights" },
  { id: "agenda", label: "Agenda" },
  { id: "preview", label: "Preview" },
];

const fieldClass =
  "w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-[12px] text-white placeholder:text-white/30 focus:border-[#7DD3E8] focus:outline-none";

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const display =
    unit === "op" || unit === "fr"
      ? value.toFixed(2)
      : unit === ""
        ? String(value)
        : `${Number.isInteger(step) || step >= 1 ? Math.round(value) : value.toFixed(2)}${unit}`;

  function nudge(dir: -1 | 1) {
    const next = Math.min(max, Math.max(min, Number((value + dir * step).toFixed(4))));
    onChange(next);
  }

  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-white/75">
        <span>{label}</span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => nudge(-1)}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label={`Decrease ${label}`}
          >
            −
          </button>
          <span className="min-w-[3.25rem] text-center tabular-nums text-white/80">{display}</span>
          <button
            type="button"
            onClick={() => nudge(1)}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label={`Increase ${label}`}
          >
            +
          </button>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={(e) => e.stopPropagation()}
        className="oa-style-slider w-full cursor-pointer"
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hexForPicker = value.startsWith("#") && value.length >= 7 ? value.slice(0, 7) : "#267B90";
  return (
    <label className="flex items-center justify-between gap-3 text-[11px] text-white/75">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={hexForPicker}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-[7.5rem] rounded border border-white/15 bg-black/40 px-1.5 py-1 font-mono text-[10px] text-white/85"
        />
      </span>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-[11px] text-white/75">
      <span className="mb-1 block">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={`${fieldClass} pointer-events-auto resize-y`}
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[11px] text-white/75">
      <span className="mb-1 block">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={`${fieldClass} pointer-events-auto`}
      />
    </label>
  );
}

export function OverviewStyleTuner({ style, onStyleChange, content, onContentChange }: Props) {
  const [open, setOpen] = useState(true);
  const [section, setSection] = useState<SectionId>("text");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const patch = useMemo(
    () => ({
      page: (partial: Partial<OverviewStyleConfig["page"]>) =>
        onStyleChange((prev) => ({ ...prev, page: { ...prev.page, ...partial } })),
      typography: (partial: Partial<OverviewStyleConfig["typography"]>) =>
        onStyleChange((prev) => ({
          ...prev,
          typography: { ...prev.typography, ...partial },
        })),
      logos: (partial: Partial<OverviewStyleConfig["logos"]>) =>
        onStyleChange((prev) => ({ ...prev, logos: { ...prev.logos, ...partial } })),
      cards: (partial: Partial<OverviewStyleConfig["cards"]>) =>
        onStyleChange((prev) => ({ ...prev, cards: { ...prev.cards, ...partial } })),
      questions: (partial: Partial<OverviewStyleConfig["questions"]>) =>
        onStyleChange((prev) => ({
          ...prev,
          questions: { ...prev.questions, ...partial },
        })),
      highlights: (partial: Partial<OverviewStyleConfig["highlights"]>) =>
        onStyleChange((prev) => ({
          ...prev,
          highlights: { ...prev.highlights, ...partial },
        })),
      agenda: (partial: Partial<OverviewStyleConfig["agenda"]>) =>
        onStyleChange((prev) => ({ ...prev, agenda: { ...prev.agenda, ...partial } })),
      preview: (partial: Partial<OverviewStyleConfig["preview"]>) =>
        onStyleChange((prev) => ({ ...prev, preview: { ...prev.preview, ...partial } })),
    }),
    [onStyleChange],
  );

  function updateQuestion(index: number, value: string) {
    const questions = content.questions.map((q, i) => (i === index ? value : q));
    onContentChange({ ...content, questions });
  }

  function addQuestion() {
    onContentChange({ ...content, questions: [...content.questions, "New question"] });
  }

  function removeQuestion(index: number) {
    if (content.questions.length <= 1) return;
    onContentChange({
      ...content,
      questions: content.questions.filter((_, i) => i !== index),
    });
  }

  function updateHighlight(index: number, value: string) {
    const highlights = content.highlights.map((h, i) => (i === index ? value : h));
    onContentChange({ ...content, highlights });
  }

  function addHighlight() {
    onContentChange({ ...content, highlights: [...content.highlights, "New highlight"] });
  }

  function removeHighlight(index: number) {
    if (content.highlights.length <= 1) return;
    onContentChange({
      ...content,
      highlights: content.highlights.filter((_, i) => i !== index),
    });
  }

  function updateAgendaRow(index: number, partial: Partial<OverviewInviteRow>) {
    const agenda = content.agenda.map((row, i) => (i === index ? { ...row, ...partial } : row));
    onContentChange({ ...content, agenda });
  }

  function addAgendaRow() {
    onContentChange({
      ...content,
      agenda: [...content.agenda, { wave: "10", who: "Who", why: "Why this matters" }],
    });
  }

  function removeAgendaRow(index: number) {
    if (content.agenda.length <= 1) return;
    onContentChange({
      ...content,
      agenda: content.agenda.filter((_, i) => i !== index),
    });
  }

  async function handleCopy() {
    const ok = await copyTextToClipboard(overviewTunerExportToClipboardJson(style, content));
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function onDragStart(e: ReactPointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("button, input, textarea, select, a")) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = pos?.left ?? rect.left;
    const top = pos?.top ?? rect.top;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: left,
      origTop: top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onDragMove(e: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const width = panelRef.current?.offsetWidth ?? 380;
    const nextLeft = Math.max(8, Math.min(window.innerWidth - width - 8, drag.origLeft + (e.clientX - drag.startX)));
    const nextTop = Math.max(8, Math.min(window.innerHeight - 80, drag.origTop + (e.clientY - drag.startY)));
    setPos({ left: nextLeft, top: nextTop });
  }

  function onDragEnd(e: ReactPointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }

  if (!mounted) return null;

  const panelStyle: CSSProperties = pos
    ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto" }
    : { right: 16, bottom: 16 };

  const ui = !open ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="pointer-events-auto fixed bottom-5 right-5 z-[2147483000] inline-flex items-center gap-2 rounded-xl border-2 border-[#7DD3E8] bg-[#0B1220] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:bg-[#267B90]"
      aria-label="Open style tuner"
    >
      <SlidersHorizontal className="h-4 w-4" />
      Tune styles
    </button>
  ) : (
    <div
      ref={panelRef}
      className="pointer-events-auto fixed z-[2147483000] flex max-h-[min(92dvh,720px)] w-[min(100vw-1.5rem,400px)] flex-col overflow-hidden rounded-2xl border-2 border-[#7DD3E8] bg-[#0B1220] text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
      style={panelStyle}
      role="dialog"
      aria-label="Overview style tuner"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        .oa-style-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          background: transparent;
        }
        .oa-style-slider:focus { outline: none; }
        .oa-style-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
        }
        .oa-style-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          margin-top: -6px;
          border-radius: 999px;
          border: 2px solid #7dd3e8;
          background: #267b90;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
        }
        .oa-style-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.18);
        }
        .oa-style-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 2px solid #7dd3e8;
          background: #267b90;
          cursor: pointer;
        }
      `}</style>

      <header
        className="flex shrink-0 cursor-grab items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 active:cursor-grabbing"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="flex min-w-0 items-center gap-2">
          <GripHorizontal className="h-4 w-4 shrink-0 text-[#7DD3E8]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-tight">Quick style edit</p>
            <p className="text-[10px] text-white/45">
              Click page text to edit · drag panel · copy JSON
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onStyleChange(defaultOverviewStyleConfig());
              onContentChange(defaultOnwardAirOverviewContent());
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            title="Reset style + text to defaults"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close style tuner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-2 py-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${
              section === s.id ? "bg-[#267B90] text-white" : "bg-white/5 text-white/55 hover:bg-white/10"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {section === "text" ? (
          <>
            <TextInput
              label="Header tagline (single line beside logo)"
              value={content.headline}
              onChange={(headline) => onContentChange({ ...content, headline })}
            />
            <TextInput
              label="Highlights title"
              value={content.highlightsTitle}
              onChange={(highlightsTitle) => onContentChange({ ...content, highlightsTitle })}
            />
            <TextInput
              label="Agenda title"
              value={content.agendaTitle}
              onChange={(agendaTitle) => onContentChange({ ...content, agendaTitle })}
            />
            <p className="text-[10px] text-white/40">
              Click the tagline beside the logo to edit it on-page. Use Type tab for size/font.
            </p>
          </>
        ) : null}

        {section === "layout" ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7DD3E8]">
              Left column order
            </p>
            <p className="text-[10px] text-white/45">
              Move Questions / Highlights / Agenda up or down. Toggle visibility and relative height.
            </p>
            <div className="space-y-2">
              {style.leftColumnOrder.map((id, index) => {
                const card = style[id];
                const short =
                  id === "questions" ? "Questions" : id === "highlights" ? "Highlights" : "Agenda";
                return (
                  <div
                    key={id}
                    className="rounded-lg border border-white/15 bg-white/[0.04] p-2.5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-white">
                          {index + 1}. {short}
                        </p>
                        <p className="text-[9px] text-white/40">{OVERVIEW_LEFT_CARD_LABELS[id]}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            onStyleChange({
                              ...style,
                              leftColumnOrder: moveLeftColumnCard(style.leftColumnOrder, id, -1),
                            })
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/15 bg-white/10 text-white disabled:opacity-30"
                          aria-label={`Move ${short} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === style.leftColumnOrder.length - 1}
                          onClick={() =>
                            onStyleChange({
                              ...style,
                              leftColumnOrder: moveLeftColumnCard(style.leftColumnOrder, id, 1),
                            })
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/15 bg-white/10 text-white disabled:opacity-30"
                          aria-label={`Move ${short} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onStyleChange({
                              ...style,
                              [id]: { ...card, visible: !card.visible },
                            })
                          }
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/15 bg-white/10 text-white"
                          aria-label={card.visible ? `Hide ${short}` : `Show ${short}`}
                          title={card.visible ? "Hide box" : "Show box"}
                        >
                          {card.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    <SliderRow
                      label="Relative height"
                      value={card.heightFr}
                      min={0.4}
                      max={2.5}
                      step={0.05}
                      unit="fr"
                      onChange={(heightFr) =>
                        onStyleChange({ ...style, [id]: { ...card, heightFr } })
                      }
                    />
                    <ColorRow
                      label="Box background"
                      value={card.bg}
                      onChange={(bg) => onStyleChange({ ...style, [id]: { ...card, bg } })}
                    />
                    <ColorRow
                      label="Border colour"
                      value={card.borderColor}
                      onChange={(borderColor) =>
                        onStyleChange({ ...style, [id]: { ...card, borderColor } })
                      }
                    />
                    <SliderRow
                      label="Border opacity"
                      value={card.borderOpacity}
                      min={0}
                      max={1}
                      step={0.01}
                      unit="op"
                      onChange={(borderOpacity) =>
                        onStyleChange({ ...style, [id]: { ...card, borderOpacity } })
                      }
                    />
                    <SliderRow
                      label="Padding"
                      value={card.padding}
                      min={4}
                      max={36}
                      onChange={(padding) =>
                        onStyleChange({ ...style, [id]: { ...card, padding } })
                      }
                    />
                    <SliderRow
                      label="Corner radius"
                      value={card.radius}
                      min={0}
                      max={28}
                      onChange={(radius) =>
                        onStyleChange({ ...style, [id]: { ...card, radius } })
                      }
                    />
                    <SliderRow
                      label="Shadow"
                      value={card.shadowOpacity}
                      min={0}
                      max={0.6}
                      step={0.01}
                      unit="op"
                      onChange={(shadowOpacity) =>
                        onStyleChange({ ...style, [id]: { ...card, shadowOpacity } })
                      }
                    />
                  </div>
                );
              })}
            </div>
            <ColorRow
              label="Global accent"
              value={style.accent}
              onChange={(accent) => onStyleChange({ ...style, accent })}
            />
          </>
        ) : null}

        {section === "page" ? (
          <>
            <SliderRow label="Page padding X" value={style.page.paddingX} min={0} max={48} onChange={(paddingX) => patch.page({ paddingX })} />
            <SliderRow label="Page padding Y" value={style.page.paddingY} min={0} max={48} onChange={(paddingY) => patch.page({ paddingY })} />
            <SliderRow label="Column gap" value={style.page.columnGap} min={0} max={40} onChange={(columnGap) => patch.page({ columnGap })} />
            <SliderRow label="Left column width" value={style.page.leftColumnFr} min={0.4} max={1.4} step={0.05} unit="fr" onChange={(leftColumnFr) => patch.page({ leftColumnFr })} />
            <SliderRow label="Right column width" value={style.page.rightColumnFr} min={1} max={3.5} step={0.05} unit="fr" onChange={(rightColumnFr) => patch.page({ rightColumnFr })} />
            <SliderRow label="Card stack gap" value={style.page.cardGap} min={0} max={40} onChange={(cardGap) => patch.page({ cardGap })} />
            <SliderRow label="Hero image opacity" value={style.page.heroImageOpacity} min={0} max={1} step={0.01} unit="op" onChange={(heroImageOpacity) => patch.page({ heroImageOpacity })} />
            <SliderRow label="Dark overlay opacity" value={style.page.overlayOpacity} min={0} max={1} step={0.01} unit="op" onChange={(overlayOpacity) => patch.page({ overlayOpacity })} />
            <ColorRow label="Accent" value={style.accent} onChange={(accent) => onStyleChange({ ...style, accent })} />
          </>
        ) : null}

        {section === "type" ? (
          <>
            <TextArea
              label="Header tagline"
              value={content.headline}
              onChange={(headline) => onContentChange({ ...content, headline })}
              rows={3}
            />
            <label className="block text-[11px] text-white/75">
              <span className="mb-1 block">Tagline placement</span>
              <select
                value={style.typography.taglinePlacement}
                onChange={(e) =>
                  patch.typography({
                    taglinePlacement: e.target.value as "beside" | "below",
                    taglineOffsetX: 0,
                    taglineOffsetY: 0,
                  })
                }
                className={fieldClass}
              >
                <option value="below">Below logo (full width)</option>
                <option value="beside">Beside logo</option>
              </select>
            </label>
            <label className="block text-[11px] text-white/75">
              <span className="mb-1 block">Font family</span>
              <select
                value={style.typography.fontFamily}
                onChange={(e) => patch.typography({ fontFamily: e.target.value as OverviewFontId })}
                className={fieldClass}
              >
                {OVERVIEW_FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <SliderRow
              label="Header font size"
              value={style.typography.headerFontSize}
              min={8}
              max={28}
              onChange={(headerFontSize) => patch.typography({ headerFontSize })}
            />
            <SliderRow
              label="Header font weight"
              value={style.typography.headerFontWeight}
              min={300}
              max={800}
              step={100}
              unit=""
              onChange={(headerFontWeight) => patch.typography({ headerFontWeight })}
            />
            <SliderRow
              label="Letter spacing"
              value={style.typography.headerLetterSpacing}
              min={-0.5}
              max={2}
              step={0.05}
              unit="px"
              onChange={(headerLetterSpacing) => patch.typography({ headerLetterSpacing })}
            />
            <ColorRow
              label="Header colour"
              value={style.typography.headerColor}
              onChange={(headerColor) => patch.typography({ headerColor })}
            />
            <SliderRow
              label="Header opacity"
              value={style.typography.headerOpacity}
              min={0}
              max={1}
              step={0.01}
              unit="op"
              onChange={(headerOpacity) => patch.typography({ headerOpacity })}
            />
          </>
        ) : null}

        {section === "logos" ? (
          <>
            <SliderRow label="OnwardAir logo height" value={style.logos.oaHeight} min={18} max={64} onChange={(oaHeight) => patch.logos({ oaHeight })} />
            <SliderRow label="OnwardAir max width" value={style.logos.oaMaxWidth} min={80} max={280} onChange={(oaMaxWidth) => patch.logos({ oaMaxWidth })} />
            <SliderRow label="Unit311 logo height" value={style.logos.unit311Height} min={12} max={40} onChange={(unit311Height) => patch.logos({ unit311Height })} />
            <SliderRow label="Unit311 max width" value={style.logos.unit311MaxWidth} min={48} max={180} onChange={(unit311MaxWidth) => patch.logos({ unit311MaxWidth })} />
          </>
        ) : null}

        {section === "cards" ? (
          <>
            <p className="text-[10px] text-white/45">
              Shared defaults. Prefer the Layout tab or each box tab for per-box padding / radius / colours.
            </p>
            <SliderRow
              label="Shared padding (legacy)"
              value={style.cards.padding}
              min={4}
              max={32}
              onChange={(padding) => {
                onStyleChange({
                  ...style,
                  cards: { ...style.cards, padding },
                  questions: { ...style.questions, padding },
                  highlights: { ...style.highlights, padding },
                  agenda: { ...style.agenda, padding },
                });
              }}
            />
            <SliderRow
              label="Shared radius (legacy)"
              value={style.cards.radius}
              min={0}
              max={28}
              onChange={(radius) => {
                onStyleChange({
                  ...style,
                  cards: { ...style.cards, radius },
                  questions: { ...style.questions, radius },
                  highlights: { ...style.highlights, radius },
                  agenda: { ...style.agenda, radius },
                });
              }}
            />
            <SliderRow
              label="Shared border opacity"
              value={style.cards.borderOpacity}
              min={0}
              max={1}
              step={0.01}
              unit="op"
              onChange={(borderOpacity) => {
                onStyleChange({
                  ...style,
                  cards: { ...style.cards, borderOpacity },
                  questions: { ...style.questions, borderOpacity },
                  highlights: { ...style.highlights, borderOpacity },
                  agenda: { ...style.agenda, borderOpacity },
                });
              }}
            />
          </>
        ) : null}

        {section === "questions" ? (
          <>
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7DD3E8]">Edit questions</p>
              {content.questions.map((q, i) => (
                <div key={`q-edit-${i}`} className="flex items-start gap-1.5">
                  <span className="mt-2 w-4 shrink-0 text-center text-[10px] text-white/40">{i + 1}</span>
                  <textarea
                    value={q}
                    rows={2}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`${fieldClass} resize-y`}
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/40 hover:bg-white/10 hover:text-red-300"
                    aria-label={`Remove question ${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
              >
                <Plus className="h-3.5 w-3.5" /> Add question
              </button>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Box + type</p>
            <ColorRow label="Background" value={style.questions.bg} onChange={(bg) => patch.questions({ bg })} />
            <ColorRow label="Border colour" value={style.questions.borderColor} onChange={(borderColor) => patch.questions({ borderColor })} />
            <SliderRow label="Border opacity" value={style.questions.borderOpacity} min={0} max={1} step={0.01} unit="op" onChange={(borderOpacity) => patch.questions({ borderOpacity })} />
            <ColorRow label="Text colour" value={style.questions.textColor} onChange={(textColor) => patch.questions({ textColor })} />
            <SliderRow label="Text size" value={style.questions.textSize} min={10} max={22} onChange={(textSize) => patch.questions({ textSize })} />
            <ColorRow label="Badge colour" value={style.questions.badgeColor} onChange={(badgeColor) => patch.questions({ badgeColor })} />
            <SliderRow label="Badge size" value={style.questions.badgeSize} min={14} max={32} onChange={(badgeSize) => patch.questions({ badgeSize })} />
            <SliderRow label="Item gap" value={style.questions.itemGap} min={0} max={20} onChange={(itemGap) => patch.questions({ itemGap })} />
            <SliderRow label="Padding" value={style.questions.padding} min={4} max={36} onChange={(padding) => patch.questions({ padding })} />
            <SliderRow label="Radius" value={style.questions.radius} min={0} max={28} onChange={(radius) => patch.questions({ radius })} />
            <SliderRow label="Shadow" value={style.questions.shadowOpacity} min={0} max={0.6} step={0.01} unit="op" onChange={(shadowOpacity) => patch.questions({ shadowOpacity })} />
          </>
        ) : null}

        {section === "highlights" ? (
          <>
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7DD3E8]">Edit highlights</p>
              <TextInput
                label="Title"
                value={content.highlightsTitle}
                onChange={(highlightsTitle) => onContentChange({ ...content, highlightsTitle })}
              />
              {content.highlights.map((item, i) => (
                <div key={`h-edit-${i}`} className="flex items-start gap-1.5">
                  <textarea
                    value={item}
                    rows={2}
                    onChange={(e) => updateHighlight(i, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`${fieldClass} resize-y`}
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/40 hover:bg-white/10 hover:text-red-300"
                    aria-label={`Remove highlight ${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHighlight}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
              >
                <Plus className="h-3.5 w-3.5" /> Add highlight
              </button>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Spacing</p>
            <SliderRow label="Space under title" value={style.highlights.titleGap} min={0} max={48} onChange={(titleGap) => patch.highlights({ titleGap })} />
            <SliderRow label="Item gap" value={style.highlights.itemGap} min={0} max={24} onChange={(itemGap) => patch.highlights({ itemGap })} />
            <SliderRow label="Card padding" value={style.highlights.padding} min={4} max={36} onChange={(padding) => patch.highlights({ padding })} />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Box + type</p>
            <ColorRow label="Background" value={style.highlights.bg} onChange={(bg) => patch.highlights({ bg })} />
            <ColorRow label="Border colour" value={style.highlights.borderColor} onChange={(borderColor) => patch.highlights({ borderColor })} />
            <SliderRow label="Border opacity" value={style.highlights.borderOpacity} min={0} max={1} step={0.01} unit="op" onChange={(borderOpacity) => patch.highlights({ borderOpacity })} />
            <ColorRow label="Title colour" value={style.highlights.titleColor} onChange={(titleColor) => patch.highlights({ titleColor })} />
            <SliderRow label="Title size" value={style.highlights.titleSize} min={9} max={20} onChange={(titleSize) => patch.highlights({ titleSize })} />
            <ColorRow label="Item colour" value={style.highlights.itemColor} onChange={(itemColor) => patch.highlights({ itemColor })} />
            <ColorRow label="Bullet colour" value={style.highlights.bulletColor} onChange={(bulletColor) => patch.highlights({ bulletColor })} />
            <SliderRow label="Item size" value={style.highlights.itemSize} min={9} max={20} onChange={(itemSize) => patch.highlights({ itemSize })} />
            <SliderRow label="Radius" value={style.highlights.radius} min={0} max={28} onChange={(radius) => patch.highlights({ radius })} />
            <SliderRow label="Shadow" value={style.highlights.shadowOpacity} min={0} max={0.6} step={0.01} unit="op" onChange={(shadowOpacity) => patch.highlights({ shadowOpacity })} />
          </>
        ) : null}

        {section === "agenda" ? (
          <>
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7DD3E8]">Edit agenda</p>
              <TextInput
                label="Title"
                value={content.agendaTitle}
                onChange={(agendaTitle) => onContentChange({ ...content, agendaTitle })}
              />
              {content.agenda.map((row, i) => (
                <div key={`a-edit-${i}`} className="space-y-1.5 rounded-md border border-white/10 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/45">Row {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAgendaRow(i)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-white/40 hover:bg-white/10 hover:text-red-300"
                      aria-label={`Remove agenda row ${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <TextInput label="Time / wave" value={row.wave} onChange={(wave) => updateAgendaRow(i, { wave })} />
                  <TextInput label="Who" value={row.who} onChange={(who) => updateAgendaRow(i, { who })} />
                  <TextArea label="Why" value={row.why} onChange={(why) => updateAgendaRow(i, { why })} rows={2} />
                </div>
              ))}
              <button
                type="button"
                onClick={addAgendaRow}
                className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
              >
                <Plus className="h-3.5 w-3.5" /> Add agenda row
              </button>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Spacing</p>
            <SliderRow label="Space under title" value={style.agenda.titleGap} min={0} max={80} onChange={(titleGap) => patch.agenda({ titleGap })} />
            <SliderRow label="Row gap" value={style.agenda.rowGap} min={0} max={24} onChange={(rowGap) => patch.agenda({ rowGap })} />
            <SliderRow label="Card padding" value={style.agenda.padding} min={4} max={36} onChange={(padding) => patch.agenda({ padding })} />
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Box + type</p>
            <ColorRow label="Card background" value={style.agenda.bg} onChange={(bg) => patch.agenda({ bg })} />
            <ColorRow label="Border colour" value={style.agenda.borderColor} onChange={(borderColor) => patch.agenda({ borderColor })} />
            <SliderRow label="Border opacity" value={style.agenda.borderOpacity} min={0} max={1} step={0.01} unit="op" onChange={(borderOpacity) => patch.agenda({ borderOpacity })} />
            <ColorRow label="Title colour" value={style.agenda.titleColor} onChange={(titleColor) => patch.agenda({ titleColor })} />
            <SliderRow label="Title size" value={style.agenda.titleSize} min={9} max={20} onChange={(titleSize) => patch.agenda({ titleSize })} />
            <ColorRow label="Row background" value={style.agenda.rowBg} onChange={(rowBg) => patch.agenda({ rowBg })} />
            <ColorRow label="Row border colour" value={style.agenda.rowBorderColor} onChange={(rowBorderColor) => patch.agenda({ rowBorderColor })} />
            <SliderRow label="Row border opacity" value={style.agenda.rowBorderOpacity} min={0} max={1} step={0.01} unit="op" onChange={(rowBorderOpacity) => patch.agenda({ rowBorderOpacity })} />
            <SliderRow label="Row padding X" value={style.agenda.rowPaddingX} min={0} max={24} onChange={(rowPaddingX) => patch.agenda({ rowPaddingX })} />
            <SliderRow label="Row padding Y" value={style.agenda.rowPaddingY} min={0} max={20} onChange={(rowPaddingY) => patch.agenda({ rowPaddingY })} />
            <SliderRow label="Row radius" value={style.agenda.rowRadius} min={0} max={20} onChange={(rowRadius) => patch.agenda({ rowRadius })} />
            <ColorRow label="Wave colour" value={style.agenda.waveColor} onChange={(waveColor) => patch.agenda({ waveColor })} />
            <SliderRow label="Wave / time size" value={style.agenda.waveSize} min={8} max={16} onChange={(waveSize) => patch.agenda({ waveSize })} />
            <ColorRow label="Who colour" value={style.agenda.whoColor} onChange={(whoColor) => patch.agenda({ whoColor })} />
            <SliderRow label="Who size" value={style.agenda.whoSize} min={8} max={18} onChange={(whoSize) => patch.agenda({ whoSize })} />
            <ColorRow label="Why colour" value={style.agenda.whyColor} onChange={(whyColor) => patch.agenda({ whyColor })} />
            <SliderRow label="Why size" value={style.agenda.whySize} min={8} max={16} onChange={(whySize) => patch.agenda({ whySize })} />
            <SliderRow label="Radius" value={style.agenda.radius} min={0} max={28} onChange={(radius) => patch.agenda({ radius })} />
            <SliderRow label="Shadow" value={style.agenda.shadowOpacity} min={0} max={0.6} step={0.01} unit="op" onChange={(shadowOpacity) => patch.agenda({ shadowOpacity })} />
          </>
        ) : null}

        {section === "preview" ? (
          <>
            <ColorRow label="Panel background" value={style.preview.bg} onChange={(bg) => patch.preview({ bg })} />
            <ColorRow label="Border colour" value={style.preview.borderColor} onChange={(borderColor) => patch.preview({ borderColor })} />
            <SliderRow label="Panel radius" value={style.preview.radius} min={0} max={28} onChange={(radius) => patch.preview({ radius })} />
            <SliderRow label="Min height (mobile)" value={style.preview.minHeight} min={240} max={720} step={10} onChange={(minHeight) => patch.preview({ minHeight })} />
            <SliderRow label="Border opacity" value={style.preview.borderOpacity} min={0} max={1} step={0.01} unit="op" onChange={(borderOpacity) => patch.preview({ borderOpacity })} />
          </>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#267B90] px-3 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2f93ab]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied JSON — paste into Cursor" : "Copy style + text JSON"}
        </button>
      </footer>
    </div>
  );

  return createPortal(ui, document.body);
}
