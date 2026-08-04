"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

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

  return (
    <div className="flex min-h-screen bg-[#061018] text-white">
      <aside className="flex w-[16.5rem] shrink-0 flex-col border-r border-white/10 bg-[#0a1822] px-3 py-5">
        <div className="mb-6 space-y-3 px-1">
          <OnwardAirLogoMark height={36} maxWidth={180} />
          {companyLogoSrc ? (
            <span className="inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-white px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={companyLogoSrc}
                alt={companyName}
                className="h-8 w-auto max-w-full object-contain"
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
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm transition",
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
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">{children}</main>
    </div>
  );
}
