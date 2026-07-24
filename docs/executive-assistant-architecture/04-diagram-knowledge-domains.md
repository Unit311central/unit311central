# 04 - Diagram: Knowledge Domains

Mermaid source: /architecture/executive-assistant/diagrams/02-knowledge-domains.mmd

`mermaid
flowchart LR
  MSG[User message]
  CLS[classifyKnowledgeDomain]
  P[PLATFORM<br/>Application Catalogue]
  C[CAPABILITY<br/>Action Registry]
  B[BUSINESS<br/>Live data tools]
  W[WRITE<br/>Action Framework]

  MSG --> CLS
  CLS -->|platform language| P
  CLS -->|capability discovery| C
  CLS -->|live business Q| B
  CLS -->|create/update/signed| W
  P --> ANS1[Deterministic catalogue answer]
  C --> ANS2[Capability graph answer]
  B --> TOOLS[search* / queryBusiness / insights]
  W --> PLAN[proposeBusinessActionPlan]
  PLAN --> PV[Plan Viewer Approve]
  PV --> EXEC[executeActionPlan]
`
