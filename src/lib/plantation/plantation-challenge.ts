export const PLANTATION_NAME_MAX_LENGTH = 120;
export const PLANTATION_DUPLICATE_MESSAGE =
  "That name has already been submitted. Ask the instructor to remove the earlier entry if you need to submit again.";

export const PLANTATION_METRICS = [
  {
    key: "section1Hectares",
    column: "section_1_hectares",
    label: "Hectare section 1",
    kind: "hectares",
  },
  {
    key: "section2Hectares",
    column: "section_2_hectares",
    label: "Hectare section 2",
    kind: "hectares",
  },
  {
    key: "section1Trees",
    column: "section_1_trees",
    label: "Tree section 1",
    kind: "trees",
  },
  {
    key: "section2Trees",
    column: "section_2_trees",
    label: "Tree section 2",
    kind: "trees",
  },
] as const;

export type PlantationMetricKey = (typeof PLANTATION_METRICS)[number]["key"];

export type PlantationSubmissionInput = {
  participantName: string;
  normalizedName: string;
  section1Hectares: number;
  section2Hectares: number;
  section1Trees: number;
  section2Trees: number;
};

export type PlantationSubmissionRecord = PlantationSubmissionInput & {
  id: string;
  submittedAt: string;
};

export function trimParticipantName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeParticipantName(value: string): string {
  return value.trim().toLowerCase();
}

function parseHectares(value: unknown, label: string): { ok: true; value: number } | { ok: false; message: string } {
  if (typeof value === "string" && value.trim() === "") {
    return { ok: false, message: `Enter the estimated hectare size of ${label}.` };
  }
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100000) {
    return { ok: false, message: `Enter a hectare size for ${label} between 0 and 100000.` };
  }
  const rounded = Math.round(numeric * 10000) / 10000;
  return { ok: true, value: rounded };
}

function parseTrees(value: unknown, label: string): { ok: true; value: number } | { ok: false; message: string } {
  if (typeof value === "string" && value.trim() === "") {
    return { ok: false, message: `Enter the estimated number of palm oil trees in ${label}.` };
  }
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 10000000 || !Number.isInteger(numeric)) {
    return { ok: false, message: `Enter a whole number of palm oil trees for ${label}.` };
  }
  return { ok: true, value: numeric };
}

export function parsePlantationSubmission(
  body: unknown,
): { ok: true; value: PlantationSubmissionInput } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "The form could not be read. Please try again." };
  }
  const record = body as Record<string, unknown>;
  const participantName = trimParticipantName(record.participantName);
  if (!participantName) {
    return { ok: false, message: "Enter your name." };
  }
  if (participantName.length > PLANTATION_NAME_MAX_LENGTH) {
    return { ok: false, message: "Enter a shorter name." };
  }

  const section1Hectares = parseHectares(record.section1Hectares, "section 1");
  if (!section1Hectares.ok) return section1Hectares;
  const section2Hectares = parseHectares(record.section2Hectares, "section 2");
  if (!section2Hectares.ok) return section2Hectares;
  const section1Trees = parseTrees(record.section1Trees, "section 1");
  if (!section1Trees.ok) return section1Trees;
  const section2Trees = parseTrees(record.section2Trees, "section 2");
  if (!section2Trees.ok) return section2Trees;

  return {
    ok: true,
    value: {
      participantName,
      normalizedName: normalizeParticipantName(participantName),
      section1Hectares: section1Hectares.value,
      section2Hectares: section2Hectares.value,
      section1Trees: section1Trees.value,
      section2Trees: section2Trees.value,
    },
  };
}

export function classifyPlantationInsertError(error: {
  code?: string | null;
  message?: string | null;
}): "duplicate" | "unavailable" | "unknown" {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (code === "23505" || message.includes("normalized_name") || message.includes("duplicate key")) {
    return "duplicate";
  }
  if (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  ) {
    return "unavailable";
  }
  return "unknown";
}

export function rankPlantationSubmissions(
  submissions: readonly PlantationSubmissionRecord[],
  key: PlantationMetricKey,
): PlantationSubmissionRecord[] {
  return [...submissions].sort((left, right) => {
    const difference = right[key] - left[key];
    if (difference !== 0) return difference;
    return left.participantName.localeCompare(right.participantName);
  });
}

/** Bar length as a percentage of the largest value in that estimate. */
export function plantationBarPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0 || value <= 0) return 0;
  return Math.min(100, (value / max) * 100);
}

export function formatPlantationHectares(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

export function formatPlantationTrees(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.trunc(value));
}

export function formatPlantationSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
