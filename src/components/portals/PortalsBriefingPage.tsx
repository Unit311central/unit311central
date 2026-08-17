"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  PortalsBriefingCredentialCard,
  PortalsBriefingEditableRows,
} from "@/components/portals/briefing-ui";
import PortalsBriefingShell from "@/components/portals/PortalsBriefingShell";
import {
  AbhiLogoMark,
  getPortalsBriefingUiConfig,
  OnwardAirLogoMark,
  TalantonLogoMark,
} from "@/lib/portals/briefing/pack-ui-configs";
import {
  readPortalsBriefingAdminLock,
  writePortalsBriefingAdminLock,
} from "@/lib/portals/briefing/admin-lock";
import type { PortalsBriefingUiConfig } from "@/lib/portals/briefing/ui-config";
import type { PortalsEditableContent } from "@/lib/portals/types";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const UNIT311_LOGO = "/images/unit311central-login.webp";
const BRIEFING_CONTENT_API = "/api/portals/briefing-content";

export type PortalsBriefingPageProps = {
  workspaceSlug: string;
};

export default function PortalsBriefingPage({ workspaceSlug }: PortalsBriefingPageProps) {
  const config = getPortalsBriefingUiConfig(workspaceSlug);
  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14] px-6 text-sm text-white/60">
        Portals briefing is not available for this workspace.
      </div>
    );
  }

  return <PortalsBriefingPageBody config={config} />;
}

type PortalsBriefingPageBodyProps = {
  config: PortalsBriefingUiConfig;
};

function PortalsBriefingPageBody({ config }: PortalsBriefingPageBodyProps) {
  const [content, setContent] = useState<PortalsEditableContent>(() => config.defaultContent());
  const [canEdit, setCanEdit] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const dirtyRef = useRef(false);
  const adminLockRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!readPortalsBriefingAdminLock(config.workspaceSlug)) return;
    adminLockRef.current = true;
    setCanEdit(true);
  }, [config.workspaceSlug]);

  const applyContent = useCallback((next: PortalsEditableContent, markDirty: boolean) => {
    if (markDirty) dirtyRef.current = true;
    setContent(next);
  }, []);

  const loadContent = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
        setLoadError(null);
      }
      try {
        const response = await fetch(BRIEFING_CONTENT_API, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (response.status === 401) {
          if (!silent && !adminLockRef.current) {
            window.location.assign(config.loginRedirectOnAuthFailure);
          }
          return;
        }
        const data = (await response.json()) as {
          content?: PortalsEditableContent;
          canEdit?: boolean;
          username?: string;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Failed to load portals content");
        if (data.content && !dirtyRef.current) {
          setContent(data.content);
        }
        const nextCanEdit = Boolean(data.canEdit) || adminLockRef.current;
        if (nextCanEdit) {
          adminLockRef.current = true;
          writePortalsBriefingAdminLock(config.workspaceSlug, true);
        }
        setCanEdit(nextCanEdit);
        if (data.username) setUsername(data.username);
      } catch (error) {
        if (!silent) {
          setLoadError(error instanceof Error ? error.message : "Failed to load");
        }
      } finally {
        if (!silent) setLoading(false);
        setReady(true);
      }
    },
    [config.loginRedirectOnAuthFailure, config.workspaceSlug],
  );

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  useEffect(() => {
    if (!ready || canEdit || adminLockRef.current) return;
    const timer = window.setInterval(() => {
      if (dirtyRef.current || saving || adminLockRef.current) return;
      void loadContent({ silent: true });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [ready, canEdit, saving, loadContent]);

  const saveContent = useCallback(
    async (payload?: PortalsEditableContent) => {
      if (!canEdit && !adminLockRef.current) return;
      const body = payload ?? contentRef.current;
      dirtyRef.current = false;
      setSaving(true);
      setSaveMessage("Saving…");
      try {
        const response = await fetch(BRIEFING_CONTENT_API, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ content: body }),
        });
        const data = (await response.json()) as {
          content?: PortalsEditableContent;
          error?: string;
        };
        if (!response.ok) {
          dirtyRef.current = true;
          throw new Error(data.error ?? "Save failed");
        }
        if (data.content && !dirtyRef.current) {
          setContent(data.content);
        }
        setSaveMessage("Saved");
        window.setTimeout(() => setSaveMessage(null), 2000);
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [canEdit],
  );

  useEffect(() => {
    if (!canEdit || !ready || !dirtyRef.current) return;
    const hasBlankDraft =
      content.majorModules.some((row) => !row.text.trim()) ||
      content.customModules.some((row) => !row.text.trim());
    if (hasBlankDraft) return;
    const timer = window.setTimeout(() => {
      void saveContent(content);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [content, canEdit, ready, saveContent]);

  async function handleLogout() {
    adminLockRef.current = false;
    writePortalsBriefingAdminLock(config.workspaceSlug, false);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // Continue to login regardless.
    }
    window.location.assign(config.loginRedirectOnLogout);
  }

  function renderHeader() {
    const editControls = canEdit ? (
      <>
        <span className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 sm:min-h-0">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <span className="hidden sm:inline">{saveMessage ?? "Auto-save on"}</span>
          <span className="sm:hidden">{saving ? "Saving…" : "Saved"}</span>
        </span>
        <button
          type="button"
          onClick={() => void saveContent()}
          disabled={saving}
          className="inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/20 px-3 py-1.5 text-[11px] font-semibold text-sky-50 hover:bg-sky-500/30 disabled:opacity-50 sm:min-h-0"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save
        </button>
      </>
    ) : null;

    if (config.headerLayout === "abhi") {
      return (
        <header className="relative flex items-center justify-between gap-4">
          <Link href="https://abhi.unit311central.com" className="shrink-0" aria-label="ABHI">
            <AbhiLogoMark height={36} tone="onDark" priority />
          </Link>
          <div className="flex items-center gap-3">
            {editControls}
            <Link href="https://unit311central.com" className="shrink-0" aria-label={SITE_NAME}>
              <div className="relative h-9 w-[160px] sm:h-10 sm:w-[190px]">
                <Image
                  src={UNIT311_LOGO}
                  alt={SITE_NAME}
                  fill
                  priority
                  sizes="190px"
                  className="object-contain object-right drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                />
              </div>
            </Link>
          </div>
        </header>
      );
    }

    if (config.headerLayout === "talanton") {
      return (
        <header className="relative flex items-center justify-between gap-4">
          <Link href="https://unit311central.com" className="shrink-0" aria-label={SITE_NAME}>
            <div className="relative h-9 w-[160px] sm:h-10 sm:w-[190px]">
              <Image
                src={UNIT311_LOGO}
                alt={SITE_NAME}
                fill
                priority
                sizes="190px"
                className="object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
              />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {editControls}
            <TalantonLogoMark height={36} />
          </div>
        </header>
      );
    }

    return (
      <header className="relative flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <Link href="https://unit311central.com" className="shrink-0" aria-label={SITE_NAME}>
          <div className="relative h-9 w-[140px] sm:h-10 sm:w-[190px]">
            <Image
              src={UNIT311_LOGO}
              alt={SITE_NAME}
              fill
              priority
              sizes="190px"
              className="object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            />
          </div>
        </Link>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {config.showUsernameInHeader && username ? (
            <p className="hidden max-w-[10rem] truncate text-[11px] text-white/50 md:block">{username}</p>
          ) : null}
          {editControls}
          {config.showLogoutInHeader ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex min-h-11 touch-manipulation items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/[0.04] hover:text-white sm:min-h-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Out</span>
            </button>
          ) : null}
          <div className="hidden sm:block">
            <OnwardAirLogoMark height={36} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <PortalsBriefingShell className={config.shellClassName}>
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {renderHeader()}

        <section className="relative mt-8 max-w-3xl sm:mt-10">
          {config.eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              {config.eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-[2.25rem]",
              !config.eyebrow && "mt-0",
              config.titleClassName,
            )}
          >
            {config.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
            {config.description}
          </p>
          {canEdit ? (
            <p className="mt-2 text-[12px] text-emerald-200/80">
              Admin edit mode — use Save or wait for auto-save. Nested rows support sub-rows and
              sub-sub-rows.
              {saveMessage ? ` ${saveMessage}` : ""}
            </p>
          ) : null}
          {loadError ? <p className="mt-2 text-[12px] text-rose-200">{loadError}</p> : null}
        </section>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading briefing…
          </div>
        ) : (
          <div className="relative mt-8 grid flex-1 items-stretch gap-5 lg:mt-10 lg:grid-cols-3 lg:gap-6">
            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-white">Platform Login</h2>
              </div>
              <div className="mt-3 flex h-full flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md">
                {config.credentials.map((block) => (
                  <PortalsBriefingCredentialCard key={block.title} block={block} />
                ))}
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-white">Major Modules</h2>
              </div>
              <div className="mt-3 flex h-full flex-col rounded-2xl border border-white/12 bg-white/[0.04] p-4 backdrop-blur-md">
                <PortalsBriefingEditableRows
                  rows={content.majorModules}
                  canEdit={canEdit}
                  accent="sky"
                  collapsible
                  onChange={(majorModules) =>
                    applyContent({ ...contentRef.current, majorModules }, true)
                  }
                />
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  {config.customModulesTitle}
                </h2>
              </div>
              <div className="mt-3 flex h-full flex-col rounded-2xl border border-[#C2185B]/25 bg-gradient-to-b from-[#C2185B]/12 to-white/[0.03] p-4 backdrop-blur-md">
                <PortalsBriefingEditableRows
                  rows={content.customModules}
                  canEdit={canEdit}
                  accent="pink"
                  onChange={(customModules) =>
                    applyContent({ ...contentRef.current, customModules }, true)
                  }
                />
              </div>
            </section>
          </div>
        )}

        <footer
          className={cn(
            "mt-10 border-t border-white/10 pt-5 text-[11px] text-white/40",
            config.showSwitchAccountFooter &&
              "flex flex-wrap items-center justify-between gap-3",
          )}
        >
          <p>
            {SITE_NAME} · {config.footerLabel}
          </p>
          {config.showSwitchAccountFooter ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1 font-medium text-sky-300/80 transition hover:text-sky-200"
            >
              Switch account
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </footer>
      </div>
    </PortalsBriefingShell>
  );
}
