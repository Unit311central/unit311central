"use client";

import { useLayoutEffect, useState } from "react";

import CorpCentreLogoMark, {
  isCorpCentreSlug,
} from "@/components/layout/CorpCentreLogoMark";
import AbhiLogoMark, { isAbhiSlug } from "@/components/layout/AbhiLogoMark";
import NorthstarLogoMark, { isNorthstarDemoSlug } from "@/components/layout/NorthstarLogoMark";
import OnwardAirLogoMark, { isOnwardAirSlug } from "@/components/layout/OnwardAirLogoMark";
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
  if (!match) {
    if (host.endsWith(".localhost") && host !== "localhost") {
      return host.split(".")[0] || null;
    }
    return null;
  }
  const slug = match[1];
  if (slug === "www" || slug === "app" || slug === "login") return null;
  return slug;
}

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type BrandKind =
  | "unit311"
  | "northstar"
  | "corpcentre"
  | "talanton"
  | "abhi"
  | "onwardair"
  | "customer";

function resolveBrandKind(slug: string | null): BrandKind {
  if (!slug || slug === "internal" || slug === "unit311") {
    return "unit311";
  }
  if (isNorthstarDemoSlug(slug)) return "northstar";
  if (isCorpCentreSlug(slug)) return "corpcentre";
  if (isTalantonImpactSlug(slug)) return "talanton";
  if (isAbhiSlug(slug)) return "abhi";
  if (isOnwardAirSlug(slug)) return "onwardair";
  return "customer";
}

/**
 * Sidebar brand — tenant logos / workspace name on customer hosts.
 * Resolved on the client after mount so SSR never locks Unit311 branding on tenants.
 */
export default function WorkspaceSidebarBrand({
  className,
  href = "/",
}: WorkspaceSidebarBrandProps) {
  // Start unset so SSR/first paint never flashes Unit311 on customer hosts.
  const [brand, setBrand] = useState<BrandKind | null>(null);
  const [customerName, setCustomerName] = useState("Workspace");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useLayoutEffect(() => {
    const slug = hostWorkspaceSlug();
    const kind = resolveBrandKind(slug);
    setBrand(kind);
    if (kind === "customer" && slug) {
      setCustomerName(titleCaseSlug(slug));
      try {
        const cached = window.sessionStorage.getItem("unit311-whoami-workspace-name");
        if (cached?.trim()) setCustomerName(cached.trim());
      } catch {
        /* ignore */
      }
      void fetch("/api/auth/whoami", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { workspaceName?: string | null; workspaceLogoUrl?: string | null } | null) => {
          if (!data) return;
          if (data.workspaceName?.trim()) {
            setCustomerName(data.workspaceName.trim());
            try {
              window.sessionStorage.setItem(
                "unit311-whoami-workspace-name",
                data.workspaceName.trim(),
              );
            } catch {
              /* ignore */
            }
          }
          if (data.workspaceLogoUrl?.trim()) {
            setLogoUrl(data.workspaceLogoUrl.trim());
          }
        })
        .catch(() => undefined);
    }
  }, []);

  if (!brand) {
    return (
      <a
        href={href}
        className={cn(
          "inline-flex h-8 max-w-full shrink-0 items-center overflow-hidden",
          className,
        )}
        aria-label="Home"
      >
        <span className="inline-block h-5 w-28 rounded bg-white/10" aria-hidden />
      </a>
    );
  }

  const content =
    brand === "corpcentre" ? (
      <CorpCentreLogoMark className={className} height={32} />
    ) : brand === "talanton" ? (
      <TalantonLogoMark height={36} />
    ) : brand === "abhi" ? (
      <AbhiLogoMark height={32} tone="onDark" />
    ) : brand === "onwardair" ? (
      <OnwardAirLogoMark height={32} maxWidth={184} />
    ) : brand === "northstar" ? (
      <NorthstarLogoMark height={40} maxWidth={230} />
    ) : brand === "customer" ? (
      logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={customerName}
          className="h-8 w-auto max-w-[180px] object-contain object-left"
        />
      ) : (
        <span className="truncate text-[15px] font-semibold tracking-tight text-white">
          {customerName}
        </span>
      )
    ) : (
      <Unit311CentralWordmark variant="sidebar" className={className} />
    );

  const ariaLabel =
    brand === "corpcentre"
      ? "Corp.Centre home"
      : brand === "talanton"
        ? "Talanton Impact home"
        : brand === "abhi"
          ? "ABHI home"
          : brand === "onwardair"
            ? "OnwardAir home"
            : brand === "northstar"
              ? "Northstar Industrial Technologies home"
              : brand === "customer"
              ? `${customerName} home`
              : "Unit311 Central home";

  return (
    <a
      href={href}
      className={cn(
        "inline-flex max-w-full shrink-0 items-center overflow-visible transition-opacity duration-100 hover:opacity-90",
        brand === "abhi" && "w-full justify-center",
        className,
      )}
      aria-label={ariaLabel}
    >
      {content}
    </a>
  );
}
