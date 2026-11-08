import "server-only";

import {
  classifyPlantationInsertError,
  type PlantationSubmissionInput,
  type PlantationSubmissionRecord,
} from "@/lib/plantation/plantation-challenge";
import { ensurePlantationChallengeSchema } from "@/lib/plantation/plantation-challenge-schema";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

type PlantationRow = {
  id: string;
  participant_name: string;
  section_1_hectares: number | string;
  section_2_hectares: number | string;
  section_1_trees: number | string;
  section_2_trees: number | string;
  submitted_at: string;
};

export type PlantationStoreResult =
  | { ok: true; id: string; submittedAt: string }
  | { ok: false; reason: "duplicate" | "unavailable" | "unknown" };

function requireServiceSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Plantation challenge persistence requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function asNumber(value: number | string): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function mapRow(row: PlantationRow): PlantationSubmissionRecord {
  return {
    id: row.id,
    participantName: row.participant_name,
    normalizedName: row.participant_name.trim().toLowerCase(),
    section1Hectares: asNumber(row.section_1_hectares),
    section2Hectares: asNumber(row.section_2_hectares),
    section1Trees: asNumber(row.section_1_trees),
    section2Trees: asNumber(row.section_2_trees),
    submittedAt: row.submitted_at,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function insertOnce(submission: PlantationSubmissionInput): Promise<PlantationStoreResult> {
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = requireServiceSupabase();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const { data, error } = await supabase
    .from("plantation_challenge_responses")
    .insert({
      participant_name: submission.participantName,
      normalized_name: submission.normalizedName,
      section_1_hectares: submission.section1Hectares,
      section_2_hectares: submission.section2Hectares,
      section_1_trees: submission.section1Trees,
      section_2_trees: submission.section2Trees,
    })
    .select("id, submitted_at")
    .single();

  if (error) {
    const reason = classifyPlantationInsertError(error);
    if (reason !== "unknown") return { ok: false, reason };
    console.error("Plantation challenge insert failed", error.code, error.message);
    return { ok: false, reason: "unknown" };
  }

  return { ok: true, id: data.id, submittedAt: data.submitted_at };
}

export async function insertPlantationSubmission(
  submission: PlantationSubmissionInput,
): Promise<PlantationStoreResult> {
  let result = await insertOnce(submission);
  if (result.ok || result.reason !== "unavailable") return result;

  const ready = await ensurePlantationChallengeSchema();
  if (!ready) return { ok: false, reason: "unavailable" };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    result = await insertOnce(submission);
    if (result.ok || result.reason !== "unavailable") return result;
    await sleep(800 * (attempt + 1));
  }
  return result;
}

export async function listPlantationSubmissions(): Promise<
  { ok: true; submissions: PlantationSubmissionRecord[] } | { ok: false; reason: "unavailable" | "unknown" }
> {
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = requireServiceSupabase();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const { data, error } = await supabase
    .from("plantation_challenge_responses")
    .select(
      "id, participant_name, section_1_hectares, section_2_hectares, section_1_trees, section_2_trees, submitted_at",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    const reason = classifyPlantationInsertError(error);
    if (reason === "unavailable") {
      const ready = await ensurePlantationChallengeSchema();
      if (!ready) return { ok: false, reason: "unavailable" };
      const retry = await supabase
        .from("plantation_challenge_responses")
        .select(
          "id, participant_name, section_1_hectares, section_2_hectares, section_1_trees, section_2_trees, submitted_at",
        )
        .order("submitted_at", { ascending: false });
      if (retry.error) return { ok: false, reason: "unavailable" };
      return { ok: true, submissions: (retry.data ?? []).map((row) => mapRow(row as PlantationRow)) };
    }
    console.error("Plantation challenge list failed", error.code, error.message);
    return { ok: false, reason: "unknown" };
  }

  return { ok: true, submissions: (data ?? []).map((row) => mapRow(row as PlantationRow)) };
}

export async function deletePlantationSubmission(
  id: string,
): Promise<{ ok: true } | { ok: false; reason: "unavailable" | "unknown" | "missing" }> {
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = requireServiceSupabase();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const { data, error } = await supabase
    .from("plantation_challenge_responses")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    const reason = classifyPlantationInsertError(error);
    if (reason === "unavailable") return { ok: false, reason: "unavailable" };
    console.error("Plantation challenge delete failed", error.code, error.message);
    return { ok: false, reason: "unknown" };
  }
  if (!data?.length) return { ok: false, reason: "missing" };
  return { ok: true };
}
