"use client";

import { useEffect, useState } from "react";

import CorpCentreLogoMark, {
  isCorpCentreSlug,
} from "@/components/layout/CorpCentreLogoMark";
import Unit311CentralWordmark from "@/components/layout/Unit311CentralWordmark";
import { cn } from "@/lib/utils";

type WorkspaceSidebarBrandProps = {
  className?: string;
  href?: string;
};

function hostWorkspaceSlug(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (!match) return null;
  const slug = match[1];
  if (slug === "www" || slug === "app" || slug === "login") return null;
  return slug;
}

/**
 * Sidebar brand — Corp.Centre logo ONLY on corpcentre host.
 * Internal / demo / all other hosts keep the Unit311 Central wordmark unchanged.
 */
export default function WorkspaceSidebarBrand({
  className,
  href = "/",
}: WorkspaceSidebarBrandProps) {
  const [isCorpCentre, setIsCorpCentre] = useState(false);

  useEffect(() => {
    const hostSlug = hostWorkspaceSlug();
    if (
      !hostSlug ||
      hostSlug === "internal" ||
      hostSlug === "unit311" ||
      hostSlug === "demo"
    ) {
      return;
    }
    if (isCorpCentreSlug(hostSlug)) {
      setIsCorpCentre(true);
    }
  }, []);

  const content = isCorpCentre ? (
    <CorpCentreLogoMark className={className} height={32} />
  ) : (
    <Unit311CentralWordmark variant="sidebar" className={className} />
  );

  return (
    <a
      href={href}
      className={cn("inline-flex shrink-0 transition-opacity duration-100 hover:opacity-90", className)}
      aria-label={isCorpCentre ? "Corp.Centre home" : "Unit311 Central home"}
    >
      {content}
    </a>
  );
}
