# 09 - Diagram: Component Hierarchy

Mermaid source: /architecture/executive-assistant/diagrams/07-component-hierarchy.mmd

`mermaid
flowchart TB
  WS[ExecutiveAssistantWorkspace]
  OC[ExecutiveOperatingCentre]
  PANEL[ExecutiveAssistantPanel]
  PV[PlanViewer]
  EC[ExecutionCards]
  GL[GuidedLearningProvider + Overlay]
  FB[AssistantFeedbackButtons]
  EX[ExplanationPanel]
  VOICE[useExecutiveVoice + TTS]
  PRO[ExecutiveProactiveLayer]

  WS --> OC
  OC --> PANEL
  OC --> PRO
  PANEL --> PV
  PANEL --> EC
  PANEL --> GL
  PANEL --> FB
  PANEL --> EX
  PANEL --> VOICE
`
