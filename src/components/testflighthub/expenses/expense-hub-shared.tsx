"use client";

import { cn } from "@/lib/utils";

export async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

export function expenseInputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

export function SectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; hidden?: boolean }>;
  active: string;
  onChange: (id: string) => void;
}) {
  const visible = tabs.filter((tab) => !tab.hidden);
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
            active === tab.id
              ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
              : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type ExpenseHubSection =
  | "my"
  | "add"
  | "all"
  | "approvals"
  | "runs"
  | "config";

export function resolveExpenseHubSection(value: string | null): ExpenseHubSection {
  if (
    value === "add" ||
    value === "all" ||
    value === "approvals" ||
    value === "runs" ||
    value === "config"
  ) {
    return value;
  }
  return "my";
}

export const EXPENSE_SECTION_COPY: Record<
  ExpenseHubSection,
  { title: string; description: string }
> = {
  my: {
    title: "My Expenses",
    description: "Your submitted claims, drafts, and reimbursement status.",
  },
  add: {
    title: "Add Expense",
    description: "Capture a reimbursable expense with receipt and submit for approval.",
  },
  all: {
    title: "All Expenses",
    description: "Workspace-wide expense management for finance and administrators.",
  },
  approvals: {
    title: "Approvals",
    description: "Review submitted expenses, approve, reject, or request changes.",
  },
  runs: {
    title: "Expense Runs",
    description: "Payment runs separate from payroll — schedule and mark reimbursements paid.",
  },
  config: {
    title: "Configuration",
    description: "Categories, billing codes, mileage rates, and payment schedule.",
  },
};
