"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, Download, Menu, Search } from "lucide-react";
import { useDashboardData } from "./dashboard-data-context";

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const { project } = useDashboardData();
  const breadcrumb = project.breadcrumb ?? project.client;
  const avatarInitials = project.avatarInitials ?? project.client.slice(0, 2).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#07111F]/90 px-4 backdrop-blur-xl sm:h-16 sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-white/40 sm:gap-2 sm:text-sm">
          <span className="shrink-0">{breadcrumb}</span>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-white/75">{project.name}</span>
        </div>
        <Badge variant="info" className="hidden shrink-0 sm:inline-flex">
          Live
        </Badge>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div className="hidden items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0D1B2A] px-4 py-2 md:flex">
          <Search className="h-4 w-4 text-white/30" />
          <span className="text-sm text-white/35">Search intelligence…</span>
          <kbd className="rounded-lg border border-white/[0.08] bg-[#07111F] px-2 py-0.5 font-mono text-[10px] text-white/30">
            ⌘K
          </kbd>
        </div>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl sm:h-10 sm:w-10">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </Button>
        <Button variant="secondary" size="sm" className="hidden rounded-2xl sm:inline-flex">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-[#0D1B2A] text-[11px] font-medium sm:h-9 sm:w-9 sm:text-xs">
          {avatarInitials}
        </div>
      </div>
    </header>
  );
}
