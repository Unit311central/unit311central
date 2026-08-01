"use client";

import { useState } from "react";

import CorpCentreLogoMark, {
  isCorpCentreSlug,
} from "@/components/layout/CorpCentreLogoMark";
import TalantonLogoMark, {
  isTalantonImpactSlug,
} from "@/components/layout/TalantonLogoMark";
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

type BrandKind = "unit311" | "corpcentre" | "talanton";

function resolveBrand(): BrandKind {
  const hostSlug = hostWorkspaceSlug();
  if (
    !hostSlug ||
    hostSlug === "internal" ||
    hostSlug === "unit311" ||
    hostSlug === "demo"
  ) {
    return "unit311";
  }
  if (isCorpCentreSlug(hostSlug)) return "corpcentre";
  if (isTalantonImpactSlug(hostSlug)) return "talanton";
  return "unit311";
}

/**
 * Sidebar brand — tenant logos only on their hosts.
 * Internal / demo / all other hosts keep the Unit311 Central wordmark unchanged.
 */
export default function WorkspaceSidebarBrand({
  className,
  href = "/",
}: WorkspaceSidebarBrandProps) {
  const [brand] = useState<BrandKind>(() => resolveBrand());

  const content =
    brand === "corpcentre" ? (
      <CorpCentreLogoMark className={className} height={32} />
    ) : brand === "talanton" ? (
      <TalantonLogoMark height={36} />
    ) : (
      <Unit311CentralWordmark variant="sidebar" className={className} />
    );

  const ariaLabel =
    brand === "corpcentre"
      ? "Corp.Centre home"
      : brand === "talanton"
        ? "Talanton Impact home"
        : "Unit311 Central home";

  return (
    <a
      href={href}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center overflow-visible transition-opacity duration-100 hover:opacity-90",
        className,
      )}
      aria-label={ariaLabel}
    >
      {content}
    </a>
  );
}
