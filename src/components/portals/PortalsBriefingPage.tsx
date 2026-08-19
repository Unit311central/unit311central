"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  PortalsBriefingCredentialCard,
  PortalsBriefingEditableRows,
} from "@/components/portals/briefing-ui";
import PortalsBriefingShell from "@/components/portals/PortalsBriefingShell";
import {
  AbhiLogoMark,
  getPortalsBriefingUiConfig,
  NorthstarLogoMark,
  OnwardAirLogoMark,
  TalantonLogoMark,
} from "@/lib/portals/briefing/pack-ui-configs";
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
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(BRIEFING_CONTENT_API, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) {
        window.location.assign(config.loginRedirectOnAuthFailure);
        return;
      }
      const data = (await response.json()) as {
        content?: PortalsEditableContent;
        username?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to load portals content");
      if (data.content) {
        setContent(data.content);
      }
      if (data.username) setUsername(data.username);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [config.loginRedirectOnAuthFailure]);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  async function handleLogout() {
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
    if (config.headerLayout === "abhi") {
      return (
        <header className="relative flex items-center justify-between gap-4">
          <Link href="https://abhi.unit311central.com" className="shrink-0" aria-label="ABHI">
            <AbhiLogoMark height={36} tone="onDark" priority />
          </Link>
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
          <TalantonLogoMark height={36} />
        </header>
      );
    }

    if (config.headerLayout === "northstar") {
      return (
        <header className="relative flex items-center justify-between gap-4">
          <Link href="https://demo.unit311central.com" className="shrink-0" aria-label="Northstar">
            <NorthstarLogoMark height={36} />
          </Link>
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
          {loadError ? <p className="mt-2 text-[12px] text-rose-200">{loadError}</p> : null}
        </section>

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading briefing…
          </div>
        ) : (
          <div
            className={cn(
              "relative mt-8 grid flex-1 items-stretch gap-5 lg:mt-10 lg:gap-6",
              config.showCustomModulesColumn === false ? "lg:grid-cols-2" : "lg:grid-cols-3",
            )}
          >
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
                  canEdit={false}
                  accent="sky"
                  collapsible
                  onChange={() => {}}
                />
              </div>
            </section>

            {config.showCustomModulesColumn !== false ? (
              <section className="flex h-full min-h-0 flex-col">
                <div className="border-b border-white/10 pb-3">
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    {config.customModulesTitle ?? "Customised Modules"}
                  </h2>
                </div>
                <div className="mt-3 flex h-full flex-col rounded-2xl border border-[#C2185B]/25 bg-gradient-to-b from-[#C2185B]/12 to-white/[0.03] p-4 backdrop-blur-md">
                  <PortalsBriefingEditableRows
                    rows={content.customModules}
                    canEdit={false}
                    accent="pink"
                    onChange={() => {}}
                  />
                </div>
              </section>
            ) : null}
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
