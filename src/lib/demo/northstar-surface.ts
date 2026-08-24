import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";

/** Northstar Demo workspace slug (demo.unit311central.com). */
export const NORTHSTAR_DEMO_SLUG = DEMO_WORKSPACE_SLUG;

/** White wordmark for dark sidebar / login chrome. */
export const NORTHSTAR_LOGO_SRC = "/images/workspaces/northstar-logo.png";
/** Flattened JPEG for PDF/print (white background, no transparency artefacts). */
export const NORTHSTAR_LOGO_PRINT_SRC = "/images/workspaces/northstar-logo-print.jpg";
export const NORTHSTAR_LOGO_INTRINSIC_WIDTH = 1774;
export const NORTHSTAR_LOGO_INTRINSIC_HEIGHT = 887;

export function isNorthstarDemoSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "")
    .trim()
    .toLowerCase() === NORTHSTAR_DEMO_SLUG;
}
