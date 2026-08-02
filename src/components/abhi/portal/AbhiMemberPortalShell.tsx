"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import AbhiLogoMark from "@/components/layout/AbhiLogoMark";
import {
  ABHI_MEMBER_NAV,
  memberPortalHref,
} from "@/lib/abhi/member-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  isStaffPreview?: boolean;
  children: React.ReactNode;
};

export function AbhiMemberPortalShell({
  companyPath,
  companyName,
  displayName,
  isStaffPreview = false,
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
    const href = memberPortalHref(companyPath, hrefSuffix);
    if (!hrefSuffix) {
      return pathname === `/${companyPath}` || pathname === `/${companyPath}/`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen bg-[#07111f] text-white">
      <aside className="flex w-[16.5rem] shrink-0 flex-col border-r border-white/10 bg-[#0a1628] px-3 py-5">
        <div className="mb-6 space-y-3 px-1">
          <AbhiLogoMark height={34} tone="onDark" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              ABHI Member Portal
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-white">{companyName}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {ABHI_MEMBER_NAV.map((group) => (
            <div key={group.id}>
              {group.label ? (
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  {group.label}
                </p>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const href = memberPortalHref(companyPath, item.hrefSuffix);
                  const active = isActive(item.hrefSuffix);
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm transition",
                        active
                          ? "bg-[#C2185B]/25 text-[#f4a6c4]"
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
          <p className="px-1 text-[10px] uppercase tracking-wide text-white/30">Member</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto px-5 py-5 sm:px-8 sm:py-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-white/40">
          ABHI · Member Portal
          {isStaffPreview ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
              Staff preview
            </span>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
