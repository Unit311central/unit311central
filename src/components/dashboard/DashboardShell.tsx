"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import {
  DashboardDataProvider,
  type DashboardVariant,
} from "./dashboard-data-context";

type DashboardShellProps = {
  children: React.ReactNode;
  basePath?: string;
  homeHref?: string;
  brand?: "logo" | "westport" | "venturi";
  backLabel?: string;
  variant?: DashboardVariant;
};

export default function DashboardShell({
  children,
  basePath = "/test1",
  homeHref = "/test1",
  brand = "logo",
  backLabel,
  variant = "default",
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DashboardDataProvider variant={variant}>
      <div className="flex h-full min-h-0 w-full">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#07111F]/80 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        basePath={basePath}
        homeHref={homeHref}
        brand={brand}
        backLabel={backLabel}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#07111F]">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        {children}
      </div>
    </div>
    </DashboardDataProvider>
  );
}
