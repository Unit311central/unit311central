/**
 * Human-readable EA artifact titles and download filenames.
 * Internal artifact IDs and storage paths stay unchanged.
 */

export function eaPdfFilename(label: string): string {
  const base = label.trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
  if (!base) return "Document.pdf";
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
}

export function eaPptxFilename(label: string): string {
  const base = label.trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
  if (!base) return "Document.pptx";
  return /\.pptx$/i.test(base) ? base : `${base}.pptx`;
}

export function formatEaMeetingDateLabel(meetingDateIso: string): string {
  const normalized = meetingDateIso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const d = new Date(`${normalized}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }
  return normalized;
}

function workspacePrefix(
  slug: string | null | undefined,
  organisationName: string | null | undefined,
): string {
  if (slug === "abhi") return "ABHI";
  if (slug === "onwardair") return "OnwardAir";
  if (slug === "talantonimpact") return "Talanton Impact";
  const org = organisationName?.trim();
  if (org) return org;
  return "Organisation";
}

export function boardPackPdfArtifactLabels(input: {
  workspaceSlug?: string | null;
  organisationName?: string | null;
  meetingDate: string;
}): { title: string; filename: string } {
  const prefix = workspacePrefix(input.workspaceSlug, input.organisationName);
  const dateLabel = formatEaMeetingDateLabel(input.meetingDate);
  const title = `${prefix} Board Deck — ${dateLabel}`;
  return { title, filename: eaPdfFilename(title) };
}

export function boardPackPptxArtifactLabels(input: {
  workspaceSlug?: string | null;
  organisationName?: string | null;
  meetingDate: string;
}): { title: string; filename: string } {
  const { title: pdfTitle } = boardPackPdfArtifactLabels(input);
  const title = `${pdfTitle} (PowerPoint)`;
  return { title, filename: eaPptxFilename(title) };
}

export function abhiRegulatoryImpactArtifactLabels(input: {
  region: "UK" | "all";
  months: number;
}): { title: string; filename: string } {
  const regionPart = input.region === "UK" ? "UK Members" : "All Members";
  const periodPart = input.months === 6 ? "Past 6 Months" : `Past ${input.months} Months`;
  const title = `ABHI Regulatory Impact Report — ${regionPart} — ${periodPart}`;
  return { title, filename: eaPdfFilename(title) };
}

export function abhiFinancialDeltaArtifactLabels(input: {
  currentQuarterLabel: string;
  priorQuarterLabel: string;
}): { title: string; filename: string } {
  const title = `ABHI Financial Delta Report — ${input.currentQuarterLabel} vs ${input.priorQuarterLabel}`;
  return { title, filename: eaPdfFilename(title) };
}

export function projectHealthArtifactLabels(
  workspaceSlug?: string | null,
  organisationName?: string | null,
): { title: string; filename: string } {
  const prefix = workspacePrefix(workspaceSlug, organisationName);
  const title = `${prefix} Project Health Report — Active Projects`;
  return { title, filename: eaPdfFilename(title) };
}

export function platformAccessArtifactLabels(
  workspaceSlug?: string | null,
  organisationName?: string | null,
): { title: string; filename: string } {
  const prefix = workspacePrefix(workspaceSlug, organisationName);
  const title = `${prefix} Platform Users & Access Report`;
  return { title, filename: eaPdfFilename(title) };
}

/** Prefer human title over internal filename for UI labels. */
export function eaArtifactDisplayName(artifact: {
  title?: string;
  filename: string;
}): string {
  const title = artifact.title?.trim();
  if (title && !/^art_/i.test(title)) return title;
  return artifact.filename.replace(/\.(pdf|pptx)$/i, "").trim() || "Document";
}
