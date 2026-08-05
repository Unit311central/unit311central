"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

import OnwardAirLogoMark from "@/components/layout/OnwardAirLogoMark";
import {
  OA_CLIENT_PORTAL_NAV,
  oaClientPortalHref,
} from "@/lib/onwardair/client-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  companyLogoSrc?: string;
  children: React.ReactNode;
};

export function OnwardAirClientPortalShell({
  companyPath,
  companyName,
  displayName,
  companyLogoSrc,
  children,
}: Props) {
  const pathname = usePathname() || `/${companyPath}`;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* continue */
    }
    window.location.href = `/${companyPath}/login`;
  }

  function isActive(hrefSuffix: string) {
    const href = oaClientPortalHref(companyPath, hrefSuffix);
    if (!hrefSuffix) {
      return pathname === `/${companyPath}` || pathname === `/${companyPath}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="mb-6 space-y-3 px-1">
        <OnwardAirLogoMark height={36} maxWidth={180} />
        {companyLogoSrc ? (
          <span className="inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-white px-2.5 py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyLogoSrc}
              alt={companyName}
              className="h-7 w-auto max-w-full object-contain object-center"
              decoding="async"
            />
          </span>
        ) : null}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300/60">
            Client Portal
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-white">{companyName}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {OA_CLIENT_PORTAL_NAV.map((group) => (
          <div key={group.id}>
            {group.label ? (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const href = oaClientPortalHref(companyPath, item.hrefSuffix);
                const active = isActive(item.hrefSuffix);
                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "min-h-11 touch-manipulation rounded-lg px-3 py-2.5 text-sm transition lg:min-h-0 lg:py-2",
                      active
                        ? "bg-teal-500/20 text-teal-100"
                        : "text-white/65 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="truncate px-1 text-xs text-white/45">{displayName}</p>
        <p className="px-1 text-[10px] uppercase tracking-wide text-white/30">External</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex min-h-11 w-full touch-manipulation items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white lg:min-h-0"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-[#061018] text-white safe-area-pt safe-area-pb">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 touch-manipulation bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[16.5rem] max-w-[85vw] flex-col border-r border-white/10 bg-[#0a1822] px-3 py-5 transition-transform duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-modal={mobileNavOpen ? true : undefined}
        role={mobileNavOpen ? "dialog" : undefined}
        aria-label={mobileNavOpen ? "Navigation menu" : undefined}
      >
        <button
          type="button"
          className="absolute top-4 right-3 flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-white/15 text-white/60 lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-area-px flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-5 lg:hidden">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/15 text-white/70"
            aria-label="Open navigation menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{companyName}</p>
            <p className="truncate text-[10px] uppercase tracking-wide text-teal-300/60">Client Portal</p>
          </div>
          <OnwardAirLogoMark height={28} maxWidth={120} />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-8 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
