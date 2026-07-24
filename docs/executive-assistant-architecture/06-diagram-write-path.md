# 06 - Diagram: Write Path

Mermaid source: /architecture/executive-assistant/diagrams/04-write-path.mmd

`mermaid
sequenceDiagram
  participant U as User
  participant UI as Panel + PlanViewer
  participant CHAT as POST /chat
  participant PROP as proposeBusinessActionPlan
  participant STORE as plan-store / Supabase
  participant PLAN as POST /actions/plans/{id}
  participant PIPE as execution-pipeline
  participant DOM as Domain services
  participant AUD as action_audit

  U->>CHAT: "We've signed Acme" / "Create project…"
  CHAT->>PROP: Capability match + plan
  PROP->>STORE: save proposed plan
  CHAT-->>UI: Approval / creation_form / workflow cards
  U->>UI: Approve (high-risk confirm if needed)
  UI->>PLAN: POST execute
  PLAN->>PIPE: executeActionPlan()
  PIPE->>DOM: registered action handlers
  DOM-->>PIPE: before/after state
  PIPE->>AUD: audit rows
  PIPE->>STORE: plan status completed
  PLAN-->>UI: success + nextActions
`
