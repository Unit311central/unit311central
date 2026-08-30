"use client";

import { Save } from "lucide-react";

import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER,
  type SaecDiscoveryQuestionConfig,
  type SaecDiscoverySoftwareFunction,
} from "@/lib/saec-discovery/config";
import { cn } from "@/lib/utils";

/** Function/question left, answer right — balanced two-column layout. */
export const DISCOVERY_TWO_COLUMN_GRID_CLASS =
  "grid gap-x-6 md:grid-cols-[minmax(0,52%)_minmax(0,48%)]";

/** General numbered questions — comfortable label line-height. */
export const DISCOVERY_GENERAL_QUESTION_LABEL_CLASS =
  "block text-[13px] font-normal leading-relaxed text-white/85";

/** Shared typography and field styling for all SAEC Discovery sections. */
export const DISCOVERY_QUESTION_LABEL_CLASS =
  "block text-[13px] font-normal leading-snug text-white/85";

export const DISCOVERY_FIELD_CLASS =
  "w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50";

export const DISCOVERY_SOFTWARE_GRID_CLASS = DISCOVERY_TWO_COLUMN_GRID_CLASS;

export const DISCOVERY_COLUMN_HEADER_CLASS =
  "text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35";

export const DISCOVERY_SOFTWARE_ROW_CLASS = cn(
  DISCOVERY_SOFTWARE_GRID_CLASS,
  "items-start gap-y-1",
);

type SectionHeaderProps = {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  onSave: () => void;
};

export function DiscoverySectionHeader({ title, icon: Icon, onSave }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-400/25 bg-sky-500/10 text-sky-200">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-white sm:text-base">
          {title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85 transition-colors hover:bg-white/[0.08]"
      >
        <Save className="h-3 w-3" strokeWidth={2} />
        Save
      </button>
    </div>
  );
}

export function DiscoveryOptionalTextarea({
  id,
  value,
  onChange,
  rows = 3,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      placeholder={SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER}
      onChange={(event) => onChange(event.target.value)}
      className={cn(DISCOVERY_FIELD_CLASS, "resize-none", className)}
    />
  );
}

export function DiscoveryOptionalTextInput({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      placeholder={SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER}
      onChange={(event) => onChange(event.target.value)}
      className={cn(DISCOVERY_FIELD_CLASS, "h-[38px]", className)}
    />
  );
}

export function DiscoveryCommentsBlock({
  sectionId,
  value,
  onChange,
  rows = 4,
}: {
  sectionId: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="mt-5 shrink-0 border-t border-white/10 pt-4">
      <label
        htmlFor={`${sectionId}-comments`}
        className="mb-2.5 block text-[13px] font-medium leading-snug text-white/70"
      >
        Any other comments
      </label>
      <DiscoveryOptionalTextarea
        id={`${sectionId}-comments`}
        value={value}
        onChange={onChange}
        rows={rows}
      />
    </div>
  );
}

export function DiscoverySoftwareFunctionPanel({
  sectionId,
  functions,
  draft,
  updateDraft,
}: {
  sectionId: string;
  functions: readonly SaecDiscoverySoftwareFunction[];
  draft: Record<string, string>;
  updateDraft: (key: string, value: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          DISCOVERY_SOFTWARE_GRID_CLASS,
          "mb-3 shrink-0 border-b border-white/10 pb-2.5",
          DISCOVERY_COLUMN_HEADER_CLASS,
        )}
      >
        <span>Function</span>
        <span>Software / System</span>
      </div>
      <div className="min-h-0 space-y-3">
        {functions.map((entry) => (
          <div key={entry.id} className={DISCOVERY_SOFTWARE_ROW_CLASS}>
            <label htmlFor={`${sectionId}-${entry.id}`} className={DISCOVERY_QUESTION_LABEL_CLASS}>
              {entry.label}
            </label>
            <DiscoveryOptionalTextInput
              id={`${sectionId}-${entry.id}`}
              value={draft[entry.id] ?? ""}
              onChange={(value) => updateDraft(entry.id, value)}
            />
          </div>
        ))}
      </div>
      <DiscoveryCommentsBlock
        sectionId={sectionId}
        value={draft[SAEC_DISCOVERY_COMMENTS_KEY] ?? ""}
        onChange={(value) => updateDraft(SAEC_DISCOVERY_COMMENTS_KEY, value)}
      />
    </div>
  );
}

export function DiscoveryVerticalQuestionsPanel({
  sectionId,
  questions,
  draft,
  updateDraft,
  answerRows = 3,
}: {
  sectionId: string;
  questions: readonly SaecDiscoveryQuestionConfig[];
  draft: Record<string, string>;
  updateDraft: (key: string, value: string) => void;
  answerRows?: number;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2.5">
            <label htmlFor={`${sectionId}-${question.id}`} className={DISCOVERY_QUESTION_LABEL_CLASS}>
              {question.label}
            </label>
            <DiscoveryOptionalTextarea
              id={`${sectionId}-${question.id}`}
              value={draft[question.id] ?? ""}
              onChange={(value) => updateDraft(question.id, value)}
              rows={answerRows}
              className="min-h-[4.25rem]"
            />
          </div>
        ))}
      </div>
      <DiscoveryCommentsBlock
        sectionId={sectionId}
        value={draft[SAEC_DISCOVERY_COMMENTS_KEY] ?? ""}
        onChange={(value) => updateDraft(SAEC_DISCOVERY_COMMENTS_KEY, value)}
      />
    </div>
  );
}
