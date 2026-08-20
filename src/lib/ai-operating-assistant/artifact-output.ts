/**
 * Unified artifact extraction for acceptance + live chat parity.
 */

import type { EaOrchestrationResult } from "@/lib/central-application-model/orchestrate";

import type { AssistantChatMessage } from "./types";
import type { AssistantToolResult } from "./tool-result";

export function collectArtifactsFromToolResult(
  result: AssistantToolResult,
): NonNullable<AssistantChatMessage["artifacts"]> {
  if (result.status !== "ok") return [];

  const summary = result.summary as Record<string, unknown> | undefined;
  const items = result.items as Array<Record<string, unknown>> | undefined;
  const artifactId =
    (typeof summary?.artifactId === "string" && summary.artifactId) ||
    (typeof items?.[0]?.artifactId === "string" && String(items[0].artifactId)) ||
    null;

  if (!artifactId) return [];

  const artifactItems = Array.isArray(items)
    ? items.filter(
        (item) => item && typeof item === "object" && typeof item.artifactId === "string",
      )
    : [];

  if (artifactItems.length > 0) {
    return artifactItems.map((item) => {
      const id = String(item.artifactId);
      const kindRaw = String(item.kind ?? "pdf");
      const kind =
        kindRaw === "pptx" || kindRaw === "file" || kindRaw === "pdf" ? kindRaw : "pdf";
      const title = (typeof item.title === "string" && item.title) || "Document";
      const filename =
        (typeof item.filename === "string" && item.filename) ||
        (typeof summary?.filename === "string" && summary.filename) ||
        `${title}.pdf`;
      const downloadUrl =
        (typeof item.downloadUrl === "string" && item.downloadUrl) ||
        `/api/executive-assistant/artifacts/${id}?disposition=attachment`;
      const openUrl =
        (typeof item.openUrl === "string" && item.openUrl) ||
        `/api/executive-assistant/artifacts/${id}?disposition=inline`;
      return {
        id,
        kind,
        title,
        filename,
        downloadUrl,
        openUrl,
        contentBase64:
          typeof item.contentBase64 === "string" ? item.contentBase64 : undefined,
      };
    });
  }

  const filename =
    (typeof summary?.filename === "string" && summary.filename) || "document.pdf";
  return [
    {
      id: artifactId,
      kind: "pdf",
      title: filename.replace(/\.pdf$/i, ""),
      filename,
      downloadUrl: `/api/executive-assistant/artifacts/${artifactId}?disposition=attachment`,
      openUrl: `/api/executive-assistant/artifacts/${artifactId}?disposition=inline`,
    },
  ];
}

export function collectArtifactsFromToolResults(
  toolResults: AssistantToolResult[],
): NonNullable<AssistantChatMessage["artifacts"]> {
  const artifacts: NonNullable<AssistantChatMessage["artifacts"]> = [];
  const seen = new Set<string>();
  for (const result of toolResults) {
    for (const artifact of collectArtifactsFromToolResult(result)) {
      if (seen.has(artifact.id)) continue;
      seen.add(artifact.id);
      artifacts.push(artifact);
    }
  }
  return artifacts;
}

export type AdaptedExecutiveOutput = {
  text: string;
  responseBlocks?: import("./capabilities/types").EaResponseBlock[];
  followUpActions?: AssistantChatMessage["followUpActions"];
  artifacts: NonNullable<AssistantChatMessage["artifacts"]>;
  artifactIds: string[];
};

export function adaptExecutiveOrchestrationResult(
  executed: EaOrchestrationResult,
): AdaptedExecutiveOutput {
  const artifacts = collectArtifactsFromToolResults(executed.toolResults);
  return {
    text: executed.answer.text,
    responseBlocks: executed.answer.blocks,
    followUpActions: executed.answer.followUpActions,
    artifacts,
    artifactIds: artifacts.map((a) => a.id),
  };
}
