"use client";

import { ChevronDown, ChevronRight, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ONWARDAIR_HOME_ACCENT } from "@/lib/onwardair-surface";
import {
  type OnwardAirOverviewEditableContent,
  type PortalsModuleRow,
  defaultOnwardAirOverviewContent,
  overviewScreenshotForModuleId,
  overviewScreenshotSrc,
  portalsRowIndent,
} from "@/lib/onwardair/overview-demo";
import { cn } from "@/lib/utils";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const OA_LOGO = "/images/workspaces/onwardair-logo.png";
const HERO_BG = "/images/overview-corporate-intelligence-bg.png";

type ModuleNode = {
  row: PortalsModuleRow;
  index: number;
  children: ModuleNode[];
};

function buildModuleTree(rows: PortalsModuleRow[]): ModuleNode[] {
  const roots: ModuleNode[] = [];
  let current0: ModuleNode | null = null;
  let current1: ModuleNode | null = null;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const indent = portalsRowIndent(row);
    const node: ModuleNode = { row, index, children: [] };

    if (indent === 0) {
      roots.push(node);
      current0 = node;
      current1 = null;
      continue;
    }
    if (indent === 1) {
      if (current0) {
        current0.children.push(node);
        current1 = node;
      } else {
        roots.push(node);
        current0 = node;
        current1 = null;
      }
      continue;
    }
    if (current1) current1.children.push(node);
    else if (current0) current0.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function EditableText({
  value,
  canEdit,
  onChange,
  className,
  multiline = false,
}: {
  value: string;
  canEdit: boolean;
  onChange: (next: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  if (!canEdit) {
    return multiline ? (
      <p className={className}>{value}</p>
    ) : (
      <span className={className}>{value}</span>
    );
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={cn(
          "w-full resize-y rounded-md border border-[#267B90]/30 bg-white/90 px-2 py-1.5 outline-none focus:border-[#267B90]",
          className,
        )}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-md border border-[#267B90]/30 bg-white/90 px-2 py-1 outline-none focus:border-[#267B90]",
        className,
      )}
    />
  );
}

export function OnwardAirOverviewPage() {
  const [content, setContent] = useState<OnwardAirOverviewEditableContent>(() =>
    defaultOnwardAirOverviewContent(),
  );
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedModuleId, setSelectedModuleId] = useState("m1");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onwardair/overview-content", { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as {
          content: OnwardAirOverviewEditableContent;
          canEdit?: boolean;
        };
        if (cancelled) return;
        setContent(data.content);
        setCanEdit(Boolean(data.canEdit));
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

  const tree = useMemo(() => buildModuleTree(content.modules), [content.modules]);
  const previewSrc = overviewScreenshotForModuleId(selectedModuleId);
  const selectedLabel =
    content.modules.find((row) => row.id === selectedModuleId)?.text ?? "Home dashboard";

  const patch = useCallback((partial: Partial<OnwardAirOverviewEditableContent>) => {
    setContent((current) => ({ ...current, ...partial }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/onwardair/overview-content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json()) as { content?: OnwardAirOverviewEditableContent; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (data.content) setContent(data.content);
      setSaveMsg("Saved");
      window.setTimeout(() => setSaveMsg(null), 2000);
    } catch (error) {
      setSaveMsg(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  }

  function renderNode(node: ModuleNode, depth: 0 | 1 | 2) {
    const hasChildren = node.children.length > 0;
    const open = Boolean(expandedIds[node.row.id]);
    const selected = selectedModuleId === node.row.id;
    const ExpandIcon = open ? ChevronDown : ChevronRight;
    const pad = depth === 0 ? "pl-0" : depth === 1 ? "pl-5" : "pl-9";

    return (
      <li key={node.row.id} className="space-y-0.5">
        <div className={cn("flex items-center gap-1", pad)}>
          {depth === 0 ? (
            hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(node.row.id)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#267B90]/25 text-[#1B2430]/70 hover:bg-[#267B90]/10"
                aria-expanded={open}
                aria-label={open ? "Collapse" : "Expand"}
              >
                <ExpandIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="inline-flex h-6 w-6 shrink-0" aria-hidden />
            )
          ) : (
            <span className="inline-flex h-6 w-3 shrink-0" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => setSelectedModuleId(node.row.id)}
            className={cn(
              "min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-[11px] leading-snug transition sm:text-[12px]",
              selected
                ? "bg-[#267B90] font-semibold text-white"
                : "text-[#1B2430] hover:bg-[#267B90]/10",
            )}
          >
            {node.row.text || "Untitled"}
          </button>
        </div>
        {hasChildren && open
          ? node.children.map((child) =>
              renderNode(child, Math.min(depth + 1, 2) as 0 | 1 | 2),
            )
          : null}
      </li>
    );
  }

  return (
    <div className="oa-overview relative min-h-[100dvh] text-white xl:h-dvh xl:max-h-dvh xl:overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.48]"
        style={{ backgroundImage: `url(${HERO_BG})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#020617]/70 via-[#020617]/76 to-[#020617]/86"
        aria-hidden
      />

      <div className="relative flex min-h-[100dvh] flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4 xl:h-full xl:min-h-0">
        <header className="flex shrink-0 items-center justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${OA_LOGO}?v=swap2`}
            alt="OnwardAir"
            width={240}
            height={52}
            decoding="async"
            className="block object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
            style={{ height: 52, width: "auto", maxWidth: 240, maxHeight: 52 }}
          />

          <div className="flex items-center gap-3 sm:gap-4">
            {canEdit ? (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || loading}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#267B90] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:opacity-95 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saveMsg ?? "Save"}
              </button>
            ) : null}
            <a href="https://unit311central.com" aria-label="Unit311 Central" className="inline-flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${UNIT311_LOGO}?v=swap2`}
                alt="Unit311 Central"
                width={280}
                height={70}
                decoding="async"
                className="block object-contain object-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
                style={{ height: 70, width: "auto", maxWidth: 280, maxHeight: 70 }}
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

        {/* Single-row demo headline */}
        <div className="mt-6 shrink-0 sm:mt-8">
          {canEdit ? (
            <div className="space-y-1.5">
              <EditableText
                value={content.headline}
                canEdit={canEdit}
                onChange={(headline) => patch({ headline })}
                className="text-[1.25rem] font-semibold tracking-tight text-[#1B2430] sm:text-[1.5rem]"
              />
              <EditableText
                value={content.subheadline}
                canEdit={canEdit}
                onChange={(subheadline) => patch({ subheadline })}
                className="text-[12px] text-[#1B2430]/80 sm:text-[13px]"
              />
            </div>
          ) : (
            <div className="leading-snug">
              <h1 className="text-[1.25rem] font-semibold tracking-tight text-white sm:text-[1.55rem] lg:text-[1.75rem]">
                {content.headline}
              </h1>
              <p className="mt-1 text-[12px] text-white/70 sm:text-[13px]">{content.subheadline}</p>
            </div>
          )}
        </div>

        {/* 3 columns */}
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:mt-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-3 lg:overflow-hidden">
          {/* Column 1 */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto lg:overflow-hidden">
            <section className="rounded-xl border border-[#267B90]/25 bg-[#0B3A4A]/85 p-3 text-white backdrop-blur-[2px] sm:p-3.5">
              <EditableText
                value={content.questionsTitle}
                canEdit={canEdit}
                onChange={(questionsTitle) => patch({ questionsTitle })}
                className="text-[13px] font-semibold tracking-tight"
              />
              <EditableText
                value={content.questionsIntro}
                canEdit={canEdit}
                onChange={(questionsIntro) => patch({ questionsIntro })}
                multiline
                className="mt-1.5 text-[11px] leading-snug text-white/80"
              />
              <ul className="mt-2.5 space-y-1.5">
                {content.questions.map((q, i) => (
                  <li key={`q-${i}`} className="flex gap-2">
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: ONWARDAIR_HOME_ACCENT }}
                    >
                      {i + 1}
                    </span>
                    {canEdit ? (
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => {
                          const questions = [...content.questions];
                          questions[i] = e.target.value;
                          patch({ questions });
                        }}
                        className="w-full rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] text-white outline-none"
                      />
                    ) : (
                      <p className="text-[11px] leading-snug text-white/95">{q}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-[#267B90]/25 bg-[#0B3A4A]/85 p-3 text-white backdrop-blur-[2px] sm:p-3.5">
              <EditableText
                value={content.highlightsIntro}
                canEdit={canEdit}
                onChange={(highlightsIntro) => patch({ highlightsIntro })}
                multiline
                className="text-[11px] leading-snug text-white/80"
              />
              <p
                className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "#7DD3E8" }}
              >
                {canEdit ? (
                  <input
                    type="text"
                    value={content.highlightsTitle}
                    onChange={(e) => patch({ highlightsTitle: e.target.value })}
                    className="w-full rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7DD3E8] outline-none"
                  />
                ) : (
                  content.highlightsTitle
                )}
              </p>
              <ul className="mt-2 space-y-1">
                {content.highlights.map((item, i) => (
                  <li key={`h-${i}`} className="text-[11px] leading-snug text-white/95">
                    {canEdit ? (
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const highlights = [...content.highlights];
                          highlights[i] = e.target.value;
                          patch({ highlights });
                        }}
                        className="w-full rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] text-white outline-none"
                      />
                    ) : (
                      <>• {item}</>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#267B90]/20 bg-white/90 p-3 text-[#1B2430] backdrop-blur-[2px] sm:p-3.5">
              <EditableText
                value={content.agendaTitle}
                canEdit={canEdit}
                onChange={(agendaTitle) => patch({ agendaTitle })}
                className="text-[13px] font-semibold tracking-tight text-[#1B2430]"
              />
              <EditableText
                value={content.agendaIntro}
                canEdit={canEdit}
                onChange={(agendaIntro) => patch({ agendaIntro })}
                className="mt-1 text-[10px] text-[#5B6577]"
              />
              <div className="mt-2 space-y-1.5">
                {content.agenda.map((row, i) => (
                  <div
                    key={`a-${i}`}
                    className="rounded-lg border border-[#267B90]/15 bg-white px-2.5 py-1.5"
                  >
                    {canEdit ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={row.wave}
                          onChange={(e) => {
                            const agenda = content.agenda.map((entry, idx) =>
                              idx === i ? { ...entry, wave: e.target.value } : entry,
                            );
                            patch({ agenda });
                          }}
                          className="w-full rounded border border-[#267B90]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase outline-none"
                          style={{ color: ONWARDAIR_HOME_ACCENT }}
                        />
                        <input
                          type="text"
                          value={row.who}
                          onChange={(e) => {
                            const agenda = content.agenda.map((entry, idx) =>
                              idx === i ? { ...entry, who: e.target.value } : entry,
                            );
                            patch({ agenda });
                          }}
                          className="w-full rounded border border-[#267B90]/20 px-1.5 py-0.5 text-[11px] font-medium outline-none"
                        />
                        <input
                          type="text"
                          value={row.why}
                          onChange={(e) => {
                            const agenda = content.agenda.map((entry, idx) =>
                              idx === i ? { ...entry, why: e.target.value } : entry,
                            );
                            patch({ agenda });
                          }}
                          className="w-full rounded border border-[#267B90]/20 px-1.5 py-0.5 text-[10px] text-[#5B6577] outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <p
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: ONWARDAIR_HOME_ACCENT }}
                        >
                          {row.wave} min
                        </p>
                        <p className="text-[12px] font-medium text-[#1B2430]">{row.who}</p>
                        <p className="text-[11px] text-[#5B6577]">{row.why}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <EditableText
                value={content.agendaNote}
                canEdit={canEdit}
                onChange={(agendaNote) => patch({ agendaNote })}
                className="mt-auto pt-2 text-[10px] text-[#5B6577]"
              />
            </section>
          </div>

          {/* Column 2 */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto lg:overflow-hidden">
            <section className="shrink-0 overflow-hidden rounded-xl border border-[#267B90]/20 bg-white/90 p-2 backdrop-blur-[2px]">
              <p className="mb-1.5 px-1 text-[11px] font-semibold text-[#1B2430]">Home view</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={overviewScreenshotSrc("home")}
                alt="OnwardAir home dashboard"
                className="h-auto w-full rounded-lg border border-[#267B90]/15 object-cover object-top"
                style={{ maxHeight: 220 }}
              />
            </section>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#267B90]/20 bg-white/90 p-2.5 backdrop-blur-[2px] sm:p-3">
              <EditableText
                value={content.modulesTitle}
                canEdit={canEdit}
                onChange={(modulesTitle) => patch({ modulesTitle })}
                className="mb-2 shrink-0 text-[13px] font-semibold text-[#1B2430]"
              />
              <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
                {tree.map((node) => renderNode(node, 0))}
              </ul>
            </section>
          </div>

          {/* Column 3 — preview */}
          <section className="flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-[#267B90]/25 bg-[#0B3A4A]/90 p-3 text-white backdrop-blur-[2px] sm:min-h-[320px] sm:p-3.5 lg:min-h-0">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <h2 className="text-[13px] font-semibold tracking-tight">{selectedLabel}</h2>
              <span className="text-[10px] text-white/55">Preview</span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-white/15 bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={`${selectedLabel} screenshot`}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <p className="mt-2 shrink-0 text-center text-[10px] text-white/60">
              {content.previewHint}
            </p>
          </section>
        </div>

        <footer className="mt-2 shrink-0 text-center text-[9px] text-white/40 sm:text-[10px]">
          OnwardAir · Unit311 Central · Private overview
          {loading ? " · Loading…" : null}
        </footer>
      </div>
    </div>
  );
}
