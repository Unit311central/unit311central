"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
} from "lucide-react";

import TalantonLogoMark from "@/components/layout/TalantonLogoMark";

type Props = {
  companyPath: string;
  companyName: string;
  displayName: string;
  isStaffPreview?: boolean;
  children: React.ReactNode;
};

const NAV = [
  { href: "", label: "Home", icon: Home },
  { href: "/training", label: "Training", icon: GraduationCap },
  { href: "/reports", label: "Reports", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: FileText },
] as const;

export function CompanyPortalShell({
  companyPath,
  companyName,
  displayName,
  isStaffPreview = false,
  children,
}: Props) {
  const pathname = usePathname() || "";
  const publicBase = `/${companyPath}`;
  // After rewrite, pathname is /portfolio-portal/{company}/...
  const relative = pathname.replace(new RegExp(`^/portfolio-portal/${companyPath}`), "") || "";

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* continue */
    }
    window.location.href = `/${companyPath}`;
  }

  return (
    <div className="flex min-h-screen bg-[#07111f] text-white">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a1628] px-4 py-5">
        <div className="mb-6 space-y-3">
          <TalantonLogoMark height={36} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Portfolio Company Portal
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{companyName}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const href = `${publicBase}${item.href}`;
            const active =
              item.href === ""
                ? relative === "" || relative === "/"
                : relative === item.href || relative.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
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
      </aside>

      <main className="min-w-0 flex-1 overflow-auto px-6 py-6 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/40">
          <BookOpen className="h-3.5 w-3.5" />
          Talanton Impact · Company Portal
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
