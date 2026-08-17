"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, Shield, X } from "lucide-react";

import NorthstarLogoMark from "@/components/layout/NorthstarLogoMark";
import { NORTHSTAR_BOARD_NAV } from "@/lib/demo/northstar-board-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  displayName: string;
  children: React.ReactNode;
};

export function NorthstarBoardPortalShell({ displayName, children }: Props) {
  const pathname = usePathname() || "/board";
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
    window.location.href = "/board/login";
  }

  function isActive(href: string) {
    if (href === "/board") return pathname === "/board" || pathname === "/board/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="mb-6 space-y-3">
        <NorthstarLogoMark height={40} maxWidth={200} />
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <Shield className="h-3 w-3" />
            Board Portal
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Northstar Board</p>
          <p className="mt-0.5 text-xs text-white/45">Secure · Read-only</p>
        </div>
      </div>

      <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        Board
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {NORTHSTAR_BOARD_NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "min-h-11 touch-manipulation rounded-lg px-3 py-2.5 text-sm transition lg:min-h-0 lg:py-2",
              isActive(item.href)
                ? "bg-teal-500/20 text-teal-100"
                : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="truncate px-1 text-xs text-white/45">{displayName}</p>
        <p className="px-1 text-[10px] uppercase tracking-wide text-white/30">Board Member</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex min-h-11 w-full touch-manipulation items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white lg:min-h-0"
        >
          <LogOut className="h-4 w-4" />
          Log out
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
          "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col border-r border-white/10 bg-[#0a1a22] px-4 py-5 transition-transform duration-200 ease-out lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0",
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
            <p className="truncate text-sm font-semibold text-white">Northstar Board</p>
            <p className="truncate text-[10px] uppercase tracking-wide text-white/40">Board Portal</p>
          </div>
          <NorthstarLogoMark height={28} maxWidth={120} />
        </header>
        <main className="min-w-0 flex-1 overflow-auto overflow-x-hidden px-4 py-5 sm:px-8 sm:py-6">
          <div className="mb-5 text-xs text-white/40">
            Northstar Industrial Technologies · Board Portal · Confidential · Manchester HQ
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
