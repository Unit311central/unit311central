/** Client-safe Board Pack generation stage labels (ABHI demo UX). */

export const ABHI_BOARD_PACK_STAGES = [
  { id: "actions", label: "Reviewing previous board actions" },
  { id: "risk", label: "Analysing risk register" },
  { id: "kpi", label: "Analysing KPI performance" },
  { id: "finance", label: "Analysing financial performance" },
  { id: "commercial", label: "Analysing commercial performance" },
  { id: "org", label: "Reviewing organisational changes" },
  { id: "strategy", label: "Identifying strategic discussion topics" },
  { id: "pptx", label: "Creating PowerPoint presentation" },
  { id: "final", label: "Finalising board pack" },
] as const;
