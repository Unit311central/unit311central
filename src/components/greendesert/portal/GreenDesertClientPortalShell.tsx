"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import GreenDesertLogoMark from "@/components/layout/GreenDesertLogoMark";
import {
  GREENDESERT_CLIENT_NAV_GROUPS,
  greenDesertClientPortalHref,
} from "@/lib/greendesert/client-portal-data";
import { GREENDESERT_DISPLAY_NAME } from "@/lib/greendesert-surface";
import { cn } from "@/lib/utils";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  companyLogoSrc?: string;
  children: React.ReactNode;
};

export function GreenDesertClientPortalShell({
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
    const href = greenDesertClientPortalHref(companyPath, hrefSuffix);
    if (!hrefSuffix) {
      return pathname === `/${companyPath}` || pathname === `/${companyPath}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="mb-6 space-y-3 px-1">
        {companyLogoSrc ? (
          <span className="inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companyLogoSrc}
              alt={companyName}
              className="h-9 w-auto max-w-full object-contain object-center"
              decoding="async"
            />
          </span>
        ) : (
          <div className="inline-flex rounded-xl bg-white px-3 py-2">
            <GreenDesertLogoMark height={40} maxWidth={110} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold leading-snug text-white">{companyName}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/35">
            {GREENDESERT_DISPLAY_NAME} client portal
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {GREENDESERT_CLIENT_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {group.label ? (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={greenDesertClientPortalHref(companyPath, item.hrefSuffix)}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "min-h-11 touch-manipulation rounded-lg px-3 py-2.5 text-sm transition lg:min-h-0 lg:py-2",
                    isActive(item.hrefSuffix)
                      ? "bg-teal-500/20 text-teal-100"
                      : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              ))}
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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#07121c] px-4 py-5 transition-transform lg:static lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <button
          type="button"
          className="absolute top-4 right-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-white/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {nav}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-white/10 px-4 lg:hidden">
          <button
            type="button"
            className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-white/15"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="truncate text-sm font-semibold">{companyName}</p>
        </header>
        <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
