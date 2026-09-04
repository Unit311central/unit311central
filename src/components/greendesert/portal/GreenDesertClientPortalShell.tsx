"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";

import GreenDesertLogoMark from "@/components/layout/GreenDesertLogoMark";
import { GREENDESERT_CLIENT_NAV } from "@/lib/greendesert/client-portal-data";
import { GREENDESERT_DISPLAY_NAME } from "@/lib/greendesert-surface";
import { cn } from "@/lib/utils";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  children: React.ReactNode;
};

export function GreenDesertClientPortalShell({
  companyPath,
  companyName,
  displayName,
  children,
}: Props) {
  const pathname = usePathname() || `/${companyPath}`;
  const base = `/${companyPath}`;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* continue */
    }
    window.location.href = `/${companyPath}/login`;
  }

  function isActive(hrefSuffix: string) {
    const href = hrefSuffix ? `${base}${hrefSuffix}` : base;
    if (!hrefSuffix) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="mb-6 space-y-3">
        <div className="inline-flex rounded-xl bg-white px-3 py-2">
          <GreenDesertLogoMark height={48} maxWidth={120} />
        </div>
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <Shield className="h-3 w-3" />
            Client Portal
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{companyName}</p>
          <p className="mt-0.5 text-xs text-white/45">Secure access</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {GREENDESERT_CLIENT_NAV.map((item) => (
          <Link
            key={item.id}
            href={`${base}${item.hrefSuffix}`}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm transition",
              isActive(item.hrefSuffix)
                ? "bg-emerald-500/20 text-emerald-100"
                : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="truncate px-1 text-xs text-white/45">{displayName}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-[#041208] text-white">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#071a0e] px-4 py-5 transition-transform lg:static lg:translate-x-0",
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <p className="truncate text-sm font-semibold">{companyName}</p>
        </header>
        <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-8">
          <div className="mb-5 text-xs text-white/40">
            {companyName} · {GREENDESERT_DISPLAY_NAME} Client Portal
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
