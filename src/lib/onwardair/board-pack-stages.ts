/** Client-safe OnwardAir Board Deck generation stage labels. */

export const OA_BOARD_PACK_STAGES = [
  { id: "actions", label: "Reviewing previous board actions" },
  { id: "risk", label: "Analysing programme risk register" },
  { id: "kpi", label: "Analysing Vertex / FLEX Pod KPIs" },
  { id: "finance", label: "Analysing cash runway & capital" },
  { id: "fundraising", label: "Analysing Seed raise pipeline" },
  { id: "eng", label: "Reviewing engineering & certification" },
  { id: "strategy", label: "Identifying strategic discussion topics" },
  { id: "pptx", label: "Creating PowerPoint presentation" },
  { id: "final", label: "Finalising OnwardAir board deck" },
] as const;
