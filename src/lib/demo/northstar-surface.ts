import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";

/** Northstar Demo workspace slug (demo.unit311central.com). */
export const NORTHSTAR_DEMO_SLUG = DEMO_WORKSPACE_SLUG;

/** White wordmark for dark sidebar / login chrome. */
export const NORTHSTAR_LOGO_SRC = "/images/workspaces/northstar-logo.png";
export const NORTHSTAR_LOGO_INTRINSIC_WIDTH = 1774;
export const NORTHSTAR_LOGO_INTRINSIC_HEIGHT = 887;

export function isNorthstarDemoSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "")
    .trim()
    .toLowerCase() === NORTHSTAR_DEMO_SLUG;
}
