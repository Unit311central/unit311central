import { buildRunStepRows, mapDbSop, sopToDbInsert } from "@/lib/engineering-sop/mappers";
import { buildNorthstarEngineeringSopCatalogue } from "@/lib/engineering-sop/northstar-seed";
import { canRunEngSop } from "@/lib/engineering-sop-data";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export type EngineeringSopStarterCatalogueResult = {
  workspaceId: string;
  inserted: number;
  skipped: boolean;
  runsCreated: number;
};

/**
 * Idempotent workspace bootstrap for Engineering SOPs.
 * Seeds representative starter catalogue when a workspace has no SOP rows yet.
 */
export async function ensureEngineeringSopStarterCatalogue(
  workspaceId: string,
): Promise<EngineeringSopStarterCatalogueResult> {
  const db = createTenancyServerClient();
  const { count, error: countError } = await db
    .from("engineering_sops")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    return { workspaceId, inserted: 0, skipped: true, runsCreated: 0 };
  }

  const catalogue = buildNorthstarEngineeringSopCatalogue();
  const legacyIdMap = new Map<string, string>();
  let inserted = 0;

  for (const sop of catalogue) {
    const payload = {
      ...sopToDbInsert(workspaceId, sop),
      status: sop.status === "Obsolete" ? "Retired" : sop.status,
    };
    const { data, error } = await db.from("engineering_sops").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    legacyIdMap.set(sop.id, data.id);
    inserted += 1;
  }

  for (const sop of catalogue) {
    if (!sop.supersedesId) continue;
    const newId = legacyIdMap.get(sop.id);
    const supersedesId = legacyIdMap.get(sop.supersedesId);
    if (newId && supersedesId) {
      await db.from("engineering_sops").update({ supersedes_id: supersedesId }).eq("id", newId);
    }
  }

  let runsCreated = 0;
  const approved = catalogue.filter((s) => canRunEngSop(s) && !s.isTemplate).slice(0, 3);
  for (const [index, seed] of approved.entries()) {
    const sopId = legacyIdMap.get(seed.id);
    if (!sopId) continue;
    const { data: sopRow } = await db.from("engineering_sops").select("*").eq("id", sopId).single();
    if (!sopRow) continue;
    const sop = mapDbSop(sopRow);
    const runner = index === 0 ? "Jordan Blake" : index === 1 ? "Alex Chen" : "Morgan Patel";
    const status = index === 2 ? "completed" : "in_progress";
    const { data: runRow, error: runError } = await db
      .from("engineering_sop_runs")
      .insert({
        workspace_id: workspaceId,
        sop_id: sopId,
        sop_version: sop.version,
        started_by: runner,
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        sign_off: status === "completed" ? { signedBy: runner, signedAt: new Date().toISOString(), comment: "" } : null,
      })
      .select("*")
      .single();
    if (runError) throw new Error(runError.message);
    const stepRows = buildRunStepRows(workspaceId, runRow.id, sop, runner).map((row, stepIndex) => {
      if (status === "completed") {
        return {
          ...row,
          status: "completed",
          outcome: "pass" as const,
          completed_by: runner,
          completed_at: new Date().toISOString(),
        };
      }
      if (index === 0 && stepIndex === 0) {
        return {
          ...row,
          status: "completed",
          outcome: "pass" as const,
          completed_by: runner,
          completed_at: new Date().toISOString(),
        };
      }
      if (index === 0 && stepIndex === 1) {
        return { ...row, due_at: new Date(Date.now() - 86400000).toISOString() };
      }
      return row;
    });
    const { error: stepError } = await db.from("engineering_sop_run_steps").insert(stepRows);
    if (stepError) throw new Error(stepError.message);
    runsCreated += 1;
  }

  return { workspaceId, inserted, skipped: false, runsCreated };
}
