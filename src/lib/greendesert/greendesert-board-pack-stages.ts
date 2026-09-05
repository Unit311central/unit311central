/** Client-safe Green Desert board deck generation stage labels. */

export const GREENDESERT_BOARD_PACK_STAGES = [
  { id: "actions", label: "Reviewing previous board actions" },
  { id: "risk", label: "Analysing reactor deployment risks" },
  { id: "kpi", label: "Analysing pilot KPIs and milestones" },
  { id: "finance", label: "Analysing cash runway and opex" },
  { id: "fundraising", label: "Analysing Series A pipeline" },
  { id: "ops", label: "Reviewing Jeddah pilot and logistics" },
  { id: "strategy", label: "Identifying strategic discussion topics" },
  { id: "final", label: "Finalising Green Desert board deck" },
] as const;
