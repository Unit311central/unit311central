"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, LogOut, Menu, X } from "lucide-react";

import {
  WOLF_PAILEX_PORTAL_NAV,
  wolfPailexPortalHref,
} from "@/lib/wolf/wolf-pailex-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  companyLogoSrc?: string;
  children: React.ReactNode;
};

export function WolfPailexPortalShell({
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

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* continue */
    }
    window.location.href = `/${companyPath}/login`;
  }

  function isActive(hrefSuffix: string) {
    const href = wolfPailexPortalHref(companyPath, hrefSuffix);
    if (!hrefSuffix) {
      return pathname === `/${companyPath}` || pathname === `/${companyPath}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="mb-6 space-y-3 px-1">
        {companyLogoSrc ? (
          <span className="inline-flex w-full items-center justify-center overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyLogoSrc}
              alt={companyName}
              className="h-10 w-auto max-w-full object-contain object-center"
              decoding="async"
            />
          </span>
        ) : null}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/60">
            Client programme portal
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-white">{companyName}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {WOLF_PAILEX_PORTAL_NAV.map((item) => {
          const href = wolfPailexPortalHref(companyPath, item.hrefSuffix);
          const active = isActive(item.hrefSuffix);
          return (
            <Link
              key={item.id}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "min-h-11 touch-manipulation rounded-lg px-3 py-2.5 text-sm transition lg:min-h-0 lg:py-2",
                active
                  ? "bg-emerald-500/20 text-emerald-100"
                  : "text-white/65 hover:bg-white/5 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
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
          "fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col border-r border-white/10 bg-[#071018] p-4 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg border border-white/10 p-2 text-white/70"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileText className="h-4 w-4 text-emerald-300/80" />
            {companyName}
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto rounded-lg p-2 text-white/50 lg:hidden"
            aria-hidden={!mobileNavOpen}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
