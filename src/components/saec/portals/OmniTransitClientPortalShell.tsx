"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Headphones, LogOut, Menu, Wrench, X } from "lucide-react";

import { OT_HYPROP_NAV, OT_HYPROP_PORTAL } from "@/lib/saec/client-portal-data";
import { OMNITRANSIT_DISPLAY_NAME, OMNITRANSIT_WORKSPACE_LOGO_SRC } from "@/lib/saec-surface";
import { cn } from "@/lib/utils";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  children: React.ReactNode;
};

export function OmniTransitClientPortalShell({
  companyPath,
  companyName,
  displayName,
  children,
}: Props) {
  const pathname = usePathname() || `/${companyPath}`;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const base = `/${companyPath}`;

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* continue */
    }
    window.location.href = base;
  }

  function isActive(href: string) {
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="mb-6 space-y-4 border-b border-slate-200 pb-5">
        <div className="flex items-center justify-between gap-3">
          <Image
            src={OMNITRANSIT_WORKSPACE_LOGO_SRC}
            alt={OMNITRANSIT_DISPLAY_NAME}
            width={180}
            height={36}
            className="h-8 w-auto"
          />
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            Active
          </span>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {companyName}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">Customer service portal</p>
          <p className="mt-1 text-xs text-slate-500">Installations · Maintenance · Support</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {OT_HYPROP_NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm transition",
              isActive(item.href)
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p className="flex items-center gap-2 text-slate-700">
          <Wrench className="h-3.5 w-3.5" />
          {OT_HYPROP_PORTAL.serviceDesk}
        </p>
        <p className="mt-1 flex items-center gap-2">
          <Headphones className="h-3.5 w-3.5" />
          {OT_HYPROP_PORTAL.servicePhone}
        </p>
        <p className="mt-3 truncate text-slate-600">{displayName}</p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 text-slate-900">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw] flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <button
          type="button"
          className="absolute top-4 right-3 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-slate-800">{companyName}</span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
