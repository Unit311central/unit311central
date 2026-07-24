"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  FileText,
  GitBranch,
  Loader2,
  Navigation,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  EaCardAction,
  EaCardField,
  EaExecutionCard,
  EaWorkflowStepView,
} from "@/lib/ai-operating-assistant/execution-cards";
import type { AssistantFollowUpAction } from "@/lib/ai-operating-assistant/tool-result";

export type ExecutionCardHandlers = {
  onCardAction?: (
    card: EaExecutionCard,
    action: EaCardAction,
    values?: Record<string, unknown>,
  ) => void;
  onFollowUp?: (action: AssistantFollowUpAction) => void;
};

function toneBorder(
  tone: EaExecutionCard["statusTone"],
  risk?: EaExecutionCard["riskLevel"],
) {
  if (risk === "critical" || tone === "danger") return "border-rose-400/35 bg-rose-500/[0.08]";
  if (risk === "high" || tone === "warning") return "border-amber-400/30 bg-amber-500/[0.07]";
  if (tone === "success") return "border-emerald-400/30 bg-emerald-500/[0.07]";
  if (tone === "info") return "border-sky-400/30 bg-sky-500/[0.07]";
  return "border-white/12 bg-white/[0.03]";
}

function FieldRows({ fields }: { fields?: EaCardField[] }) {
  if (!fields?.length) return null;
  return (
    <dl className="mt-2.5 space-y-2">
      {fields.map((field) => (
        <div key={field.key} className="min-w-0">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
            {field.label}
            {field.required ? <span className="text-amber-200/80"> *</span> : null}
          </dt>
          <dd className="mt-0.5 text-[12px] text-white/80">
            {field.value == null || field.value === "" ? (
              <span className="text-white/35">—</span>
            ) : (
              String(field.value)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ActionButtons({
  actions,
  onAction,
  busy,
}: {
  actions?: EaCardAction[];
  onAction: (action: EaCardAction) => void;
  busy?: boolean;
}) {
  if (!actions?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => {
        const variant = action.variant ?? "secondary";
        return (
          <button
            key={action.id}
            type="button"
            disabled={busy}
            onClick={() => onAction(action)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              variant === "primary" &&
                "border border-sky-300/50 bg-sky-400/20 text-sky-50 hover:bg-sky-400/30",
              variant === "danger" &&
                "border border-rose-300/50 bg-rose-500/20 text-rose-50 hover:bg-rose-500/30",
              variant === "secondary" &&
                "border border-white/15 text-white/70 hover:border-white/25 hover:text-white",
              variant === "ghost" && "border border-transparent text-white/55 hover:text-white",
            )}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

function NextActions({
  actions,
  onFollowUp,
}: {
  actions?: AssistantFollowUpAction[];
  onFollowUp?: (action: AssistantFollowUpAction) => void;
}) {
  if (!actions?.length || !onFollowUp) return null;
  return (
    <div className="mt-3 border-t border-white/10 pt-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
        Suggested next steps
      </p>
      <ul className="mt-1.5 space-y-1">
        {actions.map((action) => (
          <li key={action.id}>
            <button
              type="button"
              onClick={() => onFollowUp(action)}
              className="text-left text-[12px] text-sky-100/90 underline-offset-2 hover:underline"
            >
              • {action.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepList({ steps }: { steps?: EaWorkflowStepView[] }) {
  if (!steps?.length) return null;
  return (
    <ol className="mt-2.5 space-y-1.5">
      {steps.map((step, index) => (
        <li
          key={step.id}
          className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-2"
        >
          <span className="mt-0.5">
            {step.status === "succeeded" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            ) : step.status === "running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-300" />
            ) : step.status === "failed" ? (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
            ) : (
              <Circle
                className={cn(
                  "h-3.5 w-3.5",
                  step.status === "ready" ? "text-sky-300" : "text-white/30",
                )}
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-white/90">
              {index + 1}. {step.label}
            </p>
            {step.detail ? (
              <p className="mt-0.5 text-[10px] text-white/45">{step.detail}</p>
            ) : null}
          </div>
          <span className="text-[10px] uppercase tracking-wide text-white/35">{step.status}</span>
        </li>
      ))}
    </ol>
  );
}

function CardChrome({
  card,
  icon,
  children,
}: {
  card: EaExecutionCard;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        toneBorder(card.statusTone, card.riskLevel),
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-sky-200">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white/95">{card.title}</p>
          {card.subtitle ? (
            <p className="mt-0.5 text-[11px] text-white/55">{card.subtitle}</p>
          ) : null}
        </div>
        {card.riskLevel ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
            {card.riskLevel}
          </span>
        ) : null}
      </div>
      {card.body ? (
        <p className="mt-2 text-[12px] leading-relaxed text-white/70">{card.body}</p>
      ) : null}
      {children}
    </div>
  );
}

function CreationFormCardView({
  card,
  handlers,
}: {
  card: EaExecutionCard;
  handlers: ExecutionCardHandlers;
}) {
  const initial: Record<string, string> = {};
  for (const field of card.fields ?? []) {
    initial[field.key] = field.value == null ? "" : String(field.value);
  }
  const [values, setValues] = useState(initial);

  return (
    <CardChrome card={card} icon={<FileText className="h-4 w-4" />}>
      <div className="mt-2.5 space-y-2.5">
        {(card.fields ?? []).map((field) => (
          <label key={field.key} className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              {field.label}
              {field.required ? <span className="text-amber-200/80"> *</span> : null}
            </span>
            {field.inputType === "textarea" ? (
              <textarea
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={3}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/25 px-2.5 py-2 text-[12px] text-white/90 outline-none placeholder:text-white/30 focus:border-sky-400/40"
              />
            ) : (
              <input
                type={field.inputType === "number" ? "number" : "text"}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-lg border border-white/12 bg-black/25 px-2.5 py-2 text-[12px] text-white/90 outline-none placeholder:text-white/30 focus:border-sky-400/40"
              />
            )}
          </label>
        ))}
      </div>
      <ActionButtons
        actions={card.actions}
        onAction={(action) => handlers.onCardAction?.(card, action, values)}
      />
    </CardChrome>
  );
}

function cardIcon(kind: EaExecutionCard["kind"]) {
  switch (kind) {
    case "workflow":
      return <GitBranch className="h-4 w-4" />;
    case "confirmation":
    case "risk":
      return <ShieldAlert className="h-4 w-4" />;
    case "approval":
      return <ShieldCheck className="h-4 w-4" />;
    case "document":
      return <FileText className="h-4 w-4" />;
    case "navigation":
      return <Navigation className="h-4 w-4" />;
    case "execution_progress":
      return <Loader2 className="h-4 w-4 animate-spin" />;
    default:
      return <CheckCircle2 className="h-4 w-4" />;
  }
}

export function ExecutionCardView({
  card,
  handlers,
  busy,
}: {
  card: EaExecutionCard;
  handlers: ExecutionCardHandlers;
  busy?: boolean;
}) {
  if (card.kind === "creation_form") {
    return <CreationFormCardView card={card} handlers={handlers} />;
  }

  return (
    <CardChrome card={card} icon={cardIcon(card.kind)}>
      {card.kind === "execution_progress" ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-white/45">
            <span>Progress</span>
            <span>{card.progressPct ?? 0}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-sky-400/70 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, card.progressPct ?? 0))}%` }}
            />
          </div>
        </div>
      ) : null}

      {card.kind === "workflow" || card.kind === "execution_progress" ? (
        <StepList steps={card.steps} />
      ) : (
        <FieldRows fields={card.fields} />
      )}

      <ActionButtons
        actions={card.actions}
        busy={busy}
        onAction={(action) => {
          if (action.href && (action.intent === "navigate" || action.intent === "open")) {
            if (typeof window !== "undefined") window.location.assign(action.href);
            return;
          }
          handlers.onCardAction?.(card, action);
        }}
      />
      <NextActions actions={card.nextActions} onFollowUp={handlers.onFollowUp} />
    </CardChrome>
  );
}

export function ExecutionCardsList({
  cards,
  handlers,
  busy,
  className,
}: {
  cards: EaExecutionCard[];
  handlers: ExecutionCardHandlers;
  busy?: boolean;
  className?: string;
}) {
  if (!cards.length) return null;
  return (
    <div className={cn("space-y-2.5", className)}>
      {cards.map((card) => (
        <ExecutionCardView key={card.id} card={card} handlers={handlers} busy={busy} />
      ))}
    </div>
  );
}
