# Unit311 Central — Executive AI Platform

Living Architecture reference for the **Executive AI Platform** on Unit311 Central.

Internal docs home: Unit311 Details → **Executive AI Platform** (`ai-agent`)  
Surface: Internal Operations → Command Centre home + floating Operating Assistant

---

## Purpose

Give operators a single AI operating layer that:

1. Surfaces a live **Executive Command Centre** (brief, health, risks, finance pulse)
2. Runs an **AI Operating Assistant** with tools, streaming chat, and persisted conversations
3. Teaches the product via **Guided Learning** and **Workflow Registry**
4. Remains trustworthy via **Explainability** and anonymous **Feedback**
5. Never presents mock or placeholder values as live business metrics

---

## High-level architecture

```
Browser (Internal Ops shell)
  ├─ Executive Command Centre (InternalDashboardHome)
  ├─ Platform Floating Assistant → ExecutiveAssistantPanel (drawer)
  ├─ Executive Assistant Workspace (page variant)
  ├─ GuidedLearningProvider + Overlay
  └─ ExecutiveProactiveLayer
           │
           ▼
Next.js App Router APIs (authenticated platform session)
  ├─ POST /api/executive-assistant/proactive
  ├─ POST /api/executive-assistant/chat          (operating SSE + legacy {messages})
  ├─ /api/executive-assistant/conversations[/id]
  └─ /api/executive-assistant/feedback
           │
           ▼
src/lib/ai-operating-assistant/*
  ├─ context / insight / brief / health services  → live Supabase domain services
  ├─ assistant-runtime + tool-service             → OpenAI Responses API
  ├─ conversation-service / feedback-service      → service-role Supabase client
  ├─ guided-learning + workflow-registry
  └─ explainability
           │
           ▼
Supabase Postgres
  ├─ Domain tables (projects, clients, CRM, HR, invoices, …)
  ├─ executive_assistant_conversations   (migration 101, RLS on, no open policies)
  ├─ executive_assistant_feedback        (migration 102)
  └─ executive_assistant_quality_events  (migration 102)
```

---

## Executive Command Centre

Home dashboard panels:

| Panel | Source |
| --- | --- |
| Executive Brief | `buildDailyExecutiveBrief` via proactive API |
| Business Health | `buildBusinessHealthScore` |
| Needs Attention | Critical/high insights |
| Projects at Risk | Project-category insights + live overdue projects |
| Financial Pulse | Live `invoices` ledger only |

Unavailable domains render **Data unavailable** — never fabricated revenue, debtors mocks, or careers pipeline counts.

---

## AI Operating Assistant

| Concern | Implementation |
| --- | --- |
| UI | `ExecutiveAssistantPanel` posts `{ message, conversationId, stream: true, … }` |
| Runtime | `runAssistantTurn` → OpenAI tools loop + SSE events |
| Legacy | `{ messages }` still accepted on chat route for backward compatibility only |
| Tools | Live domain search/report tools; data gaps declared when storage missing |
| Conversations | Supabase via **service role** (matches RLS model) |
| Explainability | `ExplanationPanel` + evidence / confidence / drill-downs |
| Feedback | Anonymous POST → `executive_assistant_feedback` via service role |

---

## Guided Learning & Workflow Registry

- `GuidedLearningProvider` wraps the internal shell when platform AI is visible
- Page targets use `data-ai-target`; missing targets fail soft (explanation still shown)
- `workflow-registry.ts` drives multi-step guides via `startWorkflowGuide`

---

## Proactive Intelligence

`ExecutiveProactiveLayer` loads brief / notifications / release intel without blocking the shell. Failures are swallowed; Command Centre independently requests insights for the home tiles.

---

## Enterprise UI

Tokens live in `src/lib/enterprise-ui.ts` and CSS variables `--u311-*` in `globals.css`. Shared primitives in `src/components/enterprise/EnterpriseUi.tsx`. Command Centre consumes tokens; wholesale workspace restyle is out of scope.

---

## Security model

| Item | Rule |
| --- | --- |
| OpenAI | `OPENAI_API_KEY` server-only |
| Conversations / feedback / quality | `SUPABASE_SERVICE_ROLE_KEY` server-only; RLS enabled; **no open policies** |
| Chat / proactive / conversations | Require platform session (401 if missing) |
| Feedback | Anonymous by design (no user id stored); still written server-side with service role |
| Browser clients | Anon key only — never granted write access to EA tables |

---

## Environment variables

| Variable | Role |
| --- | --- |
| `OPENAI_API_KEY` | Operating Assistant model calls |
| `OPENAI_ASSISTANT_MODEL` | Optional model override |
| `SUPABASE_URL` | Database |
| `SUPABASE_ANON_KEY` | General app server/browser access |
| `SUPABASE_SERVICE_ROLE_KEY` | EA conversation + trust table writes |

---

## Migration history

| Migration | Purpose |
| --- | --- |
| `101_executive_assistant_conversations.sql` | Conversation memory table + RLS |
| `102_executive_assistant_trust.sql` | Feedback + quality events + RLS |

Apply with existing Unit311 migration tooling before relying on server persistence in production.

---

## Data flow (chat)

1. Operator sends message from floating drawer or EA workspace  
2. API authenticates session and builds business context  
3. Runtime loads/creates conversation (service role)  
4. OpenAI turn may call tools against live services  
5. SSE streams deltas / tool results / done  
6. Assistant message persisted; explainability + feedback available on the reply  

---

## Related Living Architecture diagrams

Architecture Viewer → **Executive AI Platform** (`ai-agent`) seed template.  
Platform Overview diagram marks the Executive AI node as **live**.
