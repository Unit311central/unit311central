/**
 * Content Studio EA tools — bridge to central approved templates/media.
 */

import {
  CONTENT_STUDIO_FUNCTIONS,
  getContentStudioTemplates,
} from "@/lib/central-capabilities/content-studio-placeholder";
import type { AssistantToolExecutionContext } from "./tool-result";
import { toolOk } from "./tool-result";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function inferFunctionId(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\bhr\b|human resources|people/.test(lower)) return "hr";
  if (/\bmanagement|weekly|executive/.test(lower)) return "management";
  if (/\bsales|pipeline|proposal/.test(lower)) return "sales";
  if (/\bmarketing|campaign/.test(lower)) return "marketing";
  if (/\bproject/.test(lower)) return "projects";
  if (/\bfundraising|investor/.test(lower)) return "fundraising";
  return "management";
}

export async function contentStudioListTemplates(
  args: Record<string, unknown>,
  _ctx: AssistantToolExecutionContext,
) {
  const query = asString(args.query).toLowerCase();
  const functionId = asString(args.functionId) || inferFunctionId(query);
  const templates = getContentStudioTemplates(functionId);
  const filtered = query
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query),
      )
    : templates;

  const categories = CONTENT_STUDIO_FUNCTIONS.map((f) => f.label).join(", ");

  return toolOk(
    "contentStudioListTemplates",
    filtered.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      functionId,
    })),
    {
      source: ["content-studio:templates"],
      summary: {
        matched: filtered.length,
        message:
          filtered.length > 0
            ? `Found ${filtered.length} approved Content Studio template${filtered.length === 1 ? "" : "s"} in ${functionId}. Categories available: ${categories}.`
            : `No approved templates matched. Content Studio categories: ${categories}.`,
      },
    },
  );
}

export async function contentStudioCreateDeck(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const prompt = asString(args.prompt);
  const functionId = inferFunctionId(prompt);
  const templates = getContentStudioTemplates(functionId);
  const weekly = templates.find((t) => /weekly|management|general/i.test(t.name)) ?? templates[0];

  if (!weekly) {
    return toolOk("contentStudioCreateDeck", [], {
      source: ["content-studio:create"],
      summary: {
        message:
          "Content Studio is available but no approved template was found for that request. Open Business Productivity → Content Studio to browse templates.",
      },
    });
  }

  return toolOk(
    "contentStudioCreateDeck",
    [
      {
        templateId: weekly.id,
        templateName: weekly.name,
        functionId,
        workspace: ctx.business.workspace.slug,
      },
    ],
    {
      source: ["content-studio:create"],
      summary: {
        message: `Prepared a Content Studio deck using the approved template "${weekly.name}" (${functionId}). Open Business Productivity → Content Studio to customise and export.`,
      },
      followUpActions: [
        {
          id: "open_content_studio",
          label: "Open Content Studio",
          kind: "navigate",
          href: "/?view=content-studio",
        },
      ],
    },
  );
}
