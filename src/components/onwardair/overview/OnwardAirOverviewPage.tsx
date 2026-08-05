"use client";

import { ChevronDown, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
/** Drop files here when ready — RHS shows a player once present. */
const EA_VIDEO = "/videos/onwardair-overview-exec-assistant.mp4";
const DRONE_VIDEO = "/videos/onwardair-overview-live-drone.mp4";

type PreviewKind = "module" | "video-ea" | "video-drone" | "board-portal" | "client-portal";

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

function VideoSlot({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/15 bg-black/50">
      <video className="h-full min-h-[200px] w-full flex-1 bg-black object-contain" controls playsInline preload="metadata">
        <source src={src} type="video/mp4" />
      </video>
      <p className="shrink-0 px-2 py-2 text-center text-[10px] text-white/55">
        {label} — video TBD (upload when ready)
      </p>
    </div>
  );
}

export function OnwardAirOverviewPage() {
  const [content, setContent] = useState<OnwardAirOverviewEditableContent>(() =>
    defaultOnwardAirOverviewContent(),
  );
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    m19: true,
    m5: true,
  });
  const [previewKind, setPreviewKind] = useState<PreviewKind>("module");
  const [selectedModuleId, setSelectedModuleId] = useState("m1");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onwardair/overview-content", { credentials: "include" });
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as { content: OnwardAirOverviewEditableContent };
        if (cancelled) return;
        setContent({
          ...data.content,
          modules: defaultOnwardAirOverviewContent().modules,
          highlights: defaultOnwardAirOverviewContent().highlights,
          highlightsTitle: defaultOnwardAirOverviewContent().highlightsTitle,
          agenda: defaultOnwardAirOverviewContent().agenda,
          agendaTitle: defaultOnwardAirOverviewContent().agendaTitle,
          agendaIntro: defaultOnwardAirOverviewContent().agendaIntro,
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

  const tree = useMemo(() => buildModuleTree(content.modules), [content.modules]);

  const previewLabel = useMemo(() => {
    if (previewKind === "video-ea") return "AI Executive Assistant";
    if (previewKind === "video-drone") return "Live drone";
    if (previewKind === "board-portal") return "Board portal";
    if (previewKind === "client-portal") return "Client portal — Coastal Freight Partners";
    return content.modules.find((row) => row.id === selectedModuleId)?.text ?? "Home";
  }, [previewKind, selectedModuleId, content.modules]);

  const previewSrc = useMemo(() => {
    if (previewKind === "board-portal") return overviewScreenshotSrc("board-portal");
    if (previewKind === "client-portal") return overviewScreenshotSrc("client-portal");
    return overviewScreenshotForModuleId(selectedModuleId);
  }, [previewKind, selectedModuleId]);

  function selectModule(id: string) {
    if (id === "m2") {
      setPreviewKind("video-ea");
      setSelectedModuleId(id);
      return;
    }
    if (id === "m19c") {
      setPreviewKind("board-portal");
      setSelectedModuleId(id);
      return;
    }
    if (id === "m19d") {
      setPreviewKind("client-portal");
      setSelectedModuleId(id);
      return;
    }
    setPreviewKind("module");
    setSelectedModuleId(id);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  }

  function renderNode(node: ModuleNode, depth: 0 | 1 | 2) {
    const hasChildren = node.children.length > 0;
    const open = Boolean(expandedIds[node.row.id]);
    const selected =
      selectedModuleId === node.row.id &&
      (previewKind === "module" ||
        previewKind === "video-ea" ||
        previewKind === "board-portal" ||
        previewKind === "client-portal");
    const ExpandIcon = open ? ChevronDown : ChevronRight;
    const pad = depth === 0 ? "pl-0" : depth === 1 ? "pl-4" : "pl-8";

    return (
      <li key={node.row.id} className="space-y-0.5">
        <div className={cn("flex items-center gap-1", pad)}>
          {depth === 0 ? (
            hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpanded(node.row.id)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
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
            onClick={() => selectModule(node.row.id)}
            className={cn(
              "min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-[11px] leading-snug transition sm:text-[12px]",
              selected
                ? "bg-[#267B90] font-semibold text-white"
                : "text-white/85 hover:bg-white/10 hover:text-white",
            )}
          >
            {node.row.text || "Untitled"}
          </button>
        </div>
        {hasChildren && open
          ? node.children.map((child) => renderNode(child, Math.min(depth + 1, 2) as 0 | 1 | 2))
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
            src={`${OA_LOGO}?v=swap6`}
            alt="OnwardAir"
            width={200}
            height={40}
            decoding="async"
            className="block object-contain object-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
            style={{ height: 40, width: "auto", maxWidth: 180, maxHeight: 40 }}
          />
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="https://unit311central.com" aria-label="Unit311 Central" className="inline-flex h-10 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${UNIT311_LOGO}?v=swap6`}
                alt="Unit311 Central"
                width={100}
                height={22}
                decoding="async"
                className="block object-contain object-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
                style={{ height: 22, width: "auto", maxWidth: 100, maxHeight: 22 }}
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

        {/* Single row — no white box */}
        <p className="mt-5 shrink-0 text-[13px] leading-snug text-white/90 sm:mt-6 sm:text-[15px] lg:text-[16px]">
          <span className="font-semibold text-white">{content.headline}</span>
          <span className="text-white/45"> — </span>
          <span className="text-white/70">{content.subheadline}</span>
        </p>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto sm:mt-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.48fr)_minmax(0,1.7fr)] lg:gap-3 lg:overflow-hidden">
          {/* Column 1 — 3 boxes: white / teal / white */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto">
            <section className="shrink-0 rounded-xl border border-[#267B90]/20 bg-white p-3.5 text-[#1B2430] shadow-[0_8px_24px_rgba(0,0,0,0.14)] sm:p-4">
              <ul className="space-y-1.5">
                {content.questions.map((q, i) => (
                  <li key={`q-${i}`} className="flex gap-2">
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
              <p className="mt-3 text-[12px] leading-snug text-[#5B6577]">{content.questionsIntro}</p>
            </section>

            <section className="shrink-0 rounded-xl border border-[#267B90]/25 bg-[#0B3A4A]/85 p-3 text-white backdrop-blur-[2px] sm:p-3.5">
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

            <section className="shrink-0 rounded-xl border border-[#267B90]/25 bg-white p-3.5 text-[#1B2430] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-4">
              <h2 className="text-[15px] font-semibold tracking-tight text-[#1B2430]">
                {content.agendaTitle}
              </h2>
              <p className="mt-1 text-[12px] leading-snug text-[#5B6577]">{content.agendaIntro}</p>
              <div className="mt-3 space-y-2">
                {content.agenda.map((row, i) => (
                  <div
                    key={`a-${i}`}
                    className="rounded-lg border border-[#267B90]/20 bg-[#F4FAFB] px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: ONWARDAIR_HOME_ACCENT }}
                      >
                        {row.wave.includes("min") ? row.wave : `${row.wave} min`}
                      </p>
                      <p className="text-[13px] font-semibold text-[#1B2430]">{row.who}</p>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-[#5B6577]">{row.why}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Column 2 — narrower modules */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/12 bg-[#061018]/75 p-2 backdrop-blur-[2px]">
            <h2 className="mb-1.5 shrink-0 text-[11px] font-semibold tracking-tight text-white">
              {content.modulesTitle}
            </h2>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
              {tree.map((node) => renderNode(node, 0))}
            </ul>

            <div className="mt-2 shrink-0 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setPreviewKind("video-drone")}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition",
                  previewKind === "video-drone"
                    ? "bg-[#267B90] text-white"
                    : "bg-white/5 text-white/90 hover:bg-white/10",
                )}
              >
                Live drone
              </button>
            </div>
          </div>

          {/* Column 3 — soft white panel; screenshot fills height */}
          <section className="relative flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-[#D7E3EA] bg-[#F8FBFD] p-2.5 text-[#1B2430] shadow-[0_10px_30px_rgba(0,0,0,0.14)] sm:min-h-[380px] lg:min-h-0">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
              <h2 className="text-[13px] font-semibold tracking-tight text-[#1B2430]">{previewLabel}</h2>
              <span className="text-[10px] uppercase tracking-wide text-[#5B6577]">Preview</span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-[#E2EBF1] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              {previewKind === "video-ea" ? (
                <div className="absolute inset-0 overflow-hidden bg-[#061018]">
                  <VideoSlot src={EA_VIDEO} label="AI Executive Assistant walkthrough" />
                </div>
              ) : previewKind === "video-drone" ? (
                <div className="absolute inset-0 overflow-hidden bg-[#061018]">
                  <VideoSlot src={DRONE_VIDEO} label="Live drone walkthrough" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={`${previewLabel} screenshot`}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              )}
              <button
                type="button"
                onClick={() => setPreviewFullscreen(true)}
                className="absolute bottom-2.5 right-2.5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#267B90]/30 bg-white/95 text-[#1B2430] shadow-md transition hover:bg-[#267B90] hover:text-white"
                aria-label="View screenshot full screen"
                title="Full screen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-2 shrink-0 text-center text-[9px] text-white/40 sm:text-[10px]">
          OnwardAir · Unit311 Central · Private overview
          {loading ? " · Loading…" : null}
        </footer>
      </div>

      {previewFullscreen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${previewLabel} full screen`}
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
            <p className="mb-2 shrink-0 text-center text-sm font-medium text-white/80">{previewLabel}</p>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/15 bg-black">
              {previewKind === "video-ea" ? (
                <video className="h-full w-full object-contain" controls autoPlay playsInline>
                  <source src={EA_VIDEO} type="video/mp4" />
                </video>
              ) : previewKind === "video-drone" ? (
                <video className="h-full w-full object-contain" controls autoPlay playsInline>
                  <source src={DRONE_VIDEO} type="video/mp4" />
                </video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={`${previewLabel} full screen`}
                  className="h-full w-full object-contain object-center"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
