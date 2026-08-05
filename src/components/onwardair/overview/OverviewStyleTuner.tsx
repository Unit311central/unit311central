"use client";

import { Check, Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { copyTextToClipboard } from "@/lib/clipboard";
import {
  OVERVIEW_FONT_OPTIONS,
  type OverviewFontId,
  type OverviewStyleConfig,
  defaultOverviewStyleConfig,
  overviewStyleConfigToClipboardJson,
} from "@/lib/onwardair/overview-style";

type Props = {
  style: OverviewStyleConfig;
  onChange: (next: OverviewStyleConfig) => void;
};

type SectionId =
  | "page"
  | "type"
  | "logos"
  | "cards"
  | "questions"
  | "highlights"
  | "agenda"
  | "preview";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "page", label: "Page" },
  { id: "type", label: "Type" },
  { id: "logos", label: "Logos" },
  { id: "cards", label: "Cards" },
  { id: "questions", label: "Questions" },
  { id: "highlights", label: "Highlights" },
  { id: "agenda", label: "Agenda" },
  { id: "preview", label: "Preview" },
];

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

export function OverviewStyleTuner({ style, onChange }: Props) {
  const [open, setOpen] = useState(true);
  const [section, setSection] = useState<SectionId>("page");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const patch = useMemo(
    () => ({
      page: (partial: Partial<OverviewStyleConfig["page"]>) =>
        onChange({ ...style, page: { ...style.page, ...partial } }),
      typography: (partial: Partial<OverviewStyleConfig["typography"]>) =>
        onChange({ ...style, typography: { ...style.typography, ...partial } }),
      logos: (partial: Partial<OverviewStyleConfig["logos"]>) =>
        onChange({ ...style, logos: { ...style.logos, ...partial } }),
      cards: (partial: Partial<OverviewStyleConfig["cards"]>) =>
        onChange({ ...style, cards: { ...style.cards, ...partial } }),
      questions: (partial: Partial<OverviewStyleConfig["questions"]>) =>
        onChange({ ...style, questions: { ...style.questions, ...partial } }),
      highlights: (partial: Partial<OverviewStyleConfig["highlights"]>) =>
        onChange({ ...style, highlights: { ...style.highlights, ...partial } }),
      agenda: (partial: Partial<OverviewStyleConfig["agenda"]>) =>
        onChange({ ...style, agenda: { ...style.agenda, ...partial } }),
      preview: (partial: Partial<OverviewStyleConfig["preview"]>) =>
        onChange({ ...style, preview: { ...style.preview, ...partial } }),
    }),
    [onChange, style],
  );

  async function handleCopy() {
    const ok = await copyTextToClipboard(overviewStyleConfigToClipboardJson(style));
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!mounted) return null;

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
      className="pointer-events-auto fixed bottom-4 right-4 z-[2147483000] flex max-h-[min(92dvh,680px)] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border-2 border-[#7DD3E8] bg-[#0B1220] text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
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
        .oa-style-slider:focus {
          outline: none;
        }
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
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight">Quick style edit</p>
          <p className="text-[10px] text-white/45">Live preview · copy JSON for Cursor</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(defaultOverviewStyleConfig())}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            title="Reset to defaults"
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
        {section === "page" ? (
          <>
            <SliderRow
              label="Page padding X"
              value={style.page.paddingX}
              min={0}
              max={48}
              onChange={(paddingX) => patch.page({ paddingX })}
            />
            <SliderRow
              label="Page padding Y"
              value={style.page.paddingY}
              min={0}
              max={48}
              onChange={(paddingY) => patch.page({ paddingY })}
            />
            <SliderRow
              label="Column gap"
              value={style.page.columnGap}
              min={0}
              max={40}
              onChange={(columnGap) => patch.page({ columnGap })}
            />
            <SliderRow
              label="Left column width"
              value={style.page.leftColumnFr}
              min={0.4}
              max={1.4}
              step={0.05}
              unit="fr"
              onChange={(leftColumnFr) => patch.page({ leftColumnFr })}
            />
            <SliderRow
              label="Right column width"
              value={style.page.rightColumnFr}
              min={1}
              max={3.5}
              step={0.05}
              unit="fr"
              onChange={(rightColumnFr) => patch.page({ rightColumnFr })}
            />
            <SliderRow
              label="Card stack gap"
              value={style.page.cardGap}
              min={0}
              max={40}
              onChange={(cardGap) => patch.page({ cardGap })}
            />
            <SliderRow
              label="Hero image opacity"
              value={style.page.heroImageOpacity}
              min={0}
              max={1}
              step={0.01}
              unit="op"
              onChange={(heroImageOpacity) => patch.page({ heroImageOpacity })}
            />
            <SliderRow
              label="Dark overlay opacity"
              value={style.page.overlayOpacity}
              min={0}
              max={1}
              step={0.01}
              unit="op"
              onChange={(overlayOpacity) => patch.page({ overlayOpacity })}
            />
            <ColorRow label="Accent" value={style.accent} onChange={(accent) => onChange({ ...style, accent })} />
          </>
        ) : null}

        {section === "type" ? (
          <>
            <label className="block text-[11px] text-white/75">
              <span className="mb-1 block">Font family</span>
              <select
                value={style.typography.fontFamily}
                onChange={(e) =>
                  patch.typography({ fontFamily: e.target.value as OverviewFontId })
                }
                className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-[12px] text-white"
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
              max={22}
              onChange={(headerFontSize) => patch.typography({ headerFontSize })}
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
            <SliderRow
              label="OnwardAir logo height"
              value={style.logos.oaHeight}
              min={18}
              max={64}
              onChange={(oaHeight) => patch.logos({ oaHeight })}
            />
            <SliderRow
              label="OnwardAir max width"
              value={style.logos.oaMaxWidth}
              min={80}
              max={280}
              onChange={(oaMaxWidth) => patch.logos({ oaMaxWidth })}
            />
            <SliderRow
              label="Unit311 logo height"
              value={style.logos.unit311Height}
              min={12}
              max={40}
              onChange={(unit311Height) => patch.logos({ unit311Height })}
            />
            <SliderRow
              label="Unit311 max width"
              value={style.logos.unit311MaxWidth}
              min={48}
              max={180}
              onChange={(unit311MaxWidth) => patch.logos({ unit311MaxWidth })}
            />
          </>
        ) : null}

        {section === "cards" ? (
          <>
            <SliderRow
              label="Card padding"
              value={style.cards.padding}
              min={4}
              max={32}
              onChange={(padding) => patch.cards({ padding })}
            />
            <SliderRow
              label="Card corner radius"
              value={style.cards.radius}
              min={0}
              max={28}
              onChange={(radius) => patch.cards({ radius })}
            />
            <SliderRow
              label="Card border opacity"
              value={style.cards.borderOpacity}
              min={0}
              max={1}
              step={0.01}
              unit="op"
              onChange={(borderOpacity) => patch.cards({ borderOpacity })}
            />
          </>
        ) : null}

        {section === "questions" ? (
          <>
            <ColorRow label="Background" value={style.questions.bg} onChange={(bg) => patch.questions({ bg })} />
            <ColorRow
              label="Text colour"
              value={style.questions.textColor}
              onChange={(textColor) => patch.questions({ textColor })}
            />
            <SliderRow
              label="Text size"
              value={style.questions.textSize}
              min={10}
              max={22}
              onChange={(textSize) => patch.questions({ textSize })}
            />
            <SliderRow
              label="Badge size"
              value={style.questions.badgeSize}
              min={14}
              max={32}
              onChange={(badgeSize) => patch.questions({ badgeSize })}
            />
            <SliderRow
              label="Item gap"
              value={style.questions.itemGap}
              min={0}
              max={20}
              onChange={(itemGap) => patch.questions({ itemGap })}
            />
          </>
        ) : null}

        {section === "highlights" ? (
          <>
            <ColorRow label="Background" value={style.highlights.bg} onChange={(bg) => patch.highlights({ bg })} />
            <ColorRow
              label="Title colour"
              value={style.highlights.titleColor}
              onChange={(titleColor) => patch.highlights({ titleColor })}
            />
            <SliderRow
              label="Title size"
              value={style.highlights.titleSize}
              min={9}
              max={20}
              onChange={(titleSize) => patch.highlights({ titleSize })}
            />
            <ColorRow
              label="Item colour"
              value={style.highlights.itemColor}
              onChange={(itemColor) => patch.highlights({ itemColor })}
            />
            <SliderRow
              label="Item size"
              value={style.highlights.itemSize}
              min={9}
              max={20}
              onChange={(itemSize) => patch.highlights({ itemSize })}
            />
          </>
        ) : null}

        {section === "agenda" ? (
          <>
            <ColorRow label="Card background" value={style.agenda.bg} onChange={(bg) => patch.agenda({ bg })} />
            <ColorRow
              label="Title colour"
              value={style.agenda.titleColor}
              onChange={(titleColor) => patch.agenda({ titleColor })}
            />
            <SliderRow
              label="Title size"
              value={style.agenda.titleSize}
              min={9}
              max={20}
              onChange={(titleSize) => patch.agenda({ titleSize })}
            />
            <ColorRow label="Row background" value={style.agenda.rowBg} onChange={(rowBg) => patch.agenda({ rowBg })} />
            <SliderRow
              label="Row padding X"
              value={style.agenda.rowPaddingX}
              min={0}
              max={24}
              onChange={(rowPaddingX) => patch.agenda({ rowPaddingX })}
            />
            <SliderRow
              label="Row padding Y"
              value={style.agenda.rowPaddingY}
              min={0}
              max={20}
              onChange={(rowPaddingY) => patch.agenda({ rowPaddingY })}
            />
            <SliderRow
              label="Row radius"
              value={style.agenda.rowRadius}
              min={0}
              max={20}
              onChange={(rowRadius) => patch.agenda({ rowRadius })}
            />
            <SliderRow
              label="Wave / time size"
              value={style.agenda.waveSize}
              min={8}
              max={16}
              onChange={(waveSize) => patch.agenda({ waveSize })}
            />
            <SliderRow
              label="Who size"
              value={style.agenda.whoSize}
              min={8}
              max={18}
              onChange={(whoSize) => patch.agenda({ whoSize })}
            />
            <SliderRow
              label="Why size"
              value={style.agenda.whySize}
              min={8}
              max={16}
              onChange={(whySize) => patch.agenda({ whySize })}
            />
            <ColorRow
              label="Why colour"
              value={style.agenda.whyColor}
              onChange={(whyColor) => patch.agenda({ whyColor })}
            />
          </>
        ) : null}

        {section === "preview" ? (
          <>
            <SliderRow
              label="Panel radius"
              value={style.preview.radius}
              min={0}
              max={28}
              onChange={(radius) => patch.preview({ radius })}
            />
            <SliderRow
              label="Min height (mobile)"
              value={style.preview.minHeight}
              min={240}
              max={720}
              step={10}
              onChange={(minHeight) => patch.preview({ minHeight })}
            />
            <SliderRow
              label="Border opacity"
              value={style.preview.borderOpacity}
              min={0}
              max={1}
              step={0.01}
              unit="op"
              onChange={(borderOpacity) => patch.preview({ borderOpacity })}
            />
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
          {copied ? "Copied JSON — paste into Cursor" : "Copy style JSON to clipboard"}
        </button>
      </footer>
    </div>
  );

  return createPortal(ui, document.body);
}
