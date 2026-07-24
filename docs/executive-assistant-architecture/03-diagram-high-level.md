# 03 - Diagram: High-Level Architecture

Mermaid source: /architecture/executive-assistant/diagrams/01-high-level-architecture.mmd

`mermaid
flowchart TB
  Browser["Browser<br/>CEO / Internal User"]
  FE["Frontend<br/>ExecutiveAssistantPanel<br/>PlanViewer · ExecutionCards<br/>GuidedLearning · Voice"]
  API["API Layer<br/>/api/executive-assistant/*"]
  AI["AI Services<br/>assistant-runtime<br/>action-orchestration<br/>OpenAI Responses API<br/>Tool registry"]
  DB[("Supabase Postgres<br/>conversations · plans<br/>audit · feedback · goals")]
  Storage[("Supabase Storage<br/>assistant-artifacts")]
  Ext["External Services<br/>OpenAI · Wise · Email<br/>Business domain services"]

  Browser --> FE
  FE --> API
  API --> AI
  AI --> DB
  AI --> Storage
  AI --> Ext
  API --> DB
`
