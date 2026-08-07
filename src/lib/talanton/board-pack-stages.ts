/** Talanton Board Deck generation stage labels (10-slide structure). */

export const TALANTON_BOARD_PACK_STAGES = [
  { id: "minutes", label: "Reviewing previous board minutes and decisions" },
  { id: "risk", label: "Analysing risk register" },
  { id: "funds", label: "Analysing fund performance" },
  { id: "portfolio", label: "Summarising portfolio company performance" },
  { id: "impact", label: "Compiling impact intelligence and external access" },
  { id: "journeys", label: "Selecting journey and impact stories" },
  { id: "training", label: "Reviewing training and compliance progress" },
  { id: "strategy", label: "Identifying strategic discussion topics" },
  { id: "pptx", label: "Creating PowerPoint presentation" },
  { id: "final", label: "Finalising board deck" },
] as const;
