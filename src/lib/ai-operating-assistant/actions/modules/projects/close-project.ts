import {
  getProject,
  listProjects,
  updateProject,
  type ProjectsWorkspaceScope,
} from "@/lib/internal-projects-service";
import type { AssistantActionDefinition } from "../../types";
import type { AssistantBusinessContext } from "../../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function projectsScope(business: AssistantBusinessContext): ProjectsWorkspaceScope {
  return { workspaceId: business.workspace.id?.trim() || null };
}

async function resolveProject(input: Record<string, unknown>, scope: ProjectsWorkspaceScope) {
  const projectId = asTrimmedString(input.projectId);
  const projectName = asTrimmedString(input.projectName || input.name);
  if (projectId) {
    try {
      const project = await getProject(projectId, scope);
      return { ok: true as const, project };
    } catch {
      return { ok: false as const, errors: [`Project id “${projectId}” not found.`] };
    }
  }
  if (!projectName) {
    return { ok: false as const, errors: ["Provide a project name or projectId."] };
  }
  const projects = await listProjects(scope);
  const key = projectName.toLowerCase();
  const matches = projects.filter((p) => p.name.toLowerCase().includes(key));
  if (matches.length === 0) {
    return { ok: false as const, errors: [`No project found matching “${projectName}”.`] };
  }
  if (matches.length > 1) {
    const exact = matches.find((p) => p.name.toLowerCase() === key);
    if (exact) return { ok: true as const, project: exact };
    return {
      ok: false as const,
      errors: [
        `Multiple projects match “${projectName}”: ${matches
          .slice(0, 5)
          .map((p) => p.name)
          .join(", ")}.`,
      ],
    };
  }
  return { ok: true as const, project: matches[0]! };
}

export const closeProjectAction: AssistantActionDefinition = {
  id: "projects.closeProject",
  name: "Close project",
  description:
    "Mark a project completed (phase → completed, progress 100%). Use for close/finish completed work.",
  module: "projects",
  requiredPermissions: ["authenticated"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: true,
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string" },
      projectName: { type: "string" },
      name: { type: "string" },
      notes: { type: "string" },
    },
  },
  capability: {
    id: "projects.close",
    businessObject: "Project",
    intentExamples: [
      "Close the completed intranet redesign project",
      "Mark the Coastal LiDAR project complete",
      "Finish the Harbour Mapping delivery",
    ],
    semanticAliases: [
      "close",
      "complete",
      "finish",
      "project",
      "completed",
      "done",
    ],
    entityExtraction: {
      primaryNameFields: ["projectName", "name"],
      fields: [
        { field: "projectName", from: "named_entity" },
        { field: "name", from: "named_entity" },
      ],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Project closed.\n\nName\n{recordLabel}",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
    suggestedFollowUps: [],
    relationships: { suggestedNext: [] },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      const resolved = await resolveProject(input, projectsScope(ctx.business));
      if (!resolved.ok) return { ok: false, errors: resolved.errors, warnings: [] };
      if (resolved.project.phase === "completed") {
        return {
          ok: false,
          errors: [`“${resolved.project.name}” is already completed.`],
          warnings: [],
        };
      }
      return { ok: true, errors: [], warnings: [] };
    },

    async preview(input, ctx) {
      const resolved = await resolveProject(input, projectsScope(ctx.business));
      if (!resolved.ok) {
        return {
          summary: "Close project (not found)",
          affectedRecords: [],
          warnings: resolved.errors,
          reversible: true,
        };
      }
      return {
        summary: `Close “${resolved.project.name}” (${resolved.project.phase} → completed)`,
        affectedRecords: [
          {
            type: "project",
            id: resolved.project.id,
            label: resolved.project.name,
            change: `${resolved.project.phase} → completed`,
          },
        ],
        warnings: [],
        reversible: true,
      };
    },

    async execute(input, ctx) {
      const scope = projectsScope(ctx.business);
      const resolved = await resolveProject(input, scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" "), data: {} };
      }
      const today = new Date().toISOString().slice(0, 10);
      const noteExtra = asTrimmedString(input.notes);
      const notes = [resolved.project.notes, noteExtra, `Closed via EA ${today}`]
        .filter(Boolean)
        .join("\n");
      const updated = await updateProject(
        resolved.project.id,
        {
          phase: "completed",
          progressPct: 100,
          endDate: resolved.project.endDate || today,
          notes,
        },
        scope,
      );
      return {
        ok: true,
        message: `Project “${updated.name}” marked completed.`,
        data: {
          recordId: updated.id,
          recordLabel: updated.name,
          previousPhase: resolved.project.phase,
          previousProgressPct: resolved.project.progressPct,
          previousEndDate: resolved.project.endDate,
          previousNotes: resolved.project.notes,
        },
      };
    },

    async rollback(input, ctx, prior) {
      const scope = projectsScope(ctx.business);
      const resolved = await resolveProject(input, scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" "), data: {} };
      }
      const previousPhase = asTrimmedString(prior?.previousPhase) || "live";
      const updated = await updateProject(
        resolved.project.id,
        {
          phase: previousPhase as "live" | "upcoming" | "completed",
          progressPct: Number(prior?.previousProgressPct ?? 0),
          endDate:
            prior?.previousEndDate === undefined
              ? resolved.project.endDate
              : (prior.previousEndDate as string | null),
          notes:
            prior?.previousNotes === undefined
              ? resolved.project.notes
              : (prior.previousNotes as string | null),
        },
        scope,
      );
      return {
        ok: true,
        message: `Restored project “${updated.name}”.`,
        data: { recordId: updated.id, recordLabel: updated.name },
      };
    },
  },
};
