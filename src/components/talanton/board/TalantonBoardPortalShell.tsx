"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Shield } from "lucide-react";

import TalantonLogoMark from "@/components/layout/TalantonLogoMark";
import { TI_BOARD_NAV } from "@/lib/talanton/board-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  displayName: string;
  children: React.ReactNode;
};

export function TalantonBoardPortalShell({ displayName, children }: Props) {
  const pathname = usePathname() || "/board";

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* continue */
    }
    window.location.href = "/board";
  }

  function isActive(href: string) {
    if (href === "/board") return pathname === "/board" || pathname === "/board/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen bg-[#07111f] text-white">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a1628] px-4 py-5">
        <div className="mb-6 space-y-3">
          <TalantonLogoMark height={36} />
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              <Shield className="h-3 w-3" />
              Board Portal
            </p>
            <p className="mt-1 text-sm font-semibold text-white">Talanton Impact Board</p>
            <p className="mt-0.5 text-xs text-white/45">Secure · Read-only</p>
          </div>
        </div>

        <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Board
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {TI_BOARD_NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition",
                isActive(item.href)
                  ? "bg-emerald-500/20 text-emerald-200"
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
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto px-6 py-6 sm:px-8">
        <div className="mb-6 text-xs text-white/40">
          Talanton Impact · Board Portal · Confidential
        </div>
        {children}
      </main>
    </div>
  );
}
